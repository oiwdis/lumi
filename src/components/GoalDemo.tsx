import { useEffect, useRef, useState } from 'react';
import type { CourseId } from '../types';
import { LANDING_LANGS, GOAL_EXAMPLE } from '../data/landingLangs';

/**
 * The curriculum generator, on the landing page, before signup. A visitor types
 * their actual reason for learning and gets the real first unit back — the claim
 * "personalized in 15 seconds" demonstrated instead of asserted.
 *
 * Backed by /api/preview-plan, which is deliberately cheaper and rate-limited:
 * it generates one unit rather than the full course, which is what signing up
 * unlocks.
 */

interface PreviewLesson {
  title: string;
  emoji?: string;
  words: Array<{ english: string; target: string; reading?: string }>;
}
interface PreviewUnit {
  title: string;
  subtitle?: string;
  emoji?: string;
  lessons: PreviewLesson[];
}

const WAITING_LINES = [
  'Reading your goal…',
  'Choosing the phrases you will actually need…',
  'Ordering them into lessons…',
  'Almost there…',
];

interface Props {
  defaultCourse: CourseId;
  onGetStarted: () => void;
}

export default function GoalDemo({ defaultCourse, onGetStarted }: Props) {
  const [courseId, setCourseId] = useState<CourseId>(defaultCourse);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitIdx, setWaitIdx] = useState(0);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState<PreviewUnit | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Follow the hero when the visitor lands on /learn-japanese and friends
  useEffect(() => { setCourseId(defaultCourse); }, [defaultCourse]);

  // Rotate the waiting copy so a 15-second generation doesn't feel stalled
  useEffect(() => {
    if (!loading) { setWaitIdx(0); return; }
    const id = window.setInterval(() => setWaitIdx(i => Math.min(i + 1, WAITING_LINES.length - 1)), 3500);
    return () => window.clearInterval(id);
  }, [loading]);

  const lang = LANDING_LANGS.find(l => l.courseId === courseId)!;

  const handleGenerate = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    setError('');
    setUnit(null);
    try {
      const res = await fetch('/api/preview-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, language: lang.name, goal: goal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not build your plan');
      setUnit(data);
      // Bring the result into view — on a phone it renders below the fold
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /** Carry the goal into onboarding so it is never typed twice. */
  const handleSave = () => {
    try {
      sessionStorage.setItem('lumi-pending-goal', JSON.stringify({ courseId, goal: goal.trim() }));
    } catch { /* private browsing — the worst case is retyping the goal */ }
    onGetStarted();
  };

  return (
    <section className="gd-section" id="try">
      <h2 className="gd-title">Try it before you sign up</h2>
      <p className="gd-sub">
        Tell Lumi why you're learning. It builds your first unit right here — no account needed.
      </p>

      <div className="gd-card">
        <div className="gd-langs" role="group" aria-label="Choose a language">
          {LANDING_LANGS.map(l => (
            <button
              key={l.courseId}
              type="button"
              className={`gd-lang${l.courseId === courseId ? ' gd-lang--active' : ''}`}
              onClick={() => setCourseId(l.courseId)}
              aria-pressed={l.courseId === courseId}
            >
              {l.flag} {l.name}
            </button>
          ))}
        </div>

        <label className="gd-label" htmlFor="gd-goal">Why are you learning {lang.name}?</label>
        <textarea
          id="gd-goal"
          className="gd-textarea"
          rows={2}
          maxLength={300}
          placeholder={`e.g. “${GOAL_EXAMPLE[courseId]}”`}
          value={goal}
          onChange={e => setGoal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
          }}
          disabled={loading}
        />

        <button
          className="gd-btn"
          onClick={handleGenerate}
          disabled={!goal.trim() || loading}
        >
          {loading ? WAITING_LINES[waitIdx] : `Build my first ${lang.name} unit →`}
        </button>

        {loading && <div className="gd-bar"><div className="gd-bar-fill" /></div>}
        {error && <div className="gd-error">{error}</div>}
      </div>

      {unit && (
        <div className="gd-result" ref={resultRef}>
          <div className="gd-result-head">
            <span className="gd-result-emoji">{unit.emoji ?? '🎯'}</span>
            <div>
              <div className="gd-result-title">{unit.title}</div>
              {unit.subtitle && <div className="gd-result-sub">{unit.subtitle}</div>}
            </div>
          </div>

          <div className="gd-lessons">
            {unit.lessons.map((lesson, i) => (
              <div className="gd-lesson" key={i}>
                <div className="gd-lesson-title">
                  <span className="gd-lesson-emoji">{lesson.emoji ?? '📘'}</span>
                  {lesson.title}
                </div>
                <ul className="gd-words">
                  {lesson.words.map((w, j) => (
                    <li className="gd-word" key={j}>
                      <span className="gd-word-target">{w.target}</span>
                      {w.reading && <span className="gd-word-reading">{w.reading}</span>}
                      <span className="gd-word-en">{w.english}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="gd-save">
            <p className="gd-save-copy">
              That's unit 1 of {LANDING_LANGS.find(l => l.courseId === courseId)!.name}. Create a free
              account to save it and get the other four, plus the tutor.
            </p>
            <button className="gd-save-btn" onClick={handleSave}>Save this plan →</button>
          </div>
        </div>
      )}
    </section>
  );
}
