import { useAppStore } from '../store/useAppStore';

interface Props { onGetStarted: () => void; }

const FEATURES = [
  {
    emoji: '🎯',
    title: 'Built around your goal',
    desc: 'Tell Lumi why you\'re learning — moving abroad, dating someone, travel — and it builds a curriculum just for you.',
  },
  {
    emoji: '🤖',
    title: 'AI tutor in every lesson',
    desc: 'Stuck on a word? Ask Lumi mid-lesson. Get instant explanations, examples, and corrections in real time.',
  },
  {
    emoji: '⚡',
    title: 'Adapts to your level',
    desc: 'Lessons match your level — beginner to advanced — and get harder as you improve.',
  },
  {
    emoji: '🗂️',
    title: 'Four ways to learn',
    desc: 'Flashcards, multiple choice, typing, and word-pair matching — every lesson covers all the ways your brain actually retains things.',
  },
  {
    emoji: '🏆',
    title: 'Streaks & rewards',
    desc: 'Daily streaks and XP levels keep you coming back. Language learning is a marathon — Lumi makes it a game.',
  },
  {
    emoji: '📱',
    title: 'Learn anywhere',
    desc: 'Progress syncs across every device. Pick up on your phone where you left off on your laptop.',
  },
];

const LANGUAGES = [
  { flag: '🇪🇸', name: 'Spanish' },
  { flag: '🇫🇷', name: 'French' },
  { flag: '🇨🇳', name: 'Chinese' },
  { flag: '🇯🇵', name: 'Japanese' },
  { flag: '🇰🇷', name: 'Korean' },
  { flag: '🇩🇪', name: 'German' },
];

export default function HomeScreen({ onGetStarted }: Props) {
  const { theme, toggleTheme } = useAppStore();
  return (
    <div className="home-screen">
      {/* Nav */}
      <nav className="home-nav">
        <div className="home-nav-brand">
          <span>🌱</span>
          <span className="home-nav-name">Lumi</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button className="home-nav-login" onClick={onGetStarted}>Log in</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-badge">✨ AI-powered language learning</div>
        <h1 className="home-hero-title">
          Learn a language<br />
          <span className="home-hero-accent">built for you</span>
        </h1>
        <p className="home-hero-sub">
          Tell Lumi your goal. Get a personalized curriculum in 15 seconds.<br />
          Practice with an AI tutor that actually explains things.
        </p>
        <button className="home-cta-btn" onClick={onGetStarted}>
          Start for free →
        </button>
        <div className="home-lang-pills">
          {LANGUAGES.map(l => (
            <span key={l.name} className="home-lang-pill">{l.flag} {l.name}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <h2 className="home-section-title">Everything generic apps miss</h2>
        <div className="home-feature-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="home-feature-card">
              <span className="home-feature-emoji">{f.emoji}</span>
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

      <footer className="home-footer">© 2025 Lumi · AI language learning</footer>
    </div>
  );
}
