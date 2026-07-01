import { useAppStore } from '../store/useAppStore';
import { LEVELS, getLevelForXp, getNextLevel, xpProgressInLevel } from '../lib/levels';
import { COURSES } from '../data';
import Avatar from './Avatar';

export default function ProfileScreen() {
  const { user, xp, coins, streak, completedLessons, goBack } = useAppStore();
  const level = getLevelForXp(xp);
  const next = getNextLevel(xp);
  const { earned, needed, pct } = xpProgressInLevel(xp);

  const totalLessons = Object.values(completedLessons).reduce((sum, arr) => sum + arr.length, 0);
  const coursesStarted = COURSES.filter(c => (completedLessons[c.id]?.length ?? 0) > 0);

  return (
    <div className="profile-screen">
      <div className="profile-topbar">
        <button className="profile-back-btn" onClick={goBack}>←</button>
        <span className="profile-title">Profile</span>
        <div style={{ width: 48 }} />
      </div>

      <div className="profile-scroll">
        {/* Hero card */}
        <div className="profile-hero" style={{ '--level-color': level.color } as React.CSSProperties}>
          <div className="profile-avatar-wrap">
            <Avatar avatarId={level.avatarId} color={level.color} size={90} />
            <div className="profile-level-badge" style={{ background: level.color }}>{level.level}</div>
          </div>

          <div className="profile-name">{user?.name ?? 'Learner'}</div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-rank-title" style={{ color: level.color }}>{level.title}</div>

          {/* XP bar */}
          <div className="profile-xp-bar-wrap">
            <div className="profile-xp-bar-track">
              <div className="profile-xp-bar-fill" style={{ width: `${pct}%`, background: level.color }} />
            </div>
            <div className="profile-xp-label">
              {next
                ? <>{xp.toLocaleString()} XP · {(needed - earned).toLocaleString()} to level {next.level}</>
                : <>{xp.toLocaleString()} XP · Max level!</>
              }
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-grid">
          <div className="profile-stat">
            <div className="profile-stat-val">🔥{streak}</div>
            <div className="profile-stat-lbl">Day streak</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val" style={{ color: 'var(--amber)' }}>🪙{coins.toLocaleString()}</div>
            <div className="profile-stat-lbl">Coins</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val">{totalLessons}</div>
            <div className="profile-stat-lbl">Lessons done</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val">{xp.toLocaleString()}</div>
            <div className="profile-stat-lbl">Total XP</div>
          </div>
        </div>

        {/* Courses */}
        {coursesStarted.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title">Languages</div>
            {coursesStarted.map(course => {
              const done = completedLessons[course.id]?.length ?? 0;
              return (
                <div key={course.id} className="profile-course-row" style={{ '--course-color': course.color } as React.CSSProperties}>
                  <span className="profile-course-flags">{course.fromFlag}→{course.toFlag}</span>
                  <div className="profile-course-info">
                    <span className="profile-course-name">{course.toLang}</span>
                    <span className="profile-course-count">{done} lessons completed</span>
                  </div>
                  <div className="profile-course-dot" style={{ background: course.color }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Level progression */}
        <div className="profile-section">
          <div className="profile-section-title">Level Progression</div>
          <div className="profile-levels-list">
            {LEVELS.map(lvl => {
              const isReached = xp >= lvl.minXp;
              const isCurrent = lvl.level === level.level;
              return (
                <div key={lvl.level} className={`profile-level-row ${isReached ? 'profile-level-row--reached' : ''} ${isCurrent ? 'profile-level-row--current' : ''}`}>
                  <div className="profile-level-avatar">
                    <Avatar avatarId={lvl.avatarId} color={isReached ? lvl.color : '#444'} size={36} />
                  </div>
                  <div className="profile-level-info">
                    <span className="profile-level-num">Lv {lvl.level}</span>
                    <span className="profile-level-name" style={isReached ? { color: lvl.color } : {}}>{lvl.title}</span>
                  </div>
                  <div className="profile-level-xp">{lvl.minXp.toLocaleString()} XP</div>
                  {isCurrent && <span className="profile-level-here">← you</span>}
                  {isReached && !isCurrent && <span className="profile-level-check">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
