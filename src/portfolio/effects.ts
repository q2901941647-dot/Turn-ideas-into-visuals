import { useEffect } from 'react';

/**
 * 复刻原作品集网页的动效层：
 * 逐字入场（由 SplitText 负责）、遮片揭示、光标光晕、章节圆点、
 * 磁性 hover、视差、颗粒，并统一缓动与 reduced-motion 支持。
 */
export function useSiteEffects(sectionIds: string[], onSection: (id: string) => void) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;

    /* --- 遮片揭示：进入视口后加 .in --- */
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    let revealObserver: IntersectionObserver | null = null;
    if (reduce) {
      revealTargets.forEach((el) => el.classList.add('in'));
    } else {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              revealObserver?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      );
      revealTargets.forEach((el) => revealObserver?.observe(el));
    }

    /* --- 章节检测 --- */
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) onSection(visible.target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.1, 0.3] }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    /* --- 滚动：头部状态 + 视差 --- */
    const watermark = document.querySelector<HTMLElement>('.hero-watermark');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        document.body.classList.toggle('is-scrolled', y > 40);
        if (watermark && !reduce) {
          watermark.style.transform = `translate3d(${-y * 0.06}px, ${y * 0.12}px, 0)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* --- 光标光晕 --- */
    const onMove = (e: MouseEvent) => {
      root.style.setProperty('--mx', `${e.clientX}px`);
      root.style.setProperty('--my', `${e.clientY}px`);
    };
    if (!reduce) window.addEventListener('mousemove', onMove, { passive: true });

    /* --- 磁性 hover --- */
    const magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'));
    const detach = magnets.map((el) => {
      const move = (e: MouseEvent) => {
        if (reduce) return;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = `translate(${dx * 7}px, ${dy * 7}px)`;
      };
      const leave = () => {
        el.style.transform = '';
      };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      return () => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
      };
    });

    return () => {
      revealObserver?.disconnect();
      sectionObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
      detach.forEach((fn) => fn());
    };
  }, [sectionIds.join('|'), onSection]);
}

export function useToast() {
  let timer = 0;
  return (setMessage: (s: string | null) => void, text: string) => {
    window.clearTimeout(timer);
    setMessage(text);
    timer = window.setTimeout(() => setMessage(null), 2600);
  };
}
