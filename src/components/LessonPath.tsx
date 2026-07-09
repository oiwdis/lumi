import { useAppStore } from '../store/useAppStore';
import { LESSON_UNITS, FLAT_LESSONS, type UnitDef, type LessonDef } from '../data/lessonPath';
import type { CustomUnit } from '../store/useAppStore';
import { COURSES } from '../data';
import { getLevelForXp, xpProgressInLevel } from '../lib/levels';
import Avatar from './Avatar';

const LANG_NAME: Record<string, string> = {
  'en-es': 'Spanish', 'en-zh': 'Chinese', 'en-fr': 'French', 'en-ja': 'Japanese', 'en-ko': 'Korean', 'en-de': 'German',
};

export default function LessonPath() {
  const { selectedCourse, completedLessons, xp, streak, customLessons, customGoal, goalSkipped, theme, startLesson, goBack, logout, openProfile, openOnboarding, toggleTheme } = useAppStore();
  const course = selectedCourse ? COURSES.find(c => c.id === selectedCourse) : null;
  const langName = selectedCourse ? (LANG_NAME[selectedCourse] ?? 'Unknown') : '';
  const done = selectedCourse ? (completedLessons[selectedCourse] ?? []) : [];
  const level = getLevelForXp(xp);
  const { pct } = xpProgressInLevel(xp);

  // Use AI-generated custom lessons if available, otherwise fall back to defaults
  const activeCustom: CustomUnit[] | null = selectedCourse ? (customLessons[selectedCourse] ?? null) : null;
  const activeUnits: UnitDef[] | CustomUnit[] = activeCustom ?? LESSON_UNITS;
  const activeFlatLessons: LessonDef[] = activeCustom
    ? activeCustom.flatMap(u => u.lessons.map(l => ({ id: l.id, title: l.title, emoji: l.emoji, topicId: `custom:${l.id}`, xpReward: 20 })))
    : FLAT_LESSONS;

  const currentIdx = activeFlatLessons.findIndex(l => !done.includes(l.id));
  const currentGoal = selectedCourse ? (customGoal[selectedCourse] ?? null) : null;
  const hasSkipped = selectedCourse ? (goalSkipped[selectedCourse] ?? false) : false;

  let flatIdx = 0;

  return (
    <div className="path-screen">
      {/* Top bar */}
      <div className="path-topbar">
        {/* Row 1: nav */}
        <div className="path-topbar-nav">
          <button className="path-back-btn" onClick={goBack}>←</button>
          <div className="path-course-info">
            <span className="path-flags">{course?.fromFlag} → {course?.toFlag}</span>
            <span className="path-lang-name">{langName}</span>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button className="path-logout-btn" onClick={logout}>Logout</button>
        </div>
        {/* Row 2: action buttons */}
        <div className="path-topbar-actions">
          <button className="path-profile-btn" onClick={openProfile}>
            <Avatar avatarId={level.avatarId} color={level.color} size={22} />
            <div className="path-profile-btn-info">
              <span className="path-profile-btn-title" style={{ color: level.color }}>
                {level.title}
              </span>
              <div className="path-level-bar-wrap">
                <div className="path-level-bar-fill" style={{ width: `${pct}%`, background: level.color }} />
              </div>
            </div>
            <span className="path-profile-btn-lv">Lv {level.level}</span>
          </button>
          <div className="path-topbar-pills">
            <span className="path-pill path-pill--streak">🔥 {streak}</span>
          </div>
        </div>
      </div>

      {/* Lesson grid */}
      <div className="path-scroll">
        {/* Personalization banner */}
        {currentGoal ? (
          <div className="path-goal-banner">
            <span className="path-goal-icon">✨</span>
            <div className="path-goal-text">
              <span className="path-goal-label">Personalized for you</span>
              <span className="path-goal-desc">"{currentGoal}"</span>
            </div>
            <button className="path-goal-edit" onClick={() => selectedCourse && openOnboarding(selectedCourse)}>✏️ Edit goal</button>
          </div>
        ) : !hasSkipped ? (
          <div className="path-goal-banner path-goal-banner--empty" onClick={() => selectedCourse && openOnboarding(selectedCourse)}>
            <span className="path-goal-icon">🌱</span>
            <div className="path-goal-text">
              <span className="path-goal-label">Make these lessons yours</span>
              <span className="path-goal-desc">Tell Lumi why you're learning {langName} — get a personalised curriculum in 15 seconds</span>
            </div>
            <button className="path-goal-edit path-goal-edit--cta" onClick={() => selectedCourse && openOnboarding(selectedCourse)}>Set goal →</button>
          </div>
        ) : null}

        {activeUnits.map(unit => {
          const unitStart = flatIdx;
          const unitLessons = unit.lessons.map((lesson, lessonIdx) => {
            const fi = unitStart + lessonIdx;
            const isCompleted = done.includes(lesson.id);
            const isCurrent = fi === currentIdx;
            const isFirstInUnit = lessonIdx === 0;
            const isLocked = !isCompleted && fi > currentIdx && !isFirstInUnit;
            return { lesson, fi, isCompleted, isCurrent, isLocked };
          });
          flatIdx += unit.lessons.length;

          const completedCount = unitLessons.filter(l => l.isCompleted).length;
          const unitDone = completedCount === unitLessons.length;

          return (
            <div key={unit.id} className="path-unit">
              <div className="path-chapter-header" style={{ borderColor: unit.color }}>
                <div className="path-chapter-left">
                  <span className="path-chapter-emoji" style={{ background: unit.color }}>{unit.emoji}</span>
                  <div>
                    <div className="path-chapter-title">{unit.title} — {unit.subtitle}</div>
                    <div className="path-chapter-progress">
                      {completedCount}/{unitLessons.length} lessons
                      {unitDone && <span className="path-chapter-done"> · Complete ✓</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="path-card-grid">
                {unitLessons.map(({ lesson, isCompleted, isCurrent, isLocked }) => (
                  <button
                    key={lesson.id}
                    className={`path-card ${isCompleted ? 'path-card--done' : ''} ${isCurrent ? 'path-card--current' : ''} ${isLocked ? 'path-card--locked' : ''}`}
                    onClick={() => !isLocked && startLesson(lesson.id)}
                    disabled={isLocked}
                    style={isCurrent ? { '--card-accent': unit.color } as React.CSSProperties : undefined}
                  >
                    <span className="path-card-emoji">{isLocked ? '🔒' : lesson.emoji}</span>
                    <span className="path-card-title">{lesson.title}</span>
                    {isCompleted && <span className="path-card-check">✓</span>}
                    {isCurrent && <span className="path-card-play">▶</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {currentIdx === -1 && (
          <div className="path-complete">
            <div className="path-complete-icon">🏆</div>
            <h2>Course complete!</h2>
            <p>You've mastered all {activeFlatLessons.length} lessons in {langName}.</p>
            <button className="path-replay-btn" onClick={() => startLesson(activeFlatLessons[0].id)}>
              Start over →
            </button>
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
