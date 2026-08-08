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
//
// The first example follows the language on screen — a Korean page describing a
// move to Madrid undercuts the very claim the card is making.
const features = (shortGoal: string) => [
  {
    icon: Target,
    title: 'Built around your goal',
    desc: `Say you're ${shortGoal} and you get lessons for exactly that — the phrases you'll need that week, not colours and farm animals.`,
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
  // Spanish is the default course, so it is also the default example
  const demoCourse = lang?.courseId ?? 'en-es';
  const demoLangName = langName ?? 'Spanish';
  const FEATURES = features(lang?.shortGoal ?? 'moving to Madrid in March');

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
        {/* Stays a real link so it works without JS and reads as one to
            crawlers, but the click is handled so it glides down and drops the
            cursor straight in the goal box rather than jumping. It must never
            lead to signup — the section it lands on says "no account needed". */}
        <a
          className="home-cta-btn"
          href="#try"
          onClick={e => {
            const target = document.getElementById('try');
            if (!target) return;              // fall back to the plain anchor jump
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.setTimeout(() => {
              // Not every engine animates a smooth scroll — land it either way,
              // or the button would do nothing at all where it doesn't.
              if (Math.abs(target.getBoundingClientRect().top) > 80) {
                target.scrollIntoView({ block: 'start' });
              }
              // preventScroll, or focusing the field yanks the section heading
              // back off the top of the screen.
              document.getElementById('gd-goal')?.focus({ preventScroll: true });
            }, 450);
          }}
        >
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

      {/* The generator comes first on purpose. It is the only thing on the page
          that proves the claim instead of repeating it, and when it sat below
          the product demo most visitors never scrolled far enough to reach it. */}
      <GoalDemo defaultCourse={demoCourse} onGetStarted={onGetStarted} />

      {/* Product visual. Keyed by course so switching language restarts the
          animation cleanly. */}
      <ProductDemo key={demoCourse} courseId={demoCourse} langName={demoLangName} />

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

      {/* Bottom CTA. "Free to start" on its own invites the question of what
          happens after, which is a reason to leave and go find out. */}
      <section className="home-cta-strip">
        <h2 className="home-cta-strip-title">Ready to actually learn?</h2>
        <p className="home-cta-strip-sub">Free while it's early — no credit card.</p>
        <p className="home-cta-strip-note">Paid plans come later. Whatever you build now stays yours.</p>
        <button className="home-cta-btn" onClick={onGetStarted}>Create your account →</button>
      </section>

      {/* Said plainly rather than papered over with testimonials. The people who
          find this first are the ones who root for early software. */}
      <section className="home-early">
        <p className="home-early-line">Built by one person, and it's early.</p>
        <p className="home-early-sub">
          If something's broken or wrong, tell me:{' '}
          <a className="home-early-mail" href="mailto:elliot@themaclan.com">elliot@themaclan.com</a>
        </p>
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
