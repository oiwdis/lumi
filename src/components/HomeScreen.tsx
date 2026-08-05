import { useEffect } from 'react';
import { Target, Bot, MessagesSquare } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { LANDING_LANGS, type LandingLang } from '../data/landingLangs';
import ProductDemo from './ProductDemo';
import GoalDemo from './GoalDemo';

interface Props {
  onGetStarted: () => void;
  /** Set when the visitor landed on a per-language route like /learn-japanese. */
  lang?: LandingLang;
  onPickLang: (slug: string | null) => void;
}

// Three claims a generic app cannot make. Streaks, XP, flashcards and device
// sync were cut on purpose: every competitor has them, so listing them invited
// a comparison on their terms rather than ours.
const FEATURES = [
  {
    icon: Target,
    title: 'Built around your goal',
    desc: 'Say you\'re moving to Madrid in March and you get lessons about apartments, banks and small talk — not colours and farm animals.',
  },
  {
    icon: Bot,
    title: 'A tutor that explains why',
    desc: 'Ask mid-lesson and Lumi answers in the exercise: why this ending, why not that word. Not a red cross and a guess.',
  },
  {
    icon: MessagesSquare,
    title: 'Real phrases, not word lists',
    desc: 'Every lesson teaches whole sentences you would actually say, so your first real conversation isn\'t your first attempt.',
  },
];

export default function HomeScreen({ onGetStarted, lang, onPickLang }: Props) {
  const { theme, toggleTheme } = useAppStore();
  const langName = lang?.name;

  // The server injects these for crawlers; this keeps the tab and share cards
  // right when the visitor arrives via client-side navigation instead.
  useEffect(() => {
    document.title = langName
      ? `Learn ${langName} with an AI tutor built around your goal · Lumi`
      : 'Lumi — AI Language Tutor';
  }, [langName]);

  return (
    <div className="home-screen">
      {/* Nav */}
      <nav className="home-nav">
        <button className="home-nav-brand" onClick={() => onPickLang(null)}>
          <span>🌱</span>
          <span className="home-nav-name">Lumi</span>
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button className="home-nav-login" onClick={onGetStarted}>Log in</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <h1 className="home-hero-title">
          {langName ? `Learn ${langName}` : 'Learn a language'}<br />
          <span className="home-hero-accent">built for you</span>
        </h1>
        <p className="home-hero-sub">
          Tell Lumi your goal. Get a personalized {langName ?? ''} curriculum in 15 seconds.<br />
          Practice with an AI tutor that actually explains things.
        </p>
        <a className="home-cta-btn" href="#try">
          Build my first lesson →
        </a>
        <div className="home-lang-pills">
          {LANDING_LANGS.map(l => (
            <button
              key={l.slug}
              className={`home-lang-pill${l.slug === lang?.slug ? ' home-lang-pill--active' : ''}`}
              onClick={() => onPickLang(l.slug === lang?.slug ? null : l.slug)}
              aria-pressed={l.slug === lang?.slug}
            >
              {l.flag} {l.name}
            </button>
          ))}
        </div>
      </section>

      {/* Product visual — fills the gap between the hero and the features */}
      <ProductDemo />

      {/* Try-before-signup generator */}
      <GoalDemo defaultCourse={lang?.courseId ?? 'en-es'} onGetStarted={onGetStarted} />

      {/* Features */}
      <section className="home-features">
        <h2 className="home-section-title">Three things generic apps can't do</h2>
        <div className="home-feature-grid home-feature-grid--three">
          {FEATURES.map(f => (
            <div key={f.title} className="home-feature-card">
              <f.icon className="home-feature-icon" size={26} strokeWidth={2} />
              <h3 className="home-feature-title">{f.title}</h3>
              <p className="home-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="home-cta-strip">
        <h2 className="home-cta-strip-title">Ready to actually learn?</h2>
        <p className="home-cta-strip-sub">Free to start. No credit card. No fluff.</p>
        <button className="home-cta-btn" onClick={onGetStarted}>Create your account →</button>
      </section>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} Lumi · AI language learning</span>
        <a
          className="home-footer-badge"
          href="https://fazier.com/launches/lumilanguage.com"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=dark"
            width={104}
            alt="Featured on Fazier"
          />
        </a>
      </footer>
    </div>
  );
}
