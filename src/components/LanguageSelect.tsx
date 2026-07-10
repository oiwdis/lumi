import { COURSES } from '../data';
import { useAppStore } from '../store/useAppStore';
import type { CourseId } from '../types';

export default function LanguageSelect() {
  const { openOnboarding, setCourse, customGoal, logout, theme, toggleTheme } = useAppStore();

  return (
    <div className="select-screen">
      <div className="select-topbar">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
        <button className="select-logout-btn" onClick={logout}>Logout</button>
      </div>
      <div className="select-hero">
        <span className="select-owl">🌱</span>
        <h1 className="select-title">Lumi</h1>
        <p className="select-sub">Your goals. Your lessons. Your language.</p>
      </div>

      <div className="select-label">Choose your course</div>

      <div className="course-list">
        {COURSES.map(c => (
          <button
            key={c.id}
            className="course-card"
            style={{ '--accent': c.color } as React.CSSProperties}
            onClick={() => customGoal[c.id] ? setCourse(c.id as CourseId) : openOnboarding(c.id as CourseId)}
          >
            <div className="course-flags">
              <span>{c.fromFlag}</span>
              <span className="course-arrow-icon">→</span>
              <span>{c.toFlag}</span>
            </div>
            <div className="course-info">
              <span className="course-name">{c.fromLang} → {c.toLang}</span>
              <span className="course-tagline">{c.tagline}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="select-method-note">
        Based on comprehensible input — the science-backed way to acquire language naturally.
      </p>
    </div>
  );
}
