import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface Slide {
  lines: string[];
  sub: string;
  n: string;
}

const SLIDES: Slide[] = [
  { lines: ['AI', 'SHORT', 'VIDEO'], sub: 'AI 短视频 · 让想法成片', n: '01' },
  { lines: ['REAL', 'TIME', 'RENDER'], sub: '实时渲染 · 玻璃与虹彩', n: '02' },
  { lines: ['IDEAS', 'IN', 'MOTION'], sub: '动效设计 · 想法成画', n: '03' },
];

interface MeteorData {
  dir: THREE.Vector3;
  speed: number;
  life: number;
  max: number;
}

export default function CubeScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const numRef = useRef<HTMLSpanElement | null>(null);
  const dotsRef = useRef<HTMLDivElement | null>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      mount.classList.add('cube-fallback');
      mount.setAttribute('data-fallback', '当前设备不支持 WebGL，无法显示实时渲染。');
      return;
    }

    const getSize = () => {
      const r = mount.getBoundingClientRect();
      return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    };
    let { w, h } = getSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.cursor = 'grab';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05090c);
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 9.2);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    /* 背后巨型标题（被玻璃立方体折射变形）：渐变文字，颜色随时间流动 */
    const TW = 2048;
    const TH = 1024;
    const titleCanvas = document.createElement('canvas');
    titleCanvas.width = TW;
    titleCanvas.height = TH;
    const tctx = titleCanvas.getContext('2d')!;
    const titleTex = new THREE.CanvasTexture(titleCanvas);
    titleTex.colorSpace = THREE.SRGBColorSpace;
    titleTex.anisotropy = 4;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = TW;
    maskCanvas.height = TH;
    const buildMask = (lines: string[]) => {
      const x = maskCanvas.getContext('2d')!;
      x.clearRect(0, 0, TW, TH);
      x.fillStyle = '#fff';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.font = '900 210px "Arial Black", "Microsoft YaHei", sans-serif';
      const lh = 300;
      const startY = TH / 2 - ((lines.length - 1) / 2) * lh;
      lines.forEach((t, i) => x.fillText(t, TW / 2, startY + i * lh));
    };

    // 三组文案各有底色相，颜色再随时间漂移
    const SLIDE_HUE = [196, 32, 152];
    let titleHue = 0;
    let lastPaint = -1;

    const paintTitle = (hue: number) => {
      tctx.globalCompositeOperation = 'source-over';
      tctx.fillStyle = '#070d11';
      tctx.fillRect(0, 0, TW, TH);
      const g = tctx.createLinearGradient(0, 160, TW, TH - 120);
      g.addColorStop(0, `hsl(${Math.round(hue) % 360} 80% 62%)`);
      g.addColorStop(0.5, `hsl(${Math.round(hue + 48) % 360} 84% 68%)`);
      g.addColorStop(1, `hsl(${Math.round(hue + 104) % 360} 78% 56%)`);
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, TW, TH);
      tctx.globalCompositeOperation = 'destination-in';
      tctx.drawImage(maskCanvas, 0, 0);
      tctx.globalCompositeOperation = 'destination-over';
      tctx.fillStyle = '#070d11';
      tctx.fillRect(0, 0, TW, TH);
      tctx.globalCompositeOperation = 'source-over';
      titleTex.needsUpdate = true;
    };

    buildMask(SLIDES[0].lines);
    paintTitle(SLIDE_HUE[0]);

    const titleMat = new THREE.MeshBasicMaterial({ map: titleTex });
    const titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), titleMat);
    titleMesh.position.z = -3.8;
    scene.add(titleMesh);

    /* 玻璃立方体：真实折射 + 虹彩 + 清漆 */
    const cubeGeo = new THREE.BoxGeometry(3.4, 3.4, 3.4);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: 0xbfe6ff,
      transmission: 1.0,
      thickness: 2.6,
      ior: 1.45,
      roughness: 0.05,
      metalness: 0,
      iridescence: 1.0,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [120, 620],
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      attenuationColor: new THREE.Color(0x9fd8ff),
      attenuationDistance: 2.2,
      envMapIntensity: 2.2,
      specularIntensity: 1.0,
      transparent: true,
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    scene.add(cube);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(cubeGeo),
      new THREE.LineBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.55 }),
    );
    cube.add(edges);

    /* 星空 + 流星 */
    const clock = new THREE.Clock();
    const starGeo = new THREE.BufferGeometry();
    const starN = 420;
    const starPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      const r = 22 + Math.random() * 24;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.13,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    const makeStreakTex = () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 6;
      const x = c.getContext('2d')!;
      const g = x.createLinearGradient(0, 0, 64, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.65, 'rgba(170,200,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,1)');
      x.fillStyle = g;
      x.fillRect(0, 0, 64, 6);
      return new THREE.CanvasTexture(c);
    };
    const streakTex = makeStreakTex();
    const meteors: THREE.Mesh[] = [];
    const spawnMeteor = () => {
      const mat = new THREE.MeshBasicMaterial({
        map: streakTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 4.2), mat);
      const ang = Math.random() * Math.PI * 2;
      const rad = 20;
      m.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad, -4 + Math.random() * 6);
      const dir = new THREE.Vector3(-m.position.x, -m.position.y, 0).normalize();
      m.rotation.z = Math.atan2(dir.y, dir.x) - Math.PI / 2;
      const data: MeteorData = { dir, speed: 15 + Math.random() * 9, life: 0, max: 1.15 };
      m.userData = data;
      scene.add(m);
      meteors.push(m);
    };
    let meteorTimer = 1.5;

    /* 彩色点光，增强表面虹彩反光（与全站青/琥珀/品红一致） */
    const p1 = new THREE.PointLight(0x8fd8ff, 160, 40);
    p1.position.set(-7, 4, 6);
    const p2 = new THREE.PointLight(0xffb020, 120, 40);
    p2.position.set(7, -3, 5);
    const p3 = new THREE.PointLight(0xff5c93, 100, 40);
    p3.position.set(0, 6, -4);
    scene.add(p1, p2, p3);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    /* 拖拽旋转（带惯性 + 空闲慢转） */
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let vx = 0;
    let vy = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      vx = vy = 0;
      renderer.domElement.style.cursor = 'grabbing';
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      vx = dx * 0.006;
      vy = dy * 0.006;
      cube.rotation.y += vx;
      cube.rotation.x += vy;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    /* HUD：轮播切换 */
    const renderHud = () => {
      const s = SLIDES[idxRef.current];
      buildMask(s.lines);
      paintTitle(SLIDE_HUE[idxRef.current] + titleHue);
      if (numRef.current) numRef.current.textContent = s.n;
      if (subRef.current) subRef.current.textContent = s.sub;
      if (dotsRef.current) {
        Array.from(dotsRef.current.children).forEach((b, i) =>
          b.classList.toggle('active', i === idxRef.current),
        );
      }
    };
    const go = (i: number) => {
      idxRef.current = (i + SLIDES.length) % SLIDES.length;
      renderHud();
    };
    if (dotsRef.current) {
      SLIDES.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `切换到第 ${i + 1} 组视觉`);
        b.addEventListener('click', () => go(i));
        dotsRef.current!.appendChild(b);
      });
    }
    renderHud();

    /* 渲染循环（离屏 / 隐藏标签页时暂停） */
    let raf = 0;
    let running = false;
    let visible = true;
    let autoTimer = 0;

    const startAuto = () => {
      window.clearInterval(autoTimer);
      autoTimer = window.setInterval(() => {
        if (running) go(idxRef.current + 1);
      }, 6000);
    };

    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      titleHue += dt * 24;
      if (clock.elapsedTime - lastPaint > 0.1) {
        lastPaint = clock.elapsedTime;
        paintTitle(SLIDE_HUE[idxRef.current] + titleHue);
      }
      stars.rotation.y += 0.0009;
      starMat.opacity = 0.7 + 0.18 * Math.sin(performance.now() * 0.0015);
      meteorTimer -= dt;
      if (meteorTimer <= 0) {
        spawnMeteor();
        meteorTimer = 2.2 + Math.random() * 4;
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const d = m.userData as MeteorData;
        d.life += dt;
        m.position.addScaledVector(d.dir, d.speed * dt);
        const t = Math.min(d.life / d.max, 1);
        (m.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.9;
        if (d.life >= d.max) {
          scene.remove(m);
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
          meteors.splice(i, 1);
        }
      }
      if (!dragging) {
        cube.rotation.y += vx;
        cube.rotation.x += vy;
        vx *= 0.94;
        vy *= 0.94;
        if (Math.abs(vx) < 0.0009 && Math.abs(vy) < 0.0009) {
          cube.rotation.y += 0.0016;
          cube.rotation.x += 0.0006;
        }
      }
      renderer.render(scene, camera);
    };

    const activate = () => {
      if (running) return;
      running = true;
      startAuto();
      loop();
    };
    const deactivate = () => {
      running = false;
      window.clearInterval(autoTimer);
      cancelAnimationFrame(raf);
    };

    activate();

    const ro = new ResizeObserver(() => {
      const s = getSize();
      w = s.w;
      h = s.h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    ro.observe(mount);

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !document.hidden) activate();
        else deactivate();
      },
      { threshold: 0.05 },
    );
    io.observe(mount);

    const onVis = () => {
      if (document.hidden) deactivate();
      else if (visible) activate();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      deactivate();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      cube.geometry.dispose();
      cubeMat.dispose();
      edges.geometry.dispose();
      (edges.material as THREE.Material).dispose();
      titleMesh.geometry.dispose();
      titleMat.map?.dispose();
      titleMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      meteors.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      streakTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="cube-canvas-wrap" ref={mountRef}>
      <span className="cube-bignum" ref={numRef}>
        01
      </span>
      <div className="cube-dots" ref={dotsRef} />
      <p className="cube-subtitle" ref={subRef}>
        AI 短视频 · 让想法成片
      </p>
      <span className="cube-hint">拖拽旋转 · 自动轮播</span>
    </div>
  );
}
