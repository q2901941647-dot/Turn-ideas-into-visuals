import { useEffect, useRef, useState } from 'react';
import { Icon, Modal } from './ui';
import { orbitImages } from './data';
import './tunnel.css';

const COLORS = ['#2b5cff', '#ff5a1f', '#12b76a', '#8b5cf6', '#ffb020', '#e11d48'];
const SEG = 12;
const W = 620;
const H = 372;
const D = 260;

function rand(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Cell {
  seg: number;
  side: number;
  i: number;
  w: number;
  h: number;
  kind: 'photo' | 'color' | 'empty';
  idx: number;
  color?: string;
}

/** 沉浸画廊：横截面 顶3 / 底3 / 左2 / 右2，照片·色块·留白随机，无限穿梭 */
export function Tunnel() {
  const deepRef = useRef<HTMLDivElement | null>(null);
  const fastRef = useRef(false);
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const el = deepRef.current;
    if (!el) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.tpanel'));
    // 面板必须首尾相接：LEN = 段数 × 段深；NEAR 越过镜头面（> perspective 760）后才循环
    const LEN = SEG * D;
    const NEAR = 980;
    const FAR = NEAR - LEN;
    let off = 0;
    let last = performance.now();
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      off = (off + dt * (reduced ? 120 : fastRef.current ? 2600 : 760)) % LEN;
      for (const node of nodes) {
        const seg = Number(node.dataset.seg || 0);
        const side = Number(node.dataset.side || 0);
        const i = Number(node.dataset.i || 0);
        const raw = -seg * D + off;
        const z = (((raw - FAR) % LEN) + LEN) % LEN + FAR;
        let base: string;
        if (side === 0) {
          const cx = -W / 2 + (i + 0.5) * (W / 3);
          base = `translate3d(${cx}px, ${H / 2}px, ${z}px) rotateX(90deg)`;
        } else if (side === 1) {
          const cx = -W / 2 + (i + 0.5) * (W / 3);
          base = `translate3d(${cx}px, ${-H / 2}px, ${z}px) rotateX(-90deg)`;
        } else if (side === 2) {
          const cy = H / 2 - (i + 0.5) * (H / 2);
          base = `translate3d(${-W / 2}px, ${cy}px, ${z}px) rotateY(90deg)`;
        } else {
          const cy = H / 2 - (i + 0.5) * (H / 2);
          base = `translate3d(${W / 2}px, ${cy}px, ${z}px) rotateY(-90deg)`;
        }
        node.style.transform = base;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 先做一份稳定打乱的图片顺序：照片格按顺序取，保证一圈里不重复
  const order = orbitImages.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand(i * 7.7 + 1.3) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const cells: Cell[] = [];
  let photoCursor = 0;
  for (let seg = 0; seg < SEG; seg++) {
    for (let side = 0; side < 4; side++) {
      const count = side < 2 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const n = seg * 10 + side * 3 + i;
        const r1 = rand(n);
        // 留白更多、照片更疏，避免连成一片
        const kind: Cell['kind'] = r1 < 0.38 ? 'empty' : r1 < 0.58 ? 'color' : 'photo';
        const idx = kind === 'photo' ? order[photoCursor++ % order.length] : 0;
        cells.push({
          seg,
          side,
          i,
          w: side < 2 ? W / 3 : D,
          h: side < 2 ? D : H / 2,
          kind,
          idx,
          color: kind === 'color' ? COLORS[Math.floor(rand(n + 41.7) * COLORS.length)] : undefined,
        });
      }
    }
  }

  return (
    <section className="section tunnel-section" aria-label="沉浸画廊">
      <div className="tunnel-board">
        <div className="tunnel-copy">
          <span className="eyebrow">03 / IMMERSIVE GALLERY</span>
          <h2 className="section-title">
            走进我的
            <br />
            视觉世界
          </h2>
          <p className="section-lead">在影像、材质与想象之间，一直往里走。点击任意画面放大。</p>
          <button type="button" className="btn btn-solid" onClick={() => setExpanded(true)}>
            进入画廊 <Icon name="arrowUpRight" size={16} />
          </button>
        </div>
        <div
          className={`tunnel-stage${expanded ? ' is-expanded' : ''}`}
          onPointerDown={() => {
            fastRef.current = true;
          }}
          onPointerUp={() => {
            fastRef.current = false;
          }}
          onPointerLeave={() => {
            fastRef.current = false;
            setHover(false);
          }}
          onPointerCancel={() => {
            fastRef.current = false;
            setHover(false);
          }}
          onPointerEnter={() => setHover(true)}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
          }}
        >
          <div className="tunnel-deep" ref={deepRef}>
            {cells.map((c) => (
              <button
                key={`${c.seg}-${c.side}-${c.i}`}
                type="button"
                data-seg={c.seg}
                data-side={c.side}
                data-i={c.i}
                className={`tpanel is-${c.kind}`}
                style={{
                  width: `${c.w}px`,
                  height: `${c.h}px`,
                  marginLeft: `${-c.w / 2}px`,
                  marginTop: `${-c.h / 2}px`,
                  ...(c.kind === 'photo'
                    ? { backgroundImage: `url(${orbitImages[c.idx]})` }
                    : c.kind === 'color'
                      ? { background: c.color }
                      : {}),
                }}
                onClick={c.kind === 'photo' ? () => setOpen(c.idx) : undefined}
                aria-label={c.kind === 'photo' ? `放大查看第 ${c.idx + 1} 张画面` : undefined}
              />
            ))}
            <span className="tunnel-core" aria-hidden="true" />
          </div>
          {hover && (
            <span className="tunnel-hint" style={{ left: cursor.x, top: cursor.y }}>
              按住加速
            </span>
          )}
          {expanded && (
            <button type="button" className="tunnel-exit" onClick={() => setExpanded(false)}>
              退出画廊 ×
            </button>
          )}
        </div>
      </div>

      <Modal open={open !== null} onClose={() => setOpen(null)} label="画面放大" wide>
        {open !== null && (
          <div className="lightbox">
            <img src={orbitImages[open]} alt={`作品画面 ${open + 1}`} />
            <div className="lightbox-bar">
              <button
                type="button"
                onClick={() => setOpen((open - 1 + orbitImages.length) % orbitImages.length)}
              >
                <Icon name="chevronLeft" size={16} /> 上一张
              </button>
              <span>
                {String(open + 1).padStart(2, '0')} / {String(orbitImages.length).padStart(2, '0')}
              </span>
              <button type="button" onClick={() => setOpen((open + 1) % orbitImages.length)}>
                下一张 <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
