import { useEffect, useRef, useState } from 'react';

interface IntroProps {
  onDone: () => void;
}

const SETTLED_SCALE = 0.278;
const DURATION = 3400;
const GHOST_DELAYS = [46, 96, 152];
const GHOST_ALPHA = [0.26, 0.14, 0.07];

/** 四角星芒：尖端细长、凹边平滑，比像素十字更轻 */
const STAR_PATH =
  'M50 0 C53 27 73 47 100 50 C73 53 53 73 50 100 C47 73 27 53 0 50 C27 47 47 27 50 0Z';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutElastic = (x: number) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
};

interface StarState {
  x: number;
  y: number;
  s: number;
  sx: number;
  sy: number;
  rot: number;
  ghost: number;
}

/**
 * 开屏（参考 xiaolumotion 的叙事，动作按运动设计重做）：
 *   弹性诞生 → 悬浮自转 + 渐变流动 → 弧线收束（带拖影） → 逐字揭示姓名 → 落成图标。
 * 所有层由同一个纯函数 stateAt(t) 驱动，残影只是「过去几帧的自己」，
 * 因此拖尾天然贴合运动轨迹，不需要单独编排。
 */
export function Intro({ onDone }: IntroProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const starRef = useRef<HTMLDivElement | null>(null);
  const ghostRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sparksRef = useRef<SVGGElement | null>(null);
  const sheenRef = useRef<SVGPathElement | null>(null);
  const slotRef = useRef<HTMLSpanElement | null>(null);
  const charRefs = useRef<(HTMLElement | null)[]>([]);
  const enRef = useRef<HTMLSpanElement | null>(null);
  const lineRef = useRef<HTMLElement | null>(null);
  const metaRef = useRef<HTMLDivElement | null>(null);

  const finishRef = useRef<() => void>(() => {});
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);
  const timer = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    const star = starRef.current;
    const slot = slotRef.current;
    if (!stage || !star || !slot) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      setLeaving(true);
      timer.current = window.setTimeout(() => onDoneRef.current(), 720);
    };
    finishRef.current = finish;

    // 落位终点：名字左侧图标槽的真实坐标
    let dx = 0;
    let dy = 0;
    const measure = () => {
      const a = stage.getBoundingClientRect();
      const b = slot.getBoundingClientRect();
      dx = b.left + b.width / 2 - (a.left + a.width / 2);
      dy = b.top + b.height / 2 - (a.top + a.height / 2);
    };
    measure();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') finish();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', measure);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // 动画由自身进度 simT 收尾；这个定时器只作兜底，
    // 避免页面切到后台、rAF 完全暂停时开屏永远不消失。
    const auto = window.setTimeout(finish, reduced ? 1100 : 9000);

    /** 任意时刻的星芒姿态——纯函数，残影复用 */
    const stateAt = (t: number): StarState => {
      let x = 0;
      let y = 0;
      let s = 1;
      let sx = 1;
      let sy = 1;
      let rot = 0;
      let ghost = 0;

      if (reduced) {
        s = SETTLED_SCALE;
        x = dx;
        y = dy;
      } else if (t < 600) {
        // 1) 弹性诞生：纵向拉伸、横向压扁，带过冲回弹
        const p = clamp01(t / 600);
        const k = easeOutElastic(p);
        s = 0.04 + 0.96 * k;
        rot = -100 * (1 - p);
        const stretch = Math.sin(Math.PI * p);
        sx = 1 - 0.30 * stretch;
        sy = 1 + 0.30 * stretch;
        ghost = 1;
      } else if (t < 1850) {
        // 2) 悬浮：缓慢自转 + 挤压脉动 + 轻微呼吸
        const p = (t - 600) / 1250;
        s = 1 + 0.032 * Math.sin(p * Math.PI * 2);
        rot = 24 * p;
        sx = 1 + 0.055 * Math.sin(p * Math.PI * 4);
        sy = 1 - 0.055 * Math.sin(p * Math.PI * 4);
      } else if (t < 2550) {
        // 3) 收束：弧线上抛 + 快速旋转 + 沿运动方向拉伸，拖影最重
        const p = clamp01((t - 1850) / 700);
        const k = easeInOutCubic(p);
        s = 1 - (1 - SETTLED_SCALE) * k;
        x = dx * k;
        y = dy * k - 44 * Math.sin(Math.PI * k);
        rot = 24 + 246 * k;
        sx = 1 + 0.24 * Math.sin(Math.PI * k);
        sy = 1 - 0.17 * Math.sin(Math.PI * k);
        ghost = 1;
      } else {
        // 4) 落位：一个小回弹后定格成 logo
        const d = t - 2550;
        const b = Math.exp(-d / 165) * Math.sin(d / 52);
        s = SETTLED_SCALE * (1 + 0.14 * b);
        x = dx;
        y = dy;
        rot = 270;
        sx = 1 + 0.10 * b;
        sy = 1 - 0.08 * b;
        ghost = Math.max(0, 1 - d / 260);
      }
      return { x, y, s, sx, sy, rot, ghost };
    };

    const transformOf = (st: StarState) =>
      `translate(-50%, -50%) translate(${st.x.toFixed(1)}px, ${st.y.toFixed(1)}px) ` +
      `rotate(${st.rot.toFixed(2)}deg) scale(${(st.s * st.sx).toFixed(4)}, ${(st.s * st.sy).toFixed(4)})`;

    let raf = 0;
    let stopped = false;
    let simT = 0;
    let lastNow = 0;

    const tick = (now: number) => {
      if (stopped) return;
      // 以第一帧为 0 点，并限制单帧步长：WebGL 初始化阻塞主线程时
      // 浏览器会补发积压帧，若不夹住步长动画会被瞬间快进。
      if (!lastNow) lastNow = now;
      const dt = Math.min(Math.max(now - lastNow, 0), 34);
      lastNow = now;
      simT += dt;
      const t = simT;

      const st = stateAt(t);
      star.style.transform = transformOf(st);

      GHOST_DELAYS.forEach((delay, i) => {
        const el = ghostRefs.current[i];
        if (!el) return;
        const past = stateAt(Math.max(0, t - delay));
        el.style.transform = transformOf(past);
        el.style.opacity = t > delay ? (st.ghost * GHOST_ALPHA[i]).toFixed(3) : '0';
      });

      // 渐变三色流动，落位时收敛回品牌蓝
      const drift = 220 + t * 0.075;
      const settle = reduced ? 1 : t >= 1850 ? easeInOutCubic(clamp01((t - 1850) / 700)) : 0;
      const hue = drift * (1 - settle) + 220 * settle;
      const spread = 1 - settle * 0.65;
      stage.style.setProperty('--c1', `hsl(${hue.toFixed(1)} 96% 64%)`);
      stage.style.setProperty('--c2', `hsl(${(hue + 48 * spread).toFixed(1)} 92% 57%)`);
      stage.style.setProperty('--c3', `hsl(${(hue + 108 * spread).toFixed(1)} 88% 52%)`);

      // 高光脉冲：悬浮中段闪一下白光
      if (sheenRef.current) {
        const flash = Math.exp(-Math.pow((t - 1120) / 105, 2));
        const second = Math.exp(-Math.pow((t - 1980) / 80, 2));
        sheenRef.current.style.opacity = reduced ? '0' : Math.max(flash * 0.62, second * 0.5).toFixed(3);
      }
      // 卫星光点：进入后浮现，收束时先散开消失
      if (sparksRef.current) {
        const appear = easeOutCubic(clamp01((t - 380) / 520));
        const vanish = 1 - easeOutCubic(clamp01((t - 1900) / 420));
        sparksRef.current.style.opacity = reduced ? '0' : (appear * vanish * 0.9).toFixed(3);
        sparksRef.current.style.transform = `rotate(${(t * 0.022).toFixed(1)}deg)`;
      }

      // 名字逐字上推揭示
      const nk = clamp01((t - 2430) / 520);
      charRefs.current.forEach((el, i) => {
        if (!el) return;
        const k = easeOutCubic(clamp01((nk - i * 0.16) / 0.68));
        el.style.transform = reduced ? 'none' : `translateY(${((1 - k) * 112).toFixed(1)}%)`;
        el.style.opacity = reduced ? '1' : k.toFixed(3);
      });

      // 英文展开 + 细线由中心展开
      const ek = easeOutCubic(clamp01((t - 2550) / 560));
      if (enRef.current) {
        enRef.current.style.opacity = reduced ? '1' : ek.toFixed(3);
        enRef.current.style.letterSpacing = `${(0.34 + (1 - ek) * 0.30).toFixed(3)}em`;
      }
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${(reduced ? 1 : ek).toFixed(3)})`;
      if (metaRef.current) metaRef.current.style.opacity = reduced ? '1' : ek.toFixed(3);

      if (t >= DURATION) {
        finish();
        return;
      }
      if (!finished.current && !stopped) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(auto);
      window.clearTimeout(timer.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', measure);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`intro${leaving ? ' is-leaving' : ''}`} role="presentation">
      <div className="intro-stage" ref={stageRef}>
        {GHOST_DELAYS.map((_, i) => (
          <div
            key={i}
            className="intro-ghost"
            ref={(el) => { ghostRefs.current[i] = el; }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 100 100"><path d={STAR_PATH} /></svg>
          </div>
        ))}

        <div className="intro-star" ref={starRef} aria-hidden="true">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="introGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" className="g1" />
                <stop offset="50%" className="g2" />
                <stop offset="100%" className="g3" />
              </linearGradient>
            </defs>
            <path d={STAR_PATH} fill="url(#introGrad)" />
            <path
              ref={sheenRef}
              d={STAR_PATH}
              fill="#ffffff"
              opacity="0"
              style={{ mixBlendMode: 'soft-light' }}
            />
            <path d={STAR_PATH} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
            <g ref={sparksRef} className="intro-sparks">
              <circle cx="9" cy="9" r="2.1" />
              <circle cx="91" cy="9" r="1.5" />
              <circle cx="9" cy="91" r="1.5" />
              <circle cx="91" cy="91" r="2.1" />
            </g>
          </svg>
        </div>

        <div className="intro-lockup">
          <div className="intro-word">
            <div className="intro-name-row">
              <span className="intro-icon-slot" ref={slotRef} aria-hidden="true" />
              <span className="intro-name">
                {['唐', '睿'].map((ch, i) => (
                  <span className="intro-ch" key={ch}>
                    <i ref={(el) => { charRefs.current[i] = el; }}>{ch}</i>
                  </span>
                ))}
              </span>
            </div>
            <span className="intro-en" ref={enRef}>
              TANG RUI · AI SHORT VIDEO DIRECTOR
            </span>
          </div>
          <div className="intro-meta" ref={metaRef}>
            <span>PORTFOLIO 2027</span>
            <i ref={(el) => { lineRef.current = el; }} />
          </div>
        </div>

        <button type="button" className="intro-skip" onClick={() => finishRef.current()}>
          SKIP INTRO <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
