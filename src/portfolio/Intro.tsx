import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface IntroProps {
  onDone: () => void;
}

/**
 * 开屏：玻璃立方体悬浮旋转 → 名称与进度线 → 淡出交给首屏。
 * 点击 / 按键 / 触摸可跳过（开头 350ms 内不响应，避免误触）。
 */
export function Intro({ onDone }: IntroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);
  const timer = useRef(0);

  useEffect(() => {
    const t0 = performance.now();

    const finish = (force = false) => {
      if (finished.current) return;
      if (!force && performance.now() - t0 < 350) return;
      finished.current = true;
      setLeaving(true);
      timer.current = window.setTimeout(onDone, 760);
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const auto = window.setTimeout(() => finish(true), reduced ? 320 : 1750);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') finish();
    };
    const onTap = () => finish();
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTap, { passive: true });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const canvas = canvasRef.current;
    let raf = 0;
    let stop = false;
    let disposeScene: (() => void) | null = null;

    if (canvas && !reduced) {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(320, 320, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.28;

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;

      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
      camera.position.set(0, 0, 3.7);

      // 立方体背后的一团冷光：让折射有东西可弯
      const glowCv = document.createElement('canvas');
      glowCv.width = glowCv.height = 256;
      const g2d = glowCv.getContext('2d');
      if (g2d) {
        const gr = g2d.createRadialGradient(128, 128, 0, 128, 128, 128);
        gr.addColorStop(0, 'rgba(120,200,235,0.85)');
        gr.addColorStop(0.35, 'rgba(60,140,180,0.35)');
        gr.addColorStop(1, 'rgba(10,20,26,0)');
        g2d.fillStyle = gr;
        g2d.fillRect(0, 0, 256, 256);
      }
      const glowTex = new THREE.CanvasTexture(glowCv);
      glowTex.colorSpace = THREE.SRGBColorSpace;
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 5.2),
        new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      glow.position.z = -2.1;
      scene.add(glow);

      const geo = new THREE.BoxGeometry(1.16, 1.16, 1.16, 2, 2, 2);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xa8dcff,
        metalness: 0.06,
        roughness: 0.04,
        transparent: true,
        opacity: 0.34,
        ior: 1.45,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        iridescence: 0.9,
        iridescenceIOR: 1.3,
        envMapIntensity: 2.4,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const cube = new THREE.Mesh(geo, mat);
      scene.add(cube);

      // 边缘线
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.45 });
      cube.add(new THREE.LineSegments(edgeGeo, edgeMat));

      // 菲涅尔外壳：给轮廓一圈冷光，避免看起来像实心色块
      const rimGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
      const rimMat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(0x8fd8ff) } },
        vertexShader: `
          varying vec3 vN; varying vec3 vV;
          void main(){ vN = normalize(normalMatrix*normal);
            vec4 mv = modelViewMatrix*vec4(position,1.0); vV = mv.xyz;
            gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `
          uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
          void main(){
            vec3 V = normalize(-vV);
            float f = pow(1.0 - abs(dot(normalize(vN), V)), 3.2);
            gl_FragColor = vec4(uColor * f, f * 0.75);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      });
      cube.add(new THREE.Mesh(rimGeo, rimMat));

      scene.add(new THREE.AmbientLight(0x8fb4c6, 0.55));
      const l1 = new THREE.PointLight(0xbfe9ff, 34, 16);
      l1.position.set(2.2, 2.4, 2.4);
      scene.add(l1);
      const l2 = new THREE.PointLight(0xffb020, 16, 14);
      l2.position.set(-2.6, -1.6, 1.8);
      scene.add(l2);
      const l3 = new THREE.PointLight(0xffffff, 12, 8);
      l3.position.set(0.6, 1.2, 3.4);
      scene.add(l3);

      const start = performance.now();
      const tick = (now: number) => {
        if (stop) return;
        raf = requestAnimationFrame(tick);
        const t = (now - start) / 1000;
        const enter = Math.min(1, t / 0.9);
        const ease = 1 - Math.pow(1 - enter, 3);

        cube.rotation.y = t * 0.68 + 0.5;
        cube.rotation.x = Math.sin(t * 0.55) * 0.2 - 0.14;
        cube.position.y = Math.sin(t * 0.9) * 0.045;
        cube.scale.setScalar(0.76 + 0.24 * ease);

        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(tick);

      disposeScene = () => {
        cancelAnimationFrame(raf);
        geo.dispose();
        mat.dispose();
        edgeGeo.dispose();
        edgeMat.dispose();
        rimGeo.dispose();
        rimMat.dispose();
        glow.geometry.dispose();
        (glow.material as THREE.Material).dispose();
        glowTex.dispose();
        envRT.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    }

    return () => {
      stop = true;
      window.clearTimeout(auto);
      window.clearTimeout(timer.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTap);
      document.body.style.overflow = prevOverflow;
      disposeScene?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    timer.current = window.setTimeout(onDone, 760);
  };

  return (
    <div className={`intro${leaving ? ' is-leaving' : ''}`} role="presentation" onClick={skip}>
      <div className="intro-inner">
        <canvas ref={canvasRef} className="intro-cube" width={320} height={320} aria-hidden="true" />
        <div className="intro-word">
          <span className="intro-eyebrow">PORTFOLIO 2027</span>
          <span className="intro-name">唐睿</span>
          <span className="intro-en">TANG RUI · AI SHORT VIDEO DIRECTOR</span>
        </div>
        <div className="intro-bar" aria-hidden="true">
          <i />
        </div>
      </div>
    </div>
  );
}
