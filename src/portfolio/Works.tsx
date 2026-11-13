import { useEffect, useState } from 'react';
import { Icon, Modal, Reveal } from './ui';
import { works, type Category, type Work } from './data';

interface WorksProps {
  filter: Category | 'all';
  active: Work | null;
  onOpen: (w: Work) => void;
  onClose: () => void;
  onContact: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Works({
  filter,
  active,
  onOpen,
  onClose,
  onContact,
  onNext,
  onPrev,
}: WorksProps) {
  const shown = filter === 'all' ? works : works.filter((w) => w.category === filter);

  return (
    <section className="section works-section" id="works">
      <div className="section-head">
        <div className="section-index">
          <span className="index-no">01</span>
          <span className="index-rule" />
          <span className="index-en">SELECTED WORKS / A DIFFERENT POINT OF VIEW</span>
        </div>
        <Reveal className="section-title-wrap">
          <h2 className="section-title">走进我的<br /><em>作品世界</em></h2>
          <p className="section-lead">
            四个项目分别证明四件事——一个人能走完整流程、能做多镜头叙事、能进工业化产线、能接商业需求。
          </p>
        </Reveal>
      </div>

      <div className="filter-row" role="group" aria-label="作品分类筛选">
        <span className="filter-count">{String(shown.length).padStart(2, '0')} 件作品</span>
      </div>

      <div className="works-grid">
        {shown.map((w, i) => (
          <Reveal as="article" key={w.id} className="work-card" delay={(i % 3) * 70}>
            <button type="button" className="work-card-btn" onClick={() => onOpen(w)} aria-label={`查看 ${w.title} 详情`}>
              <div className="work-cover">
                <img
                  src={w.cover}
                  alt={w.title}
                  loading="lazy"
                  style={w.coverPosition ? { objectPosition: w.coverPosition } : undefined}
                />
                {w.videos && <span className="work-play"><Icon name="play" size={18} /></span>}
                <span className="work-no">{w.no}</span>
                <span className="work-card-arrow"><Icon name="arrowUpRight" size={18} /></span>
              </div>
              <div className="work-info">
                <span className="work-cat">{w.categoryLabel}</span>
                <h3>{w.title}</h3>
                <span className="work-en">{w.titleEn}</span>
                <div className="work-meta">
                  <span>{w.meta}</span>
                  <span>{w.year}</span>
                </div>
                <p className="work-summary">{w.summary}</p>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      <WorkDetail
        work={active}
        onClose={onClose}
        onContact={onContact}
        onNext={onNext}
        onPrev={onPrev}
      />
    </section>
  );
}

function WorkDetail({
  work,
  onClose,
  onContact,
  onNext,
  onPrev,
}: {
  work: Work | null;
  onClose: () => void;
  onContact: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [shot, setShot] = useState(0);
  const [clip, setClip] = useState(0);

  useEffect(() => {
    setShot(0);
    setClip(0);
  }, [work?.id]);

  useEffect(() => {
    if (!work) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [work, onNext, onPrev]);

  return (
    <Modal open={Boolean(work)} onClose={onClose} label={work?.title ?? '作品详情'} wide>
      {work && (
        <div className="detail">
          <div className="detail-head">
            <span className="eyebrow">PROJECT {work.no} / {work.categoryLabel}</span>
            {work.logo && <img className="detail-logo" src={work.logo} alt="" />}
            <h2>{work.title}</h2>
            <span className="detail-en">{work.titleEn}</span>
            <p className="detail-summary">{work.summary}</p>
          </div>

          <div className="detail-stage">
            {work.videos && work.videos[clip] ? (
              <video
                key={work.videos[clip].src}
                className="detail-media"
                src={work.videos[clip].src}
                poster={work.videos[clip].poster}
                controls
                autoPlay
                playsInline
                loop
              />
            ) : (
              <img
                className="detail-media"
                src={work.gallery[shot] ?? work.cover}
                style={work.galleryPosition?.[shot] ? { objectPosition: work.galleryPosition[shot] } : undefined}
                alt={`${work.title} 画面 ${shot + 1}`}
              />
            )}
            <span className="detail-media-tag">
              {work.videos ? `VIDEO ${clip + 1} / ${work.videos.length} · ${work.videos[clip].label}` : `STILL ${shot + 1} / ${work.gallery.length}`}
            </span>
          </div>

          <div className="detail-thumbs">
            {work.videos
              ? work.videos.map((v, i) => (
                  <button
                    key={v.src}
                    type="button"
                    className={`thumb${clip === i ? ' active' : ''}`}
                    onClick={() => setClip(i)}
                  >
                    <img src={v.poster} alt={v.label} />
                    <span>{v.label} · {v.duration}</span>
                  </button>
                ))
              : work.gallery.map((g, i) => (
                  <button
                    key={g}
                    type="button"
                    className={`thumb${shot === i ? ' active' : ''}`}
                    onClick={() => setShot(i)}
                    aria-label={`查看第 ${i + 1} 张`}
                  >
                    <img
                      src={g}
                      alt=""
                      style={work.galleryPosition?.[i] ? { objectPosition: work.galleryPosition[i] } : undefined}
                    />
                  </button>
                ))}
          </div>

          <div className="detail-body">
            <div className="detail-main">
              <p className="detail-desc">{work.description}</p>
              <h3>关键做法 / KEY DECISIONS</h3>
              <ul className="detail-points">
                {work.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              {work.notes && (
                <div className="detail-notes">
                  <div><span>为什么做</span><p>{work.notes.why}</p></div>
                  <div><span>关键判断</span><p>{work.notes.decision}</p></div>
                  <div><span>被问怎么答</span><p>{work.notes.answer}</p></div>
                </div>
              )}
            </div>
            <aside className="detail-side">
              <div className="detail-side-block">
                <span className="eyebrow">规格 / SPECS</span>
                <p>{work.meta}</p>
                <p>{work.year}</p>
              </div>
              <div className="detail-side-block">
                <span className="eyebrow">工具 / TOOLS</span>
                <div className="tag-row">
                  {work.tools.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
              <button type="button" className="btn btn-solid detail-cta" onClick={onContact}>
                聊聊这个项目 <Icon name="arrowUpRight" size={15} />
              </button>
            </aside>
          </div>

          <div className="detail-nav">
            <button type="button" onClick={onPrev}><Icon name="chevronLeft" size={16} /> 上一个</button>
            <button type="button" onClick={onClose}>返回作品列表</button>
            <button type="button" onClick={onNext}>下一个 <Icon name="chevronRight" size={16} /></button>
          </div>
        </div>
      )}
    </Modal>
  );
}
