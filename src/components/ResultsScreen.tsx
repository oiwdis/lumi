import { useAppStore } from '../store/useAppStore';
import { getLevelForXp, getNextLevel, xpProgressInLevel } from '../lib/levels';
import Avatar from './Avatar';

export default function ResultsScreen() {
  const { session, xp, streak, wordRecords, selectedCourse, goHome } = useAppStore();

  const courseWords = selectedCourse
    ? Object.values(wordRecords).filter(r => r.courseId === selectedCourse)
    : [];
  const knownWords = courseWords.filter(r => r.status === 'known').length;

  const sessionXp = session?.xpEarned ?? 0;
  const prevXp = xp - sessionXp;

  const prevLevel = getLevelForXp(prevXp);
  const curLevel = getLevelForXp(xp);
  const leveledUp = curLevel.level > prevLevel.level;

  const nextLevel = getNextLevel(xp);
  const { earned, needed, pct } = xpProgressInLevel(xp);

  return (
    <div className="results-screen">
      {leveledUp ? (
        <div className="results-levelup">
          <div className="levelup-glow" style={{ '--lvl-color': curLevel.color } as React.CSSProperties} />
          <div className="results-avatar-wrap">
            <Avatar avatarId={curLevel.avatarId} color={curLevel.color} size={96} />
          </div>
          <h2 className="results-title levelup-title">Level Up!</h2>
          <p className="levelup-subtitle" style={{ color: curLevel.color }}>
            Level {curLevel.level} · {curLevel.title}
          </p>
          <p className="results-sub">You unlocked a new avatar!</p>
        </div>
      ) : (
        <div className="results-hero">
          <div className="results-avatar-wrap">
            <Avatar avatarId={curLevel.avatarId} color={curLevel.color} size={80} />
          </div>
          <h2 className="results-title">Session Complete!</h2>
          <p className="results-sub">Great work. Your brain is building new pathways.</p>
        </div>
      )}

      <div className="results-stats">
        <div className="res-stat">
          <span className="res-stat-num">+{sessionXp}</span>
          <span className="res-stat-lbl">⚡ XP earned</span>
        </div>
        <div className="res-stat">
          <span className="res-stat-num">{streak}</span>
          <span className="res-stat-lbl">🔥 Day streak</span>
        </div>
        <div className="res-stat">
          <span className="res-stat-num">{courseWords.length}</span>
          <span className="res-stat-lbl">📖 Words seen</span>
        </div>
        <div className="res-stat">
          <span className="res-stat-num">{knownWords}</span>
          <span className="res-stat-lbl">✅ Words known</span>
        </div>
      </div>

      {/* XP progress bar toward next level */}
      <div className="results-xp-progress">
        <div className="rxp-header">
          <span className="rxp-label">Level {curLevel.level} · {curLevel.title}</span>
          {nextLevel
            ? <span className="rxp-next">Next: {nextLevel.title}</span>
            : <span className="rxp-next">Max level!</span>}
        </div>
        <div className="rxp-bar-bg">
          <div
            className="rxp-bar-fill"
            style={{ width: `${pct}%`, background: curLevel.color }}
          />
        </div>
        <div className="rxp-counts">
          <span>{earned} / {needed} XP</span>
          <span>{xp} total XP</span>
        </div>
      </div>

      <div className="results-science">
        <div className="science-icon">🧠</div>
        <p className="science-tip">
          <strong>Science tip:</strong> The words you looked up today have been scheduled for review.
          Return tomorrow to strengthen them before they fade from memory.
        </p>
      </div>

      <button className="primary-btn" onClick={goHome}>
        Back to Home
      </button>
    </div>
  );
}
