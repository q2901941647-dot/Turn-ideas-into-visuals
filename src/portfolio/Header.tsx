import { useEffect, useState } from 'react';
import { Icon } from './ui';
import { profile } from './data';

export interface NavItem {
  id: string;
  label: string;
  en: string;
}

export const NAV: NavItem[] = [
  { id: 'works', label: '作品', en: 'WORKS' },
  { id: 'orbit', label: '画廊', en: 'GALLERY' },
  { id: 'cube', label: '实验', en: 'LAB' },
  { id: 'fields', label: '领域', en: 'FIELDS' },
  { id: 'process', label: '方法', en: 'PROCESS' },
  { id: 'about', label: '关于', en: 'ABOUT' },
  { id: 'contact', label: '联系', en: 'CONTACT' },
];

interface HeaderProps {
  current: string;
  onGo: (id: string) => void;
  onContact: () => void;
}

export function Header({ current, onGo, onContact }: HeaderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('drawer-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('drawer-open');
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    onGo(id);
  };

  return (
    <>
      <header className="site-header">
        <button type="button" className="brand" onClick={() => go('home')} aria-label="回到首页" data-magnetic>
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <span className="brand-text">
            <strong>{profile.name}</strong>
            <small>{profile.nameEn}</small>
          </span>
        </button>

        <nav className="main-nav" aria-label="主导航">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link${current === item.id ? ' active' : ''}`}
              onClick={() => go(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-right">
          <span className="availability"><i /> 开放合作</span>
          <button type="button" className="btn btn-ghost header-cta" onClick={onContact} data-magnetic>
            联系我 <Icon name="arrowUpRight" size={14} />
          </button>
          <button
            type="button"
            className="menu-btn"
            onClick={() => setOpen(true)}
            aria-label="打开菜单"
            aria-expanded={open}
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </header>

      <div className={`drawer-overlay${open ? ' show' : ''}`} onMouseDown={() => setOpen(false)} aria-hidden="true" />
      <aside className={`drawer${open ? ' show' : ''}`} aria-label="菜单" aria-hidden={!open}>
        <div className="drawer-head">
          <span className="eyebrow">MENU / 目录</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="关闭菜单">
            <Icon name="close" size={20} />
          </button>
        </div>
        <nav className="drawer-nav">
          {[{ id: 'home', label: '首页', en: 'HOME' }, ...NAV].map((item, i) => (
            <button key={item.id} type="button" onClick={() => go(item.id)}>
              <span className="drawer-no">0{i + 1}</span>
              <span className="drawer-label">{item.label}</span>
              <span className="drawer-en">{item.en}</span>
              <Icon name="arrowUpRight" size={16} />
            </button>
          ))}
        </nav>
        <div className="drawer-foot">
          <p>{profile.email}</p>
          <p>{profile.phone}</p>
          <button type="button" className="btn btn-solid" onClick={() => { setOpen(false); onContact(); }}>
            一起聊聊 <Icon name="arrowUpRight" size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
