import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getUnits, type CourseId } from '../data/lessons';
import LessonScreen from './LessonScreen';

const COURSE_LABELS: Record<CourseId, string> = {
  'en-es': '🇺🇸 → 🇪🇸 Spanish',
  'en-zh': '🇺🇸 → 🇨🇳 Chinese',
  'es-en': '🇪🇸 → 🇺🇸 English',
  'zh-en': '🇨🇳 → 🇺🇸 English',
};

const COURSE_FLAG: Record<CourseId, string> = {
  'en-es': '🇪🇸',
  'en-zh': '🇨🇳',
  'es-en': '🇺🇸',
  'zh-en': '🇺🇸',
};

export default function HomeScreen() {
  const { selectedCourse, xp, streak, hearts, completedLessons, setCourse, resetHearts } = useGameStore();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  if (!selectedCourse) return null;

  const units = getUnits(selectedCourse);
  const totalLessons = units.flatMap((u) => u.lessons).length;
  const completedCount = completedLessons.filter((id) =>
    units.flatMap((u) => u.lessons).some((l) => l.id === id)
  ).length;

  if (activeLessonId) {
    const lesson = units.flatMap((u) => u.lessons).find((l) => l.id === activeLessonId);
    if (lesson) {
      return <LessonScreen lesson={lesson} onExit={() => setActiveLessonId(null)} />;
    }
  }

  return (
    <div className="home-screen">
      {/* Top bar */}
      <div className="top-bar">
        <button className="flag-btn" onClick={() => setCourse(null as unknown as CourseId)}>
          {COURSE_FLAG[selectedCourse]}
        </button>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-icon">🔥</span>
            <span className="stat-val">{streak}</span>
          </div>
          <div className="stat">
            <span className="stat-icon">⚡</span>
            <span className="stat-val">{xp}</span>
          </div>
          <div className="stat">
            <span className="stat-icon">❤️</span>
            <span className="stat-val">{hearts}</span>
            {hearts < 5 && (
              <button className="refill-btn" onClick={resetHearts} title="Refill hearts">+</button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-section">
        <div className="progress-label">
          <span>{COURSE_LABELS[selectedCourse]}</span>
          <span>{completedCount}/{totalLessons} lessons</span>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Units */}
      <div className="units-list">
        {units.map((unit) => {
          const unitCompleted = unit.lessons.filter((l) => completedLessons.includes(l.id)).length;
          return (
            <div key={unit.id} className="unit-block">
              <div className="unit-header" style={{ borderColor: unit.color }}>
                <div className="unit-badge" style={{ background: unit.color }}>{unit.title}</div>
                <span className="unit-progress">{unitCompleted}/{unit.lessons.length}</span>
              </div>

              <div className="lesson-path">
                {unit.lessons.map((lesson, idx) => {
                  const done = completedLessons.includes(lesson.id);
                  const prevDone = idx === 0 || completedLessons.includes(unit.lessons[idx - 1].id);
                  const locked = !prevDone && idx !== 0;

                  return (
                    <div key={lesson.id} className={`lesson-node-wrap ${idx % 2 === 0 ? 'left' : 'right'}`}>
                      <button
                        className={`lesson-node ${done ? 'done' : locked ? 'locked' : 'available'}`}
                        style={done ? { background: unit.color, borderColor: unit.color } : locked ? {} : { borderColor: unit.color, color: unit.color }}
                        onClick={() => !locked && hearts > 0 && setActiveLessonId(lesson.id)}
                        disabled={locked || hearts === 0}
                        title={locked ? 'Complete previous lessons first' : hearts === 0 ? 'No hearts left!' : lesson.title}
                      >
                        <span className="lesson-icon">{done ? '✓' : locked ? '🔒' : lesson.icon}</span>
                      </button>
                      <div className="lesson-label">
                        <span className="lesson-title">{lesson.title}</span>
                        <span className="lesson-xp">+{lesson.xpReward} XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
