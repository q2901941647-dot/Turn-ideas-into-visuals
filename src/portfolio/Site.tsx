import { useCallback, useEffect, useRef, useState } from 'react';
import JupiterScene from '../components/JupiterScene';
import Starfield from '../components/Starfield';
import ClickSpark from '../components/ClickSpark/ClickSpark';
import { Header, NAV } from './Header';
import { Hero } from './Hero';
import { Works } from './Works';
import { About, Contact, Fields, Orbit, Process } from './sections';
import { Tunnel } from './Tunnel';
import { CubeSection } from './CubeSection';
import { Intro } from './Intro';
import { Icon, Modal, SectionDots, Toast } from './ui';
import { useSiteEffects } from './effects';
import { profile, works, type Category, type Work } from './data';

const SECTIONS = [
  { id: 'home', label: '首页', no: '00' },
  ...NAV.map((n) => ({ id: n.id, label: n.label, no: n.id === 'works' ? '01' : String(NAV.indexOf(n) + 1).padStart(2, '0') })),
];

const STAT_WORK_IDS = ['beginning', 'concept', 'netease', 'timeline'];

export default function Site() {
  const [current, setCurrent] = useState('home');
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [active, setActive] = useState<Work | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sceneActive, setSceneActive] = useState(true);
  const [introDone, setIntroDone] = useState(false);
  const toastTimer = useRef(0);

  const notify = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const go = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrent(id);
  }, []);

  useSiteEffects(SECTIONS.map((s) => s.id), setCurrent);

  /* 3D 只在首屏可见时渲染 */
  useEffect(() => {
    const hero = document.getElementById('home');
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setSceneActive(e.isIntersecting), { threshold: 0.02 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  const pickField = (c: Category) => {
    setFilter(c);
    notify(`已筛选「${c === 'doc' ? '方法与文档' : c === 'pipeline' ? '产线' : c === 'ai' ? 'AI 叙事' : '原创影像'}」`);
    window.setTimeout(() => go('works'), 60);
  };

  const openFromStat = (i: number) => {
    const w = works.find((x) => x.id === STAT_WORK_IDS[i]);
    if (w) setActive(w);
    else go('works');
  };

  const step = (dir: 1 | -1) => {
    const list = filter === 'all' ? works : works.filter((w) => w.category === filter);
    if (!list.length) return;
    const idx = active ? list.findIndex((w) => w.id === active.id) : -1;
    setActive(list[(idx + dir + list.length) % list.length]);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label}已复制：${text}`);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      notify(`${label}已复制：${text}`);
    }
  };

  const downloadVcard = () => {
    const vcf = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:唐;睿;;;',
      'FN:唐睿',
      `TITLE:${profile.role}`,
      `ORG:${profile.school}`,
      'TEL;TYPE=CELL:13410164607',
      `EMAIL;TYPE=INTERNET:${profile.email}`,
      `NOTE:网络与新媒体 2027 届 · ${profile.availability}`,
      'END:VCARD',
    ].join('\r\n');
    const blob = new Blob(['\uFEFF' + vcf], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '唐睿-AI短视频编导.vcf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('名片已下载，可导入通讯录');
  };

  return (
    <>
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}
      <Starfield />
      <JupiterScene active={sceneActive} />

      <ClickSpark
        className="spark-layer"
        sparkColor="#8FD8FF"
        sparkSize={10}
        sparkRadius={16}
        sparkCount={9}
        duration={420}
        shape="star"
        glow={0.9}
        ring
      >
        <main className="site-main">
          <Header current={current} onGo={go} onContact={() => setContactOpen(true)} />

          <Hero
            onWorks={() => go('works')}
            onAbout={() => go('about')}
            onStat={openFromStat}
          />

          <div className="page-content">
            <Works
              filter={filter}
              active={active}
              onOpen={setActive}
              onClose={() => setActive(null)}
              onContact={() => { setActive(null); window.setTimeout(() => setContactOpen(true), 180); }}
              onNext={() => step(1)}
              onPrev={() => step(-1)}
            />
            <Orbit />
            <Tunnel />
            <CubeSection />
            <Fields onPick={pickField} />
            <Process />
            <About onContact={() => setContactOpen(true)} />
            <Contact onCopy={copy} onVcard={downloadVcard} onGo={go} />
          </div>

          <SectionDots sections={SECTIONS} current={current} onGo={go} />
        </main>
      </ClickSpark>

      <Modal open={contactOpen} onClose={() => setContactOpen(false)} label="联系方式">
        <div className="contact-modal">
          <span className="eyebrow">LET'S CONNECT / 联系方式</span>
          <h2>一个想法，<br />一次合作。</h2>
          <p>欢迎交流创意、项目与实习机会。完整脚本、分镜手稿与成片原件，可在沟通时提供。</p>
          <div className="contact-modal-list">
            <button type="button" onClick={() => copy(profile.email, '邮箱')}>
              <Icon name="mail" size={17} /><span>{profile.email}</span><Icon name="copy" size={15} />
            </button>
            <button type="button" onClick={() => copy(profile.phone.replace(/-/g, ''), '电话')}>
              <Icon name="phone" size={17} /><span>{profile.phone}</span><Icon name="copy" size={15} />
            </button>
            <a href={profile.douyin} target="_blank" rel="noreferrer">
              <Icon name="external" size={17} /><span>抖音账号作品（实习期间代公司运营）</span><Icon name="arrowUpRight" size={15} />
            </a>
          </div>
          <div className="contact-modal-fact"><span>到岗时间</span><strong>{profile.availability}</strong></div>
          <div className="contact-modal-actions">
            <a className="btn btn-solid" href={`mailto:${profile.email}?subject=作品集交流`}>
              发送邮件 <Icon name="arrowUpRight" size={15} />
            </a>
            <button type="button" className="btn btn-outline" onClick={downloadVcard}>
              存为名片 <Icon name="download" size={15} />
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast} />
    </>
  );
}
