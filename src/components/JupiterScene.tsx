import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import jupiterUrl from '../assets/textures/jupiter-4k.jpg';
import sunSurfaceUrl from '../assets/textures/sun-surface.jpg';
import earthUrl from '../assets/textures/earth-day.jpg';

/** GLSL 噪声工具：给太阳表面做域扭曲与米粒组织 */
const NOISE_GLSL = `
  float hash31(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash31(i+vec3(0,0,0)),hash31(i+vec3(1,0,0)),f.x),
                   mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),
                   mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z); }
  float fbm3(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*n3(p); p*=2.03; a*=0.5; } return v; }
`;

interface ParticleLayer {
  points: THREE.Points;
  mat: THREE.ShaderMaterial;
}

/** GPU 粒子层：从太阳表面诞生、向外漂移、逐渐淡出 */
function makeParticleLayer(
  count: number,
  sizeMin: number,
  sizeMax: number,
  speed: number,
  spread: number,
  tintInner: string,
  tintOuter: string,
  sunRadius: number,
  focal: number
): ParticleLayer {
  const dir = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const size = new Float32Array(count);
  const rnd = makeRng(count * 73 + 9);
  for (let i = 0; i < count; i++) {
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    dir[i * 3] = Math.sin(ph) * Math.cos(th);
    dir[i * 3 + 1] = Math.cos(ph);
    dir[i * 3 + 2] = Math.sin(ph) * Math.sin(th);
    seed[i] = rnd();
    size[i] = sizeMin + rnd() * (sizeMax - sizeMin);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uR: { value: sunRadius },
      uSpeed: { value: speed },
      uSpread: { value: spread },
      uInner: { value: new THREE.Color(tintInner) },
      uOuter: { value: new THREE.Color(tintOuter) },
      uFocal: { value: focal },
    },
    vertexShader: `
      attribute vec3 aDir; attribute float aSeed; attribute float aSize;
      uniform float uTime,uR,uSpeed,uSpread,uFocal;
      uniform vec3 uInner,uOuter;
      varying float vA; varying vec3 vC;
      void main(){
        float t=fract(aSeed+uTime*uSpeed);
        float r=uR*(1.0+uSpread*t*t);
        vec3 p=aDir*r;
        float w=uR*0.035*t;
        p+=vec3(sin(aSeed*71.0+uTime*1.7),cos(aSeed*53.0+uTime*1.3),sin(aSeed*97.0-uTime*1.1))*w;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(aSize*uFocal/max(1.0,-mv.z),1.0,44.0)*(1.0-t*0.65);
        vA=(1.0-t)*(1.0-t)*1.55;
        vC=mix(uInner,uOuter,t);
      }`,
    fragmentShader: `
      varying float vA; varying vec3 vC;
      void main(){
        vec2 q=gl_PointCoord-0.5; float d=length(q); if(d>0.5)discard;
        float a=smoothstep(0.5,0.0,d)*vA;
        gl_FragColor=vec4(vC*a,a);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, mat };
}

interface JupiterSceneProps {
  active?: boolean;
  /** 相机与木星的距离：越大行星越小、构图越松。默认 4.25（原首屏） */
  distance?: number;
  /** 木星相对相机轴的横向偏移：越大越靠右。默认 1.25（原首屏） */
  offsetX?: number;
  /** 轨道起始角度（弧度）：决定太阳与地球在画面里的方位。默认 0（原首屏） */
  orbitAngle?: number;
}

type MoonKind = 'europa' | 'io' | 'ganymede' | 'callisto';

interface MoonSpec {
  kind: MoonKind;
  radius: number;
  orbit: number;
  speed: number;
  phase: number;
  tilt: number;
  color: string;
}

const GALILEAN_MOONS: MoonSpec[] = [
  { kind: 'io', radius: 0.09, orbit: 2.05, speed: 0.22, phase: 2.7, tilt: 0.05, color: '#c9a24a' },
  { kind: 'europa', radius: 0.095, orbit: 2.5, speed: 0.12, phase: 2.12, tilt: -0.04, color: '#d6d0c0' },
  { kind: 'ganymede', radius: 0.13, orbit: 3.0, speed: 0.07, phase: 2.61, tilt: 0.03, color: '#8d8375' },
  { kind: 'callisto', radius: 0.12, orbit: 3.5, speed: 0.035, phase: 2.29, tilt: -0.06, color: '#6b6054' },
];

function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeMoonTexture(kind: MoonKind): THREE.CanvasTexture {
  const W = 1024;
  const H = 512;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  if (!g) return new THREE.CanvasTexture(cv);

  const rnd = makeRng(kind.length * 9871 + 17);

  const blob = (x: number, y: number, r: number, color: string) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };

  const crater = (x: number, y: number, r: number) => {
    blob(x, y, r * 1.3, 'rgba(40,34,28,0.30)');
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(228,218,198,0.26)';
    g.lineWidth = Math.max(1, r * 0.14);
    g.stroke();
    blob(x + r * 0.28, y + r * 0.28, r * 0.75, 'rgba(24,19,15,0.24)');
  };

  if (kind === 'europa') {
    g.fillStyle = '#d6d0c0';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 180; i++) {
      blob(
        rnd() * W,
        rnd() * H,
        24 + rnd() * 110,
        `rgba(${150 + Math.floor(rnd() * 45)},${165 + Math.floor(rnd() * 35)},${170 + Math.floor(rnd() * 30)},0.10)`
      );
    }
    for (let i = 0; i < 150; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const len = 90 + rnd() * 420;
      const angle = (rnd() - 0.5) * 0.8 + (rnd() < 0.5 ? 0.35 : -0.35);
      g.save();
      g.translate(x, y);
      g.rotate(angle);
      g.beginPath();
      g.moveTo(-len / 2, 0);
      g.bezierCurveTo(-len * 0.2, (rnd() - 0.5) * 34, len * 0.2, (rnd() - 0.5) * 34, len / 2, (rnd() - 0.5) * 12);
      g.strokeStyle = `rgba(${110 + Math.floor(rnd() * 45)},${62 + Math.floor(rnd() * 28)},${44 + Math.floor(rnd() * 24)},${0.24 + rnd() * 0.34})`;
      g.lineWidth = 0.8 + rnd() * 2;
      g.stroke();
      for (let b = 0; b < 2; b++) {
        const bx = (rnd() - 0.5) * len;
        g.beginPath();
        g.moveTo(bx, 0);
        g.lineTo(bx + (rnd() - 0.5) * 46, (rnd() - 0.5) * 64);
        g.strokeStyle = 'rgba(120,70,50,0.30)';
        g.lineWidth = 0.6;
        g.stroke();
      }
      g.restore();
    }
    for (let i = 0; i < 20; i++) crater(rnd() * W, rnd() * H, 3 + rnd() * 12);
  } else if (kind === 'io') {
    g.fillStyle = '#c9a24a';
    g.fillRect(0, 0, W, H);
    const palette = [
      'rgba(236,210,124,0.38)',
      'rgba(184,116,42,0.30)',
      'rgba(244,228,164,0.30)',
      'rgba(150,80,30,0.24)',
      'rgba(214,160,64,0.26)',
    ];
    for (let i = 0; i < 240; i++) {
      blob(rnd() * W, rnd() * H, 18 + rnd() * 120, palette[Math.floor(rnd() * palette.length)]);
    }
    for (let i = 0; i < 80; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const r = 2.5 + rnd() * 15;
      blob(x, y, r * 1.6, 'rgba(52,28,14,0.42)');
      blob(x, y, r * 0.8, 'rgba(28,14,8,0.5)');
      g.beginPath();
      g.arc(x, y, r * 1.25, 0, Math.PI * 2);
      g.strokeStyle = 'rgba(240,214,140,0.22)';
      g.lineWidth = 1;
      g.stroke();
    }
  } else if (kind === 'ganymede') {
    g.fillStyle = '#8d8375';
    g.fillRect(0, 0, W, H);
    const polar = g.createLinearGradient(0, 0, 0, H);
    polar.addColorStop(0, 'rgba(214,208,196,0.34)');
    polar.addColorStop(0.18, 'rgba(214,208,196,0)');
    polar.addColorStop(0.82, 'rgba(214,208,196,0)');
    polar.addColorStop(1, 'rgba(214,208,196,0.30)');
    g.fillStyle = polar;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) {
      blob(
        rnd() * W,
        rnd() * H,
        20 + rnd() * 100,
        rnd() < 0.5 ? 'rgba(62,55,47,0.22)' : 'rgba(196,190,178,0.16)'
      );
    }
    for (let i = 0; i < 70; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const len = 60 + rnd() * 260;
      g.save();
      g.translate(x, y);
      g.rotate((rnd() - 0.5) * 0.4);
      g.beginPath();
      g.moveTo(-len / 2, 0);
      g.lineTo(len / 2, 0);
      g.strokeStyle = rnd() < 0.5 ? 'rgba(58,52,45,0.22)' : 'rgba(206,200,188,0.18)';
      g.lineWidth = 0.8 + rnd() * 2;
      g.stroke();
      g.restore();
    }
    for (let i = 0; i < 80; i++) crater(rnd() * W, rnd() * H, 3 + rnd() * 14);
  } else {
    g.fillStyle = '#6b6054';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 220; i++) {
      blob(
        rnd() * W,
        rnd() * H,
        18 + rnd() * 110,
        rnd() < 0.55 ? 'rgba(44,38,32,0.24)' : 'rgba(170,160,146,0.14)'
      );
    }
    for (let i = 0; i < 190; i++) crater(rnd() * W, rnd() * H, 2.5 + rnd() * 16);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function makeCloudTexture(): THREE.CanvasTexture | null {
  const W = 1024;
  const H = 512;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  if (!g) return null;
  const id = g.createImageData(W, H);
  const d = id.data;
  const gw = 64;
  const gh = 32;
  const gridA = new Float32Array(gw * gh);
  const rnd = makeRng(99);
  for (let i = 0; i < gridA.length; i++) gridA[i] = rnd();
  const sm = (t: number) => t * t * (3 - 2 * t);
  const samp = (u: number, v: number) => {
    const fx = u * gw;
    const fy = v * gh;
    const x0 = ((Math.floor(fx) % gw) + gw) % gw;
    const y0 = Math.max(0, Math.min(gh - 1, Math.floor(fy)));
    const x1 = (x0 + 1) % gw;
    const y1 = Math.min(gh - 1, y0 + 1);
    const tx = sm(fx - Math.floor(fx));
    const ty = sm(fy - Math.floor(fy));
    const a = gridA[y0 * gw + x0];
    const b = gridA[y0 * gw + x1];
    const c = gridA[y1 * gw + x0];
    const e = gridA[y1 * gw + x1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty;
  };
  for (let y = 0; y < H; y++) {
    const v = y / H;
    const band = 0.5 + 0.5 * Math.sin(v * Math.PI * 9);
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const n =
        0.55 * samp(u, v) +
        0.28 * samp((u * 2) % 1, (v * 2) % 1) +
        0.17 * samp((u * 4) % 1, (v * 4) % 1);
      let a = (n - 0.54) / (0.8 - 0.54);
      a = Math.max(0, Math.min(1, a));
      a = a * a * (3 - 2 * a);
      a *= (0.32 + 0.68 * band) * 0.34;
      const i = (y * W + x) * 4;
      d[i] = 255;
      d[i + 1] = 246;
      d[i + 2] = 230;
      d[i + 3] = a * 255;
    }
  }
  g.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.MirroredRepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function makeRingTexture(): THREE.CanvasTexture | null {
  const W = 768;
  const H = 8;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  if (!g) return null;
  const id = g.createImageData(W, H);
  const d = id.data;
  const rnd = makeRng(17);
  for (let x = 0; x < W; x++) {
    const u = x / (W - 1);
    let band =
      0.5 +
      0.22 * Math.sin(u * 11) +
      0.14 * Math.sin(u * 29 + 1) +
      0.06 * Math.sin(u * 70) +
      0.05 * (rnd() - 0.5);
    band = Math.max(0, Math.min(1, band));
    let gap = 1;
    if (u > 0.42 && u < 0.455) gap = 0.1;
    if (u > 0.68 && u < 0.7) gap = 0.3;
    const edge = Math.min(1, Math.min(u / 0.05, (1 - u) / 0.05));
    const a = Math.max(0, band * gap * edge) * 0.3;
    const r = 196 + 44 * band;
    const gg = 178 + 38 * band;
    const b = 150 + 32 * band;
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 4;
      d[i] = r;
      d[i + 1] = gg;
      d[i + 2] = b;
      d[i + 3] = a * 255;
    }
  }
  g.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function makeGlowTexture(): THREE.CanvasTexture | null {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const g = cv.getContext('2d');
  if (!g) return null;
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,236,205,0.75)');
  gr.addColorStop(0.3, 'rgba(255,214,160,0.32)');
  gr.addColorStop(0.66, 'rgba(230,170,110,0.08)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function JupiterScene({ active = true, distance = 4.25, offsetX = 1.25, orbitAngle = 0 }: JupiterSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    const isCompact = window.innerWidth < 900;
    let quality = Math.min(window.devicePixelRatio, isCompact ? 1.25 : 1.5);
    renderer.setPixelRatio(quality);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;

    const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 4.25);

    const group = new THREE.Group();
    group.position.set(1.25, -0.32, 0);
    group.rotation.set(0.36, 0, 0.34);
    scene.add(group);

    /* ---------------- 三体运动关系 ----------------
       太阳位于原点；木星与地球按真实半长轴比与周期比公转：
         a(木星) : a(地球) = 5.2044 : 1.5237
         T(木星) : T(地球) = 4332.59 : 686.98（地球快 6.31 倍）
       轨道半径整体做视觉压缩以适配首屏构图，比例本身保持真实；
       镜头与木星共动，所以木星始终定格在画面里，移动的是太阳与地球。 */
    const ORBIT_R_JUP = 8.62;
    const ORBIT_R_EARTH = ORBIT_R_JUP * (1.0 / 5.2044); // ≈ 1.66（地球 1 AU）
    const PERIOD_JUP_DAYS = 4332.59;
    const PERIOD_EARTH_DAYS = 365.256;
    const ORBIT_DAYS_PER_SEC = 0.6; // 地球约 19 分钟一圈，木星约 2 小时一圈
    const U0 = new THREE.Vector3(3.65, -3.02, 7.2).normalize(); // 木星初始方位
    const V0 = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), U0).normalize();
    const Z_AXIS = new THREE.Vector3(0, 0, 1);
    const orbitU = new THREE.Vector3().copy(U0);
    const orbitV = new THREE.Vector3().copy(V0);
    const EARTH_PHASE0 = (Math.PI * 8) / 180; // 接近轨道上离镜头最近的点，同时避开太阳圆面
    let orbitDays = (orbitAngle / (Math.PI * 2)) * PERIOD_JUP_DAYS;
    const jupPos = new THREE.Vector3();
    const orbitTmp = new THREE.Vector3();

    /* 响应式构图：竖屏水平视野窄，太阳会被挤出画框。
       做法是按宽高比缩放轨道 + 绕视线轴滚转，把太阳放进标题上方的空白带，
       同时略微拉远镜头，让太阳与地球都留在画面内。 */
    const layout = { scale: 1, distance, offsetX };
    const applyLayout = () => {
      const aspect = window.innerWidth / window.innerHeight;
      const p = THREE.MathUtils.clamp((1.25 - aspect) / 0.65, 0, 1); // 0=横屏，1=手机竖屏
      layout.scale = 1 - 0.534 * p;
      layout.distance = distance * (1 + 0.55 * p);
      layout.offsetX = offsetX * (1 + 0.3 * p);
      const roll = -0.55 * p;
      orbitU.copy(U0).applyAxisAngle(Z_AXIS, roll);
      orbitV.copy(V0).applyAxisAngle(Z_AXIS, roll);
    };
    applyLayout();

    const orbitPoint = (radius: number, angle: number, out: THREE.Vector3) => {
      const r = radius * layout.scale;
      return out
        .copy(orbitU)
        .multiplyScalar(Math.cos(angle) * r)
        .addScaledVector(orbitV, Math.sin(angle) * r);
    };

    const lightDir = new THREE.Vector3(-0.32, 0.42, 0.86).normalize();
    const sunLight = new THREE.DirectionalLight(0xfff2e0, 3.2);
    sunLight.position.copy(lightDir).multiplyScalar(12);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x26303a, 0.5));
    scene.add(new THREE.HemisphereLight(0xbfd2e6, 0x1a0f08, 0.38));

    const planetBody = new THREE.Group();
    planetBody.scale.set(1, 0.94, 1);
    group.add(planetBody);

    const planetMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null },
        uHasMap: { value: 0 },
        uLight: { value: lightDir },
      },
      vertexShader: `
        varying vec3 vN; varying vec3 vV; varying vec2 vUv;
        void main(){ vUv = uv; vN = normalize(normalMatrix*normal);
          vec4 mv = modelViewMatrix*vec4(position,1.0); vV = mv.xyz;
          gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `
        uniform sampler2D uMap; uniform float uHasMap; uniform vec3 uLight;
        varying vec3 vN; varying vec3 vV; varying vec2 vUv;

        float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }

        void main(){
          vec3 col = texture2D(uMap, vUv).rgb;
          if(uHasMap < 0.5) col = vec3(0.38,0.30,0.22);

          float lum = luma(col);
          col = mix(vec3(lum), col, 1.28);

          vec3 N = normalize(vN);
          float ndl = dot(N, normalize(uLight));
          float lit = smoothstep(-0.08, 0.6, ndl);
          col *= (0.07 + 0.93 * lit);

          float limb = pow(max(ndl, 0.0), 0.36);
          col *= mix(0.58, 1.0, limb);

          vec3 V = normalize(-vV);
          float fres = pow(1.0 - max(dot(normalize(vN), V), 0.0), 2.2);
          col = mix(col, vec3(0.8, 0.7, 0.54), fres * 0.13 * smoothstep(-0.1, 0.5, ndl));

          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });

    const planet = new THREE.Mesh(new THREE.SphereGeometry(1.55, 160, 160), planetMat);
    planetBody.add(planet);

    const jupiterTex = new THREE.TextureLoader().load(jupiterUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      planetMat.uniforms.uMap.value = tex;
      planetMat.uniforms.uHasMap.value = 1;
    });
    jupiterTex.colorSpace = THREE.SRGBColorSpace;

    const atmoMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main(){ vN = normalize(normalMatrix*normal);
          vec4 mv = modelViewMatrix*vec4(position,1.0); vV = mv.xyz;
          gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `
        varying vec3 vN; varying vec3 vV;
        void main(){
          vec3 V = normalize(-vV);
          float f = pow(1.0 - abs(dot(normalize(vN), V)), 3.0);
          gl_FragColor = vec4(vec3(0.86, 0.72, 0.52) * f * 0.55, f * 0.34);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.575, 48, 48), atmoMat);
    atmo.renderOrder = 3;
    planetBody.add(atmo);

    const cloudTex = makeCloudTexture();
    if (cloudTex) {
      cloudTex.anisotropy = maxAniso;
      const cloudMat = new THREE.MeshStandardMaterial({
        map: cloudTex,
        transparent: true,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
        opacity: 0.14,
      });
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.562, 80, 80), cloudMat);
      clouds.rotation.z = 0.04;
      clouds.renderOrder = 2;
      planetBody.add(clouds);
      planetBody.userData.clouds = clouds;
    }

    const ringMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uRing: { value: makeRingTexture() },
        uInner: { value: 1.72 },
        uOuter: { value: 1.95 },
      },
      vertexShader: `varying vec3 vL; void main(){ vL=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform sampler2D uRing; uniform float uInner; uniform float uOuter; varying vec3 vL;
        void main(){
          float r = length(vL.xy);
          float u = clamp((r-uInner)/(uOuter-uInner), 0.0, 1.0);
          vec4 c = texture2D(uRing, vec2(u,0.5));
          if(c.a < 0.01) discard;
          gl_FragColor = vec4(c.rgb, c.a * 0.55);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.72, 1.95, 192, 1), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 1;
    group.add(ring);

    const glowTex = makeGlowTexture();
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.32,
      })
    );
    glow.scale.set(10, 10, 1);
    glow.position.set(0, 0, -1.6);
    group.add(glow);

    const animatedMoons: Array<{ orbit: THREE.Group; mesh: THREE.Mesh; speed: number; phase: number; kind: string }> = [];

    for (const spec of GALILEAN_MOONS) {
      const orbit = new THREE.Group();
      orbit.rotation.x = spec.tilt;
      group.add(orbit);

      const tex = makeMoonTexture(spec.kind);
      tex.anisotropy = maxAniso;
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        color: 0xffffff,
        roughness: 0.95,
        metalness: 0,
        bumpMap: tex,
        bumpScale: 0.0035,
        // 暗面也保留一点自身反射，避免卫星在画面里变成一团黑影
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: 0.9,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.radius, 32, 32), mat);
      mesh.position.x = spec.orbit;
      orbit.add(mesh);
      animatedMoons.push({ orbit, mesh, speed: spec.speed, phase: spec.phase, kind: spec.kind });
    }

    const smallMoonGeo = new THREE.SphereGeometry(1, 8, 6);
    const smallMoonMat = new THREE.MeshStandardMaterial({ color: 0x8a8175, roughness: 1, metalness: 0 });
    const smallRnd = makeRng(4242);
    for (let i = 0; i < 18; i++) {
      const orbit = new THREE.Group();
      orbit.rotation.x = (smallRnd() - 0.5) * 0.5;
      orbit.rotation.z = (smallRnd() - 0.5) * 0.4;
      group.add(orbit);
      const mesh = new THREE.Mesh(smallMoonGeo, smallMoonMat);
      const size = 0.007 + smallRnd() * 0.014;
      mesh.scale.setScalar(size);
      mesh.position.x = 2.3 + smallRnd() * 2.4;
      orbit.add(mesh);
      animatedMoons.push({
        orbit,
        mesh,
        speed: 0.05 + smallRnd() * 0.16,
        phase: smallRnd() * Math.PI * 2,
        kind: `small-${i}`,
      });
    }

    if (import.meta.env.DEV) {
      (window as unknown as { __bloom?: unknown }).__bloom = {
        THREE,
        scene,
        camera,
        moons: animatedMoons,
        renderer,
        planet,
        planetBody,
        clouds: planetBody.userData.clouds,
        atmo,
        ring,
      };
    }

    /* ---------------- 太阳：真实色球层贴图 + 粒子日冕 ---------------- */
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, 0, 0); // 轨道中心
    scene.add(sunGroup);

    const sunRadius = 0.34;
    const sunMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMap: { value: null }, uHasMap: { value: 0 } },
      vertexShader: `
        varying vec3 vP; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
        void main(){ vP = position; vUv = uv; vN = normalize(normalMatrix*normal);
          vec4 mv = modelViewMatrix*vec4(position,1.0); vV = mv.xyz;
          gl_Position = projectionMatrix*mv; }`,
      fragmentShader:
        NOISE_GLSL +
        `
        uniform float uTime; uniform sampler2D uMap; uniform float uHasMap;
        varying vec3 vP; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
        void main(){
          vec3 p = normalize(vP);
          float t = uTime * 0.018;
          // 用噪声域扭曲等距柱状 UV，让等离子体真正在流动
          vec2 w = vec2(fbm3(p*2.6+vec3(t,0.0,0.0)), fbm3(p*2.6+vec3(0.0,t,7.3))) - 0.5;
          vec2 uv = vUv + w*0.028 + vec2(t*0.010, 0.0);
          vec3 base = texture2D(uMap, uv).rgb;
          if(uHasMap < 0.5) base = vec3(0.92, 0.38, 0.06);
          // 米粒组织 + 活动区亮丝
          float gran = fbm3(p*34.0 + vec3(0.0, t*2.4, 0.0));
          float fil  = fbm3(p*8.0  - vec3(t*1.1, 0.0, 3.0));
          vec3 col = base * (0.80 + 0.46*gran);
          col += vec3(0.70,0.30,0.04) * pow(max(0.0, fil-0.56), 2.0) * 3.0;
          // 临边昏暗 + 一层薄色球边缘
          vec3 V = normalize(-vV);
          float f = pow(1.0 - max(dot(normalize(vN), V), 0.0), 2.0);
          col *= mix(1.0, 0.70, f);
          col += vec3(1.0,0.40,0.07) * pow(f, 3.2) * 0.85;
          col *= 1.28;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
      toneMapped: false,
    });
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(sunRadius, 128, 128), sunMat);
    sunGroup.add(sunMesh);

    const sunTex = new THREE.TextureLoader().load(sunSurfaceUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      sunMat.uniforms.uMap.value = tex;
      sunMat.uniforms.uHasMap.value = 1;
    });
    sunTex.colorSpace = THREE.SRGBColorSpace;

    const particleDensity = isCompact ? 0.42 : 1;
    const sunParticles: ParticleLayer[] = [
      // 紧贴边缘的日冕
      makeParticleLayer(Math.round(3800 * particleDensity), 2, 8, 0.055, 0.62, '#ff5f10', '#ffd08a', sunRadius, 26),
      // 米粒组织的细碎亮点
      makeParticleLayer(Math.round(1500 * particleDensity), 2, 6, 0.13, 0.07, '#ffc247', '#fff2c8', sunRadius, 24),
      // 远处弥散的耀斑
      makeParticleLayer(Math.round(1000 * particleDensity), 3, 10, 0.028, 1.5, '#ff7a18', '#ffd070', sunRadius, 22),
      // 日珥：只在边缘冒出的小舌
      makeParticleLayer(Math.round(1200 * particleDensity), 2, 9, 0.092, 0.34, '#ff3c06', '#ff9a3c', sunRadius, 26),
    ];
    for (const layer of sunParticles) sunGroup.add(layer.points);

    const sunHalos: Array<{ sprite: THREE.Sprite; mult: number; op: number }> = [];
    const haloSpecs: Array<[number, number, string]> = [
      [1.5, 0.36, '#ffb45a'],
      [2.5, 0.19, '#ff8a30'],
      [4.0, 0.055, '#ff6a20'],
    ];
    for (const [mult, op, color] of haloSpecs) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: op,
          toneMapped: false,
        })
      );
      sprite.scale.set(sunRadius * mult, sunRadius * mult, 1);
      sunGroup.add(sprite);
      sunHalos.push({ sprite, mult, op });
    }

    /* ---------------- 地球：真实日照贴图 + 海洋高光 + 蓝色大气 ---------------- */
    const earthGroup = new THREE.Group();
    orbitPoint(ORBIT_R_EARTH, EARTH_PHASE0, earthGroup.position);
    scene.add(earthGroup);

    const earthRadius = 0.13;
    const earthLight = new THREE.Vector3(-0.45, 0.35, 0.82).normalize();
    const earthView = new THREE.Vector3();
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null },
        uHasMap: { value: 0 },
        uLight: { value: earthLight },
      },
      vertexShader: `
        varying vec3 vN; varying vec3 vV; varying vec2 vUv;
        void main(){ vUv = uv; vN = normalize(normalMatrix*normal);
          vec4 mv = modelViewMatrix*vec4(position,1.0); vV = mv.xyz;
          gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `
        uniform sampler2D uMap; uniform float uHasMap; uniform vec3 uLight;
        varying vec3 vN; varying vec3 vV; varying vec2 vUv;
        float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
        void main(){
          vec2 uv = vUv;
          vec3 tex = texture2D(uMap, uv).rgb;
          if(uHasMap < 0.5) tex = vec3(0.10,0.26,0.55);
          vec3 col = pow(tex, vec3(2.1));            // sRGB -> linear
          col = mix(vec3(luma(col)), col, 1.30);     // 海洋的蓝压得更实
          col *= 4.70;
          vec3 N = normalize(vN);
          vec3 L = normalize(uLight);
          vec3 V = normalize(-vV);
          float ndl = dot(N, L);
          // 晨昏线：地球大气让它比月球软得多
          float day = smoothstep(-0.16, 0.30, ndl);
          col *= (0.22 + 1.10*day);
          col *= mix(0.60, 1.0, pow(max(ndl,0.0), 0.34));
          col += vec3(0.016,0.030,0.052);            // 夜面：一点地球反照
          // 海面镜面高光：albedo 越暗（海洋）越强
          float ocean = smoothstep(0.30, 0.04, luma(tex));
          vec3 H = normalize(L + V);
          float spec = pow(max(dot(N,H), 0.0), 120.0) * ocean * day;
          col += vec3(1.0,0.97,0.88) * spec * 0.85;
          // 蓝色大气边缘（瑞利散射）
          float fres = pow(1.0 - max(dot(N,V), 0.0), 2.6);
          col += vec3(0.34,0.60,1.0) * fres * 0.66 * (0.24 + 0.76*day);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(earthRadius, 96, 96), earthMat);
    earthGroup.add(earthMesh);

    const earthTex = new THREE.TextureLoader().load(earthUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      earthMat.uniforms.uMap.value = tex;
      earthMat.uniforms.uHasMap.value = 1;
    });
    earthTex.colorSpace = THREE.SRGBColorSpace;

    const earthAtmo = new THREE.Mesh(
      new THREE.SphereGeometry(earthRadius * 1.028, 48, 48),
      new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: `
          varying vec3 vN; varying vec3 vV;
          void main(){ vN = normalize(normalMatrix*normal);
            vec4 mv = modelViewMatrix*vec4(position,1.0); vV = mv.xyz;
            gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `
          varying vec3 vN; varying vec3 vV;
          void main(){
            vec3 V = normalize(-vV);
            float f = pow(1.0 - abs(dot(normalize(vN), V)), 3.0);
            gl_FragColor = vec4(vec3(0.34,0.60,1.0) * f * 0.62, f * 0.30);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide,
      })
    );
    earthAtmo.renderOrder = 3;
    earthGroup.add(earthAtmo);

    const earthHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x6fa8ff,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.26,
        toneMapped: false,
      })
    );
    earthHalo.scale.set(earthRadius * 4.2, earthRadius * 4.2, 1);
    earthGroup.add(earthHalo);

    const onResize = () => {
      quality = Math.min(window.devicePixelRatio, window.innerWidth < 900 ? 1.25 : 1.5);
      renderer.setPixelRatio(quality);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      applyLayout();
      camera.updateProjectionMatrix();
    };
    onResize();
    window.addEventListener('resize', onResize);

    const clockStart = performance.now();
    let lastNow = clockStart;
    let raf = 0;
    let sampleStart = performance.now();
    let sampleFrames = 0;
    let qualityChecked = false;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      if (!qualityChecked) {
        sampleFrames += 1;
        const elapsed = now - sampleStart;
        if (elapsed > 2600) {
          const fps = sampleFrames / (elapsed / 1000);
          qualityChecked = true;
          if (fps < 42 && quality > 1.25) {
            quality = 1.25;
            renderer.setPixelRatio(quality);
            renderer.setSize(window.innerWidth, window.innerHeight, false);
          } else if (fps < 30 && quality > 1) {
            quality = 1;
            renderer.setPixelRatio(quality);
            renderer.setSize(window.innerWidth, window.innerHeight, false);
          }
        }
      }

      if (!activeRef.current || document.hidden) return;
      const t = (now - clockStart) / 1000;
      const dt = Math.min(Math.max((now - lastNow) / 1000, 0), 0.1);
      lastNow = now;

      // --- 公转：太阳在原点，木星 / 地球按真实半径比与周期比运行；镜头与木星共动 ---
      orbitDays += dt * ORBIT_DAYS_PER_SEC;
      orbitPoint(ORBIT_R_JUP, (orbitDays / PERIOD_JUP_DAYS) * Math.PI * 2, jupPos);
      group.position.copy(jupPos);
      camera.position.set(jupPos.x - layout.offsetX, jupPos.y + 0.32, jupPos.z + layout.distance);
      orbitPoint(ORBIT_R_EARTH, EARTH_PHASE0 + (orbitDays / PERIOD_EARTH_DAYS) * Math.PI * 2, orbitTmp);
      earthGroup.position.copy(orbitTmp);
      // 受光方向：以太阳为主，向镜头方向偏一点，
      // 否则地球跑到「日地之间」时永远是逆光黑面
      earthLight.copy(earthGroup.position).negate().normalize();
      earthView.copy(camera.position).sub(earthGroup.position).normalize();
      earthLight.lerp(earthView, 0.62).normalize();
      const earthCamDist = camera.position.distanceTo(earthGroup.position);
      earthHalo.scale.setScalar(Math.max(earthCamDist * 0.013, earthRadius * 1.6));

      sunMat.uniforms.uTime.value = t;
      for (const layer of sunParticles) layer.mat.uniforms.uTime.value = t;
      sunMesh.rotation.y = t * 0.02;
      earthMesh.rotation.y = t * 0.05;

      planet.rotation.y = t * 0.045;
      const clouds = planetBody.userData.clouds as THREE.Mesh | undefined;
      if (clouds) clouds.rotation.y = t * 0.075;

      for (const item of animatedMoons) {
        item.orbit.rotation.y = t * item.speed + item.phase;
        item.mesh.rotation.y = t * item.speed + item.phase;
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else if (mat) {
          mat.dispose();
        }
      });
      jupiterTex.dispose();
      sunTex.dispose();
      earthTex.dispose();
      glowTex?.dispose();
      ringMat.uniforms.uRing.value?.dispose();
      planetMat.uniforms.uMap.value?.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas id="planet3d" ref={canvasRef} />;
}
