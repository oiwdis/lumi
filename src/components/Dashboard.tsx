import { useAppStore } from '../store/useAppStore';
import { getCourse } from '../data';
import { getLessonsForCourse } from '../data/courseLessons';
import { isDue } from '../lib/srs';
import { getLevelForXp, getNextLevel, xpProgressInLevel } from '../lib/levels';
import Avatar from './Avatar';

export default function Dashboard() {
  const { selectedCourse, wordRecords, lessonProgress, xp, streak, startSession, repeatLesson, setCourse, resetProgress, logout, user } = useAppStore();
  if (!selectedCourse) return null;

  const course = getCourse(selectedCourse);
  const lessons = getLessonsForCourse(selectedCourse);

  const courseKeys = Object.keys(wordRecords).filter(k => k.startsWith(selectedCourse + ':'));
  const totalWords = courseKeys.length;
  const knownWords = courseKeys.filter(k => wordRecords[k].status === 'known').length;
  const dueCount = courseKeys.filter(k => isDue(wordRecords[k])).length;

  const currentLessonIdx = lessonProgress[selectedCourse] ?? 0;
  const currentLesson = lessons[currentLessonIdx];
  const lessonsCompleted = currentLessonIdx;

  const level = getLevelForXp(xp);
  const nextLevel = getNextLevel(xp);
  const { earned, needed, pct } = xpProgressInLevel(xp);

  return (
    <div className="dashboard">
      <div className="dash-header">
        <button className="back-btn" onClick={() => useAppStore.setState({ screen: 'select', selectedCourse: null })}>←</button>
        <div className="dash-course-tag">
          <span>{course.fromFlag} → {course.toFlag}</span>
          <span className="dash-course-name">{course.fromLang} → {course.toLang}</span>
        </div>
        <div className="dash-header-right">
          {user && <span className="dash-user-name">{user.name}</span>}
          <button className="reset-btn" onClick={resetProgress} title="Reset progress">↺</button>
          <button className="logout-btn" onClick={logout} title="Log out">⏏</button>
        </div>
      </div>

      {/* Level card */}
      <div className="level-card">
        <Avatar avatarId={level.avatarId} color={level.color} size={56} />
        <div className="level-card-info">
          <div className="level-card-top">
            <span className="level-card-title" style={{ color: level.color }}>
              Lv.{level.level} {level.title}
            </span>
            {nextLevel && (
              <span className="level-card-next">→ {nextLevel.title} at {nextLevel.minXp} XP</span>
            )}
          </div>
          <div className="level-bar-bg">
            <div className="level-bar-fill" style={{ width: `${pct}%`, background: level.color }} />
          </div>
          <div className="level-bar-counts">{earned} / {needed} XP</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-num">{streak}</span>
          <span className="stat-lbl">🔥 Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{xp}</span>
          <span className="stat-lbl">⚡ XP</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{totalWords}</span>
          <span className="stat-lbl">📖 Words</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{knownWords}</span>
          <span className="stat-lbl">✅ Known</span>
        </div>
      </div>

      {/* Due reviews badge */}
      {dueCount > 0 && (
        <div className="due-banner">
          <span>🧠</span>
          <span><strong>{dueCount}</strong> word{dueCount !== 1 ? 's' : ''} ready for review</span>
        </div>
      )}

      {/* Lesson path */}
      <div className="lesson-path">
        <div className="lesson-path-header">
          <span>Your path</span>
          <span className="lesson-path-count">{lessonsCompleted}/{lessons.length} lessons</span>
        </div>
        <div className="lesson-list">
          {lessons.map((lesson, i) => {
            const isComplete = i < currentLessonIdx;
            const isCurrent = i === currentLessonIdx;
            const isLocked = i > currentLessonIdx;
            return (
              <div
                key={lesson.id}
                className={`lesson-item ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
              >
                <div className="lesson-icon">
                  {isComplete ? '✅' : isCurrent ? lesson.emoji : '🔒'}
                </div>
                <div className="lesson-info">
                  <div className="lesson-title">{lesson.title}</div>
                  <div className="lesson-sub">
                    {isComplete ? 'Complete' : isCurrent ? `${lesson.vocab.length} new words · story · quiz` : lesson.titleTranslation}
                  </div>
                </div>
                {isCurrent && <div className="lesson-badge">Now</div>}
                {isComplete && (
                  <button className="lesson-redo-btn" onClick={() => repeatLesson(i)} title="Redo this lesson">↩</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lesson flow preview */}
      {currentLesson && (
        <div className="session-flow-preview">
          <p className="flow-label">Today's session</p>
          <div className="flow-steps">
            <div className="flow-step">
              <span className="flow-step-icon">📚</span>
              <span>{currentLesson.vocab.length} new words</span>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <span className="flow-step-icon">💭</span>
              <span>Quick quiz</span>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <span className="flow-step-icon">📖</span>
              <span>Story</span>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <span className="flow-step-icon">🎯</span>
              <span>Comprehension</span>
            </div>
          </div>
        </div>
      )}

      {!currentLesson && (
        <div className="course-complete-banner">
          🎉 You've completed all lessons! Keep reviewing to strengthen your memory.
        </div>
      )}

      {/* Start session */}
      <button className="start-btn" onClick={startSession}>
        {dueCount > 0
          ? `Start Session · ${dueCount} review${dueCount !== 1 ? 's' : ''} due`
          : currentLesson
          ? `Start Lesson ${currentLessonIdx + 1}: ${currentLesson.title}`
          : 'Review Words'}
      </button>
    </div>
  );
}
