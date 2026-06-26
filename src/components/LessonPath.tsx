import { useAppStore } from '../store/useAppStore';
import { LESSON_UNITS, FLAT_LESSONS } from '../data/lessonPath';
import { COURSES } from '../data';
import { getLevelForXp, xpProgressInLevel } from '../lib/levels';
import Avatar from './Avatar';

const LANG_NAME: Record<string, string> = {
  'en-es': 'Spanish', 'en-zh': 'Chinese', 'en-fr': 'French', 'en-ja': 'Japanese',
};

export default function LessonPath() {
  const { selectedCourse, completedLessons, xp, streak, startLesson, goBack, logout } = useAppStore();
  const course = selectedCourse ? COURSES.find(c => c.id === selectedCourse) : null;
  const langName = selectedCourse ? (LANG_NAME[selectedCourse] ?? 'Unknown') : '';
  const done = selectedCourse ? (completedLessons[selectedCourse] ?? []) : [];
  const level = getLevelForXp(xp);
  const { pct } = xpProgressInLevel(xp);

  const currentIdx = FLAT_LESSONS.findIndex(l => !done.includes(l.id));

  let flatIdx = 0;

  return (
    <div className="path-screen">
      {/* Top bar */}
      <div className="path-topbar">
        <button className="path-back-btn" onClick={goBack}>←</button>
        <div className="path-course-info">
          <span className="path-flags">{course?.fromFlag} → {course?.toFlag}</span>
          <span className="path-lang-name">{langName}</span>
        </div>
        <div className="path-topbar-right">
          <div className="path-level-chip" title={`${xp} XP`}>
            <Avatar avatarId={level.avatarId} color={level.color} size={26} />
            <div className="path-level-bar-wrap">
              <div className="path-level-bar-fill" style={{ width: `${pct}%`, background: level.color }} />
            </div>
          </div>
          <span className="path-streak">🔥{streak}</span>
          <button className="path-logout-btn" onClick={logout}>⏏</button>
        </div>
      </div>

      {/* Lesson grid */}
      <div className="path-scroll">
        {LESSON_UNITS.map(unit => {
          const unitStart = flatIdx;
          const unitLessons = unit.lessons.map((lesson, lessonIdx) => {
            const fi = unitStart + lessonIdx;
            const isCompleted = done.includes(lesson.id);
            const isCurrent = fi === currentIdx;
            const isLocked = !isCompleted && fi > currentIdx;
            return { lesson, fi, isCompleted, isCurrent, isLocked };
          });
          flatIdx += unit.lessons.length;

          const completedCount = unitLessons.filter(l => l.isCompleted).length;
          const unitDone = completedCount === unitLessons.length;

          return (
            <div key={unit.id} className="path-unit">
              {/* Chapter header */}
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

              {/* 2-column card grid */}
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
            <p>You've mastered all {FLAT_LESSONS.length} lessons in {langName}.</p>
            <button className="path-replay-btn" onClick={() => startLesson(FLAT_LESSONS[0].id)}>
              Start over →
            </button>
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
