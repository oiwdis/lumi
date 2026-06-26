import { useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { LESSON_UNITS, FLAT_LESSONS } from '../data/lessonPath';
import { COURSES } from '../data';
import { getLevelForXp, xpProgressInLevel } from '../lib/levels';
import Avatar from './Avatar';

const LANG_NAME: Record<string, string> = {
  'en-es': 'Spanish', 'en-zh': 'Chinese', 'en-fr': 'French', 'en-ja': 'Japanese',
};

// Zigzag horizontal offsets for lesson nodes (4-step pattern)
const ZIGZAG = ['12%', '38%', '62%', '38%'];

export default function LessonPath() {
  const { selectedCourse, completedLessons, xp, streak, startLesson, goBack, logout } = useAppStore();
  const course = selectedCourse ? COURSES.find(c => c.id === selectedCourse) : null;
  const langName = selectedCourse ? (LANG_NAME[selectedCourse] ?? 'Unknown') : '';
  const done = selectedCourse ? (completedLessons[selectedCourse] ?? []) : [];
  const level = getLevelForXp(xp);
  const { pct } = xpProgressInLevel(xp);

  // First uncompleted lesson index (in flat list)
  const currentIdx = FLAT_LESSONS.findIndex(l => !done.includes(l.id));
  const currentLessonId = currentIdx >= 0 ? FLAT_LESSONS[currentIdx].id : null;

  const currentNodeRef = useRef<HTMLButtonElement>(null);

  // Track which flat index each lesson is at
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

      {/* Lesson path */}
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

          const unitDone = unitLessons.every(l => l.isCompleted);
          const unitActive = !unitDone && unitLessons.some(l => !l.isLocked);

          return (
            <div key={unit.id} className="path-unit">
              {/* Unit banner */}
              <div
                className="path-unit-banner"
                style={{ background: unit.color }}
              >
                <span className="path-unit-emoji">{unit.emoji}</span>
                <div className="path-unit-text">
                  <span className="path-unit-label">{unit.title}</span>
                  <span className="path-unit-subtitle">{unit.subtitle}</span>
                </div>
                {unitDone && <span className="path-unit-check">✓</span>}
              </div>

              {/* Lesson nodes */}
              <div className="path-nodes">
                {unitLessons.map(({ lesson, fi, isCompleted, isCurrent, isLocked }, i) => {
                  const offset = ZIGZAG[i % ZIGZAG.length];
                  return (
                    <div
                      key={lesson.id}
                      className="path-node-row"
                      style={{ paddingLeft: offset }}
                    >
                      {isCurrent ? (
                        <div className="path-node-wrapper">
                          <div className="path-node-label">{lesson.title}</div>
                          <button
                            ref={currentNodeRef}
                            className="path-node path-node--current"
                            style={{ borderBottomColor: unit.color, background: unit.color }}
                            onClick={() => startLesson(lesson.id)}
                            title={lesson.title}
                          >
                            <span className="path-node-emoji">{lesson.emoji}</span>
                          </button>
                          <div
                            className="path-node-start-badge"
                            style={{ background: unit.color }}
                            onClick={() => startLesson(lesson.id)}
                          >
                            START
                          </div>
                        </div>
                      ) : isCompleted ? (
                        <div className="path-node-wrapper">
                          <button
                            className="path-node path-node--done"
                            style={{ borderBottomColor: '#58A700', background: '#58CC02' }}
                            onClick={() => startLesson(lesson.id)}
                            title={`${lesson.title} — Practice again`}
                          >
                            <span className="path-node-check">✓</span>
                          </button>
                        </div>
                      ) : (
                        <div className="path-node-wrapper">
                          <button
                            className="path-node path-node--locked"
                            disabled
                            title={`${lesson.title} — Complete previous lessons to unlock`}
                          >
                            🔒
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* All done message */}
        {currentLessonId === null && (
          <div className="path-complete">
            <div className="path-complete-icon">🏆</div>
            <h2>You've completed all lessons!</h2>
            <p>Keep practicing to master {langName}.</p>
            <button
              className="path-replay-btn"
              onClick={() => startLesson(FLAT_LESSONS[0].id)}
            >
              Start over →
            </button>
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
