import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/* ---------------- Icons ---------------- */

type IconName =
  | 'arrowUpRight'
  | 'arrowDown'
  | 'arrowRight'
  | 'close'
  | 'menu'
  | 'play'
  | 'mail'
  | 'phone'
  | 'copy'
  | 'download'
  | 'external'
  | 'check'
  | 'spark'
  | 'chevronLeft'
  | 'chevronRight';

const PATHS: Record<IconName, ReactNode> = {
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  arrowDown: <path d="M12 4v15m0 0 6-6m-6 6-6-6" />,
  arrowRight: <path d="M4 12h15m0 0-6-6m6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 8h16M4 16h16" />,
  play: <path d="m9 6 10 6-10 6V6Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  phone: <path d="M6 3h3l2 5-2.5 1.5a13 13 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 5H6a2 2 0 0 0-2 2v9" />
    </>
  ),
  download: <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 19h16" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />,
  check: <path d="m5 12 5 5L20 7" />,
  spark: <path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6 4 4M19 5l-4 4m-6 6-4 4" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ---------------- Modal ---------------- */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  wide?: boolean;
}

export function Modal({ open, onClose, children, label, wide }: ModalProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    const prev = document.activeElement as HTMLElement | null;
    window.setTimeout(() => ref.current?.focus(), 20);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal-panel${wide ? ' modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        ref={ref}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
          <Icon name="close" size={20} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ---------------- Toast ---------------- */

export function Toast({ message }: { message: string | null }) {
  return createPortal(
    <div className={`toast${message ? ' show' : ''}`} role="status" aria-live="polite">
      {message && (
        <>
          <span className="toast-dot" />
          {message}
        </>
      )}
    </div>,
    document.body
  );
}

/* ---------------- Section dots ---------------- */

export interface SectionDef {
  id: string;
  label: string;
  no: string;
}

export function SectionDots({
  sections,
  current,
  onGo,
}: {
  sections: SectionDef[];
  current: string;
  onGo: (id: string) => void;
}) {
  return (
    <nav className="section-dots" aria-label="章节导航">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`section-dot${current === s.id ? ' active' : ''}`}
          onClick={() => onGo(s.id)}
          aria-label={`跳转到 ${s.label}`}
          aria-current={current === s.id ? 'true' : undefined}
        >
          <span className="dot-label">{s.no} / {s.label}</span>
          <span className="dot-mark" />
        </button>
      ))}
    </nav>
  );
}

/* ---------------- Character-by-character headline ---------------- */

export function CharReveal({
  text,
  className = '',
  baseDelay = 0,
  step = 48,
}: {
  text: string;
  className?: string;
  baseDelay?: number;
  step?: number;
}) {
  return (
    <span className={`char-reveal ${className}`} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="char"
          aria-hidden="true"
          style={{ animationDelay: `${baseDelay + i * step}ms` }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}

/* ---------------- Clip reveal wrapper ---------------- */

export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  return (
    <Tag className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
