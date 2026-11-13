import { useEffect, useRef, useState } from 'react';
import SpotlightCard from '../components/SpotlightCard/SpotlightCard';
import { Icon, Modal, Reveal } from './ui';
import {
  aboutBlocks,
  experience,
  fields,
  orbitImages,
  pipeline,
  principles,
  profile,
  toolchain,
  type Category,
} from './data';

/* ---------------- 02 / Image orbit ---------------- */

export function Orbit() {
  const [index, setIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState(0);
  // 参考图是上百张叠成的密环：这里素材已足够，不再重复，
  // 同一张图相隔 90° 出现，不会相邻重复；补素材后自动变丰富。
  // 全部素材都进环；靠半径与卡片尺寸控制密度
  const ringItems = orbitImages.map((src, i) => ({ src, i, key: `${i}` }));

  const stageRef = useRef<HTMLDivElement | null>(null);
  const spinRef = useRef<HTMLDivElement | null>(null);
  const hoveringRef = useRef(false);

  // 自转 + 鼠标改变整体视角（缓动跟随），悬停时暂停自转方便点选
  useEffect(() => {
    const stage = stageRef.current;
    const spin = spinRef.current;
    if (!stage || !spin) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let ry = 0;
    let tx = 0;
    let ty = 0;
    let ttx = 0;
    let tty = 0;
    let raf = 0;
    let last = performance.now();

    const onMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
      const ny = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
      tty = nx * 30;
      ttx = -ny * 16;
    };
    const onLeave = () => {
      ttx = 0;
      tty = 0;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced && !hoveringRef.current) ry += dt * 4.5;
      const k = Math.min(1, dt * 6);
      tx += (ttx - tx) * k;
      ty += (tty - ty) * k;
      spin.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      spin.style.setProperty('--tx', `${tx.toFixed(2)}deg`);
      spin.style.setProperty('--ty', `${ty.toFixed(2)}deg`);
    };
    raf = requestAnimationFrame(tick);

    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section className="section orbit-section" id="orbit">
      <div className="section-head">
        <div className="section-index">
          <span className="index-no">02</span>
          <span className="index-rule" />
          <span className="index-en">IMAGE ORBIT / A WORLD OF IMAGES</span>
        </div>
        <Reveal className="section-title-wrap split-head">
          <h2 className="section-title">图像漫游</h2>
          <p className="section-lead">在影像、材质与想象之间，把每一帧都留下来。悬停暂停旋转，点击任意画面放大。</p>
        </Reveal>
      </div>

      <div className="ring-stage" ref={stageRef} onMouseEnter={() => { hoveringRef.current = true; }} onMouseLeave={() => { hoveringRef.current = false; }}>
        <div className="ring-spin" ref={spinRef}>
          {ringItems.map((item, n) => (
            <button
              key={item.key}
              type="button"
              className={`ring-item${preview === item.i ? ' is-active' : ''}`}
              style={{ transform: `translateY(var(--lift, 0px)) rotateY(${(360 / ringItems.length) * n}deg) translateZ(var(--ring-r)) scale(var(--sc, 1))` }}
              onClick={() => setIndex(item.i)}
              onMouseEnter={() => setPreview(item.i)}
              aria-label={`放大查看第 ${item.i + 1} 张画面`}
            >
              <img src={item.src} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
        <figure className="ring-preview">
          <img src={orbitImages[preview]} alt="" />
          <figcaption>
            {String(preview + 1).padStart(2, '0')} / {String(orbitImages.length).padStart(2, '0')}
          </figcaption>
        </figure>
        <span className="orbit-lab lab-1"><b>影像</b> FILM</span>
        <span className="orbit-lab lab-2"><b>赛事</b> MOTION</span>
        <span className="orbit-lab lab-3"><b>品牌</b> BRAND</span>
        <span className="orbit-lab lab-4"><b>概念</b> CONCEPT</span>
        <span className="orbit-lab lab-5"><b>分镜</b> STORYBOARD</span>
        <span className="orbit-lab lab-6"><b>实验</b> LAB</span>
      </div>

      <Modal open={index !== null} onClose={() => setIndex(null)} label="画面放大" wide>
        {index !== null && (
          <div className="lightbox">
            <img src={orbitImages[index]} alt={`作品画面 ${index + 1}`} />
            <div className="lightbox-bar">
              <button type="button" onClick={() => setIndex((index - 1 + orbitImages.length) % orbitImages.length)}>
                <Icon name="chevronLeft" size={16} /> 上一张
              </button>
              <span>{String(index + 1).padStart(2, '0')} / {String(orbitImages.length).padStart(2, '0')}</span>
              <button type="button" onClick={() => setIndex((index + 1) % orbitImages.length)}>
                下一张 <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}


/* ---------------- 03 / Perspective tunnel ---------------- */

const TUNNEL_COLORS = ['#2b5cff', '#ff5a1f', '#12b76a', '#8b5cf6', '#ffb020'];
const SEG = 7;

export function Tunnel() {
  const deepRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const el = deepRef.current;
    if (!el) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.tpanel'));
    const W = 620;
    const H = 372;
    const D = 240;
    const SPAN = SEG * D;
    let off = 0;
    let last = performance.now();
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      off = (off + dt * (reduced ? 30 : 190)) % SPAN;
      for (const node of nodes) {
        const seg = Number(node.dataset.seg || 0);
        const side = Number(node.dataset.side || 0);
        const z = ((((-seg * D + off) % SPAN) + SPAN) % SPAN) - SPAN;
        const base =
          side === 0
            ? `translate3d(0, ${H / 2}px, ${z}px) rotateX(90deg)`
            : side === 1
            ? `translate3d(0, ${-H / 2}px, ${z}px) rotateX(-90deg)`
            : side === 2
            ? `translate3d(${-W / 2}px, 0, ${z}px) rotateY(90deg)`
            : `translate3d(${W / 2}px, 0, ${z}px) rotateY(-90deg)`;
        node.style.transform = base;
        node.style.opacity = String(Math.max(0.08, 1 + z / SPAN));
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const panels: Array<{ seg: number; side: number; idx: number; color?: string }> = [];
  for (let seg = 0; seg < SEG; seg++) {
    for (let side = 0; side < 4; side++) {
      const n = seg * 4 + side;
      panels.push({
        seg,
        side,
        idx: n % orbitImages.length,
        color: n % 4 === 1 ? TUNNEL_COLORS[seg % TUNNEL_COLORS.length] : undefined,
      });
    }
  }

  return (
    <section className="section tunnel-section" aria-label="沉浸画廊">
      <div className="tunnel-board">
        <div className="tunnel-copy">
          <span className="eyebrow">03 / IMMERSIVE GALLERY</span>
          <h2 className="section-title">走进我的<br />视觉世界</h2>
          <p className="section-lead">在影像、材质与想象之间，一直往里走。点击任意画面放大。</p>
          <button type="button" className="btn btn-solid" onClick={() => setOpen(0)}>
            进入画廊 <Icon name="arrowUpRight" size={16} />
          </button>
        </div>
        <div className="tunnel-stage">
          <div className="tunnel-deep" ref={deepRef}>
            {panels.map((p) => (
              <button
                key={`${p.seg}-${p.side}`}
                type="button"
                data-seg={p.seg}
                data-side={p.side}
                className={`tpanel tp-${p.side}${p.color ? ' is-color' : ''}`}
                style={
                  p.color
                    ? ({ background: p.color } as React.CSSProperties)
                    : ({ backgroundImage: `url(${orbitImages[p.idx]})` } as React.CSSProperties)
                }
                onClick={() => setOpen(p.idx)}
                aria-label={`放大查看第 ${p.idx + 1} 张画面`}
              />
            ))}
            <span className="tunnel-core" aria-hidden="true" />
          </div>
        </div>
      </div>

      <Modal open={open !== null} onClose={() => setOpen(null)} label="画面放大" wide>
        {open !== null && (
          <div className="lightbox">
            <img src={orbitImages[open]} alt={`作品画面 ${open + 1}`} />
            <div className="lightbox-bar">
              <button type="button" onClick={() => setOpen((open - 1 + orbitImages.length) % orbitImages.length)}>
                <Icon name="chevronLeft" size={16} /> 上一张
              </button>
              <span>{String(open + 1).padStart(2, '0')} / {String(orbitImages.length).padStart(2, '0')}</span>
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

/* ---------------- 04 / Selected fields ---------------- */

export function Fields({ onPick }: { onPick: (c: Category) => void }) {
  return (
    <section className="section fields-section" id="fields">
      <div className="section-head">
        <div className="section-index">
          <span className="index-no">04</span>
          <span className="index-rule" />
          <span className="index-en">SELECTED FIELDS / IDEAS WITHOUT LIMITS</span>
        </div>
        <Reveal className="section-title-wrap split-head">
          <h2 className="section-title">不同媒介，<br /><em>同一种好奇</em></h2>
          <p className="section-lead">创作领域 / 四条线，共用一套判断：能不能稳定地再做一次。</p>
        </Reveal>
      </div>

      <div className="fields-grid">
        {fields.map((f, i) => (
          <Reveal key={f.no} className="field-cell" delay={i * 60}>
            <SpotlightCard
              className="field-card"
              spotlightColor="rgba(143, 216, 255, 0.20)"
              shape="circle"
              theme="dark"
              borderGlow={0.8}
              ambient={false}
              grain={0}
            >
              <button type="button" className="field-card-btn" onClick={() => onPick(f.filter)}>
                <span className="field-no">{f.no} / {f.en}</span>
                <h3>{f.title}</h3>
                <p className="field-line">{f.line}</p>
                <p className="field-body">{f.body}</p>
                <span className="field-foot">
                  <span>{f.count}</span>
                  <span className="field-go">VIEW WORKS <Icon name="arrowUpRight" size={15} /></span>
                </span>
              </button>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 04 / Process ---------------- */

export function Process() {
  return (
    <section className="section process-section" id="process">
      <div className="section-head">
        <div className="section-index">
          <span className="index-no">05</span>
          <span className="index-rule" />
          <span className="index-en">CREATIVE PROCESS / FROM IDEA TO FRAME</span>
        </div>
        <Reveal className="section-title-wrap split-head">
          <h2 className="section-title">一个人的<br /><em>六个工位</em></h2>
          <p className="section-lead">从一句话到一条片，中间不换人。每个工位都有输入、产出物和过检标准。</p>
        </Reveal>
      </div>

      <div className="pipeline">
        {pipeline.map((p, i) => (
          <Reveal key={p.no} className="pipe-cell" delay={i * 45}>
            <div className="pipe-no">{p.no}</div>
            <div className="pipe-name">{p.name}<span>{p.en}</span></div>
            <div className="pipe-flow"><span>{p.input}</span><Icon name="arrowRight" size={14} /><strong>{p.output}</strong></div>
            <div className="pipe-gate"><i /> {p.gate}</div>
          </Reveal>
        ))}
      </div>
      <div className="process-foot">
        <span>QUALITY GATE / 发布前 8 项</span>
        <p>人物一致 · 手部肢体 · 文字符号 · 口型配音 · 镜头稳定 · 透视画风 · 音画字幕 · 钩子尾句</p>
      </div>
    </section>
  );
}

/* ---------------- 05 / About ---------------- */

export function About({ onContact }: { onContact: () => void }) {
  return (
    <section className="section about-section" id="about">
      <div className="section-head">
        <div className="section-index">
          <span className="index-no">06</span>
          <span className="index-rule" />
          <span className="index-en">ABOUT ME / THE MIND BEHIND THE FRAMES</span>
        </div>
        <Reveal className="section-title-wrap split-head">
          <h2 className="section-title">关于唐睿</h2>
          <p className="section-lead">{profile.role} · {profile.major}</p>
        </Reveal>
      </div>

      <div className="about-grid">
        <div className="about-left">
          {aboutBlocks.map((b) => (
            <Reveal key={b.no} className="about-block">
              <span className="about-no">{b.no} /</span>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </Reveal>
          ))}
          <Reveal className="about-quote">
            <p>「{profile.oneLiner}」</p>
            <span>{profile.oneLinerEn}</span>
          </Reveal>
          <button type="button" className="btn btn-outline about-cta" onClick={onContact} data-magnetic>
            聊聊合作 <Icon name="arrowUpRight" size={15} />
          </button>
        </div>

        <div className="about-right">
          <Reveal className="about-panel">
            <span className="eyebrow">WORK EXPERIENCE / 工作经历</span>
            <div className="timeline">
              {experience.map((e) => (
                <div className="timeline-item" key={e.org}>
                  <span className="timeline-dot" />
                  <span className="timeline-period">{e.period}</span>
                  <h4>{e.logo && <img className="timeline-logo" src={e.logo} alt={e.org} />}{e.org} <small>· {e.role}</small></h4>
                  <p>{e.detail}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="about-panel" delay={80}>
            <span className="eyebrow">TOOLCHAIN / 工具</span>
            <div className="tool-list">
              {toolchain.map((t) => (
                <div key={t.label}><span>{t.label}</span><p>{t.value}</p></div>
              ))}
            </div>
          </Reveal>

          <Reveal className="about-panel about-facts" delay={140}>
            <div><span>到岗</span><p>5 天每周 / 6 个月+</p></div>
            <div><span>城市</span><p>{profile.city}</p></div>
            <div><span>方向</span><p>AI 短视频编导 / 内容制作</p></div>
          </Reveal>
        </div>
      </div>

      <div className="principles">
        <div className="principles-head">
          <span className="eyebrow">MY PRINCIPLES / 三件我在意的事</span>
          <h3>让想法落地，<em>并且能再做一次。</em></h3>
        </div>
        <div className="principles-grid">
          {principles.map((p) => (
            <Reveal key={p.no} className="principle">
              <span>{p.no}</span>
              <h4>{p.title}</h4>
              <p>{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 06 / Contact ---------------- */

export function Contact({
  onCopy,
  onVcard,
  onGo,
}: {
  onCopy: (text: string, label: string) => void;
  onVcard: () => void;
  onGo: (id: string) => void;
}) {
  return (
    <section className="section contact-section" id="contact">
      <div className="contact-watermark" aria-hidden="true">LET'S CONNECT</div>
      <div className="section-index">
        <span className="index-no">07</span>
        <span className="index-rule" />
        <span className="index-en">LET'S CONNECT / MAKE THE NEXT FRAME</span>
      </div>

      <Reveal className="contact-main">
        <h2>一起创造<br /><em>下一帧</em></h2>
        <p>欢迎交流创意与项目。作品原件、完整脚本与分镜文档，可在沟通时提供。</p>
        <div className="contact-actions">
          <a className="btn btn-solid" href={`mailto:${profile.email}?subject=作品集交流`} data-magnetic>
            <Icon name="mail" size={16} /> 发邮件
          </a>
          <button type="button" className="btn btn-outline" onClick={() => onCopy(profile.email, '邮箱')} data-magnetic>
            <Icon name="copy" size={16} /> 复制邮箱
          </button>
          <button type="button" className="btn btn-outline" onClick={onVcard} data-magnetic>
            <Icon name="download" size={16} /> 存为名片
          </button>
        </div>
      </Reveal>

      <div className="contact-grid">
        <div className="contact-item">
          <span>EMAIL</span>
          <button type="button" onClick={() => onCopy(profile.email, '邮箱')}>{profile.email}</button>
        </div>
        <div className="contact-item">
          <span>PHONE</span>
          <button type="button" onClick={() => onCopy(profile.phone.replace(/-/g, ''), '电话')}>{profile.phone}</button>
        </div>
        <div className="contact-item">
          <span>DOUYIN</span>
          <a href={profile.douyin} target="_blank" rel="noreferrer">账号作品 <Icon name="external" size={13} /></a>
        </div>
        <div className="contact-item">
          <span>AVAILABLE</span>
          <p>{profile.availability}</p>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark small" aria-hidden="true"><i /><i /><i /><i /></span>
          <div>
            <strong>{profile.name}</strong>
            <small>{profile.roleEn}</small>
          </div>
        </div>
        <p className="footer-note">© 2027 {profile.name} · 网络与新媒体</p>
        <button type="button" className="to-top" onClick={() => onGo('home')}>
          回到顶部 <Icon name="arrowDown" size={14} />
        </button>
      </footer>
    </section>
  );
}
