import { useEffect, useRef, useState } from 'react';

interface IntroProps {
  onDone: () => void;
}

/** 星芒基础尺寸与目标图标尺寸的比例，位移落位时用它 */
const SETTLED_SCALE = 0.278;
const DURATION = 3600;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/**
 * 开屏（参考 xiaolumotion 的序列）：
 *   星芒缩放进入 → 持续变色 → 缩小并位移 → 名字浮现 → 星芒落成名字旁的图标 → 淡出。
 * 逐帧驱动，位移终点由真实 DOM 位置测量，任意屏幕尺寸都能精确落位。
 * 只响应 SKIP 按钮与 Esc / 空格 / 回车，不监听滚轮或全屏点击，避免误跳过。
 */
export function Intro({ onDone }: IntroProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const starRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLSpanElement | null>(null);
  const wordRef = useRef<HTMLDivElement | null>(null);
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
    const word = wordRef.current;
    const meta = metaRef.current;
    if (!stage || !star || !slot || !word || !meta) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      setLeaving(true);
      timer.current = window.setTimeout(() => onDoneRef.current(), 720);
    };
    finishRef.current = finish;

    // 星芒最终要落进名字左侧的图标槽，用真实坐标算位移
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
    const auto = window.setTimeout(finish, reduced ? 1100 : DURATION);

    let raf = 0;
    let stopped = false;
    let firstFrame = 0;
    const tick = (now: number) => {
      if (stopped) return;
      // 以第一帧的时间戳为 0 点：WebGL 初始化可能阻塞主线程，
      // 用 performance.now() 做基准会让动画直接跳到中段。
      if (!firstFrame) firstFrame = now;
      const t = now - firstFrame;
      let scale = 1;
      let rot = 0;
      let x = 0;
      let y = 0;
      // 变色持续进行；缩小落位时收敛回品牌蓝，让最终图标成为稳定的 logo
      const drift = 220 + t * 0.075;
      const settle = reduced ? 1 : t >= 2100 ? easeInOut(clamp01((t - 2100) / 750)) : 0;
      const hue = drift * (1 - settle) + 220 * settle;

      if (reduced) {
        scale = SETTLED_SCALE;
        x = dx;
        y = dy;
      } else if (t < 750) {
        // 1) 缩放进入（带一点回弹）
        const k = easeOutBack(clamp01(t / 750));
        scale = 0.08 + (1 - 0.08) * k;
        rot = -70 * (1 - k);
      } else if (t < 2100) {
        // 2) 停留，持续变色 + 轻微呼吸
        const k = (t - 750) / 1350;
        scale = 1 + Math.sin(k * Math.PI * 2) * 0.025;
        rot = Math.sin(k * Math.PI) * 8;
      } else if (t < 2850) {
        // 3) 缩小并移到名字左侧
        const k = easeOutCubic(clamp01((t - 2100) / 750));
        scale = 1 - (1 - SETTLED_SCALE) * k;
        x = dx * k;
        y = dy * k;
        rot = 8 * (1 - k);
      } else {
        // 4) 落成图标
        scale = SETTLED_SCALE;
        x = dx;
        y = dy;
      }

      star.style.transform =
        `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) ` +
        `scale(${scale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
      star.style.setProperty('--hue', hue.toFixed(1));

      // 只做淡入，不做位移：姓名行的图标槽必须保持固定坐标，
      // 否则星芒的落位点会跟着文字一起漂。
      const wk = clamp01((t - 2500) / 650);
      word.style.opacity = reduced ? '1' : String(easeOutCubic(wk));

      const mk = clamp01((t - 2900) / 550);
      meta.style.opacity = reduced ? '1' : String(easeOutCubic(mk));

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
        <div className="intro-star" ref={starRef} aria-hidden="true">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 0H60V28H82V40H100V60H82V72H60V100H40V72H18V60H0V40H18V28H40Z" />
          </svg>
        </div>

        <div className="intro-lockup">
          <div className="intro-word" ref={wordRef}>
            <div className="intro-name-row">
              <span className="intro-icon-slot" ref={slotRef} aria-hidden="true" />
              <span className="intro-name">唐睿</span>
            </div>
            <span className="intro-en">TANG RUI · AI SHORT VIDEO DIRECTOR</span>
          </div>
          <div className="intro-meta" ref={metaRef}>
            <span>PORTFOLIO 2027</span>
            <i />
          </div>
        </div>

        <button type="button" className="intro-skip" onClick={() => finishRef.current()}>
          SKIP INTRO <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
