import GradientText from '../components/GradientText/GradientText';
import SplitText from '../components/SplitText/SplitText';
import { CharReveal, Icon } from './ui';
import { profile, stats } from './data';

interface HeroProps {
  onWorks: () => void;
  onAbout: () => void;
  onStat: (index: number) => void;
}

export function Hero({ onWorks, onAbout, onStat }: HeroProps) {
  return (
    <section className="hero-stage" id="home">
      <div className="hero-veil" aria-hidden="true" />
      <div className="hero-watermark" aria-hidden="true">IDEAS IN MOTION</div>

      <div className="hero-inner">
        <div className="hero-topline">
          <span className="eyebrow">00 / PORTFOLIO 2027</span>
          <span className="top-rule" />
          <span className="hero-topline-en">
            <SplitText
              text="INDEPENDENT CREATOR & VISUAL DIRECTOR"
              tag="span"
              splitType="words"
              delay={22}
              duration={0.7}
              ease="power3.out"
              effect="fade"
              trigger="load"
            />
          </span>
        </div>

        <h1 className="hero-title">
          <span className="hero-title-line"><CharReveal text="让想法，" baseDelay={120} /></span>
          <span className="hero-title-line"><CharReveal text="成为画面。" baseDelay={420} /></span>
        </h1>

        <div className="hero-sub">
          <GradientText
            colors={['#8FD8FF', '#D9F3FF', '#FFB020', '#8FD8FF']}
            animationSpeed={7}
            className="hero-gradient"
          >
            {profile.role}
          </GradientText>
          <span className="hero-sub-sep" />
          <span>{profile.disciplines.join(' / ')}</span>
        </div>

        <p className="hero-desc">
          从一句话选题，到一条能上线的成片，中间不换人。
          <br />
          <span>{profile.major}</span>
        </p>

        <div className="hero-actions">
          <button type="button" className="btn btn-solid" onClick={onWorks} data-magnetic>
            查看作品 <Icon name="arrowDown" size={16} />
          </button>
          <button type="button" className="btn btn-outline" onClick={onAbout} data-magnetic>
            了解我 <Icon name="arrowRight" size={16} />
          </button>
        </div>

        <div className="hero-stats" aria-label="作品集概览">
          {stats.map((s, i) => (
            <button key={s.label} type="button" className="hero-stat" onClick={() => onStat(i)}>
              <strong>{s.value}</strong>
              <span className="hero-stat-label">{s.label}</span>
              <span className="hero-stat-sub">{s.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hero-bottom">
        <button type="button" className="scroll-hint" onClick={onWorks}>
          <span className="scroll-line" />
          SCROLL TO EXPLORE
        </button>
        <span className="hero-bottom-en">MOTION DESIGN / AI VISUALS / VISUAL EXPERIMENTS</span>
      </div>
    </section>
  );
}
