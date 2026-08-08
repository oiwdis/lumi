import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { authHeader } from '../lib/authHeader';
import { LEVELS, getLevelForXp, getNextLevel, xpProgressInLevel } from '../lib/levels';
import { COURSES } from '../data';
import Avatar from './Avatar';

export default function ProfileScreen() {
  const { user, xp, streak, completedLessons, account, refreshPlan, goBack } = useAppStore();
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState('');

  // Coming back from Stripe, the plan is granted by webhook rather than by this
  // redirect, so it can land a beat after the browser does. Re-ask a few times
  // instead of showing "Free" to someone who just paid.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;
    window.history.replaceState({}, '', '/profile');
    let tries = 0;
    const id = window.setInterval(() => {
      refreshPlan();
      if (++tries >= 5) window.clearInterval(id);
    }, 1500);
    return () => window.clearInterval(id);
  }, [refreshPlan]);

  const openBilling = async (path: '/api/stripe/checkout' | '/api/stripe/portal') => {
    setBillingBusy(true);
    setBillingError('');
    try {
      const res = await fetch(path, { method: 'POST', headers: { ...authHeader() } });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error ?? 'Could not open billing.');
      window.location.href = data.url;
    } catch (e: unknown) {
      setBillingError(e instanceof Error ? e.message : 'Something went wrong');
      setBillingBusy(false);
    }
  };
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
        {/* Plan. The upgrade button is only reachable by the beta account —
            Stripe is on test keys, so a real visitor who tried to pay would be
            declined and would reasonably conclude the site is broken. */}
        <div className={`plan-card${account.plan === 'pro' ? ' plan-card--pro' : ''}`}>
          <div className="plan-card-head">
            <span className="plan-card-name">{account.plan === 'pro' ? '✦ Lumi Pro' : 'Free plan'}</span>
            {account.plan === 'pro' && <span className="plan-card-badge">Active</span>}
          </div>
          {account.plan === 'pro' ? (
            <p className="plan-card-sub">Unlimited tutor questions, 10-unit courses, offline lessons.</p>
          ) : (
            <p className="plan-card-sub">
              {account.chatLimit === null
                ? 'Tutor questions are unlimited.'
                : `${Math.max(0, account.chatLimit - account.typedChatsToday)} of ${account.chatLimit} tutor questions left today.`}
            </p>
          )}

          {account.betaAccess && account.plan !== 'pro' && (
            <>
              <ul className="plan-perks">
                <li>Unlimited tutor questions</li>
                <li>10-unit courses instead of 5</li>
                <li>Lessons keep working offline</li>
                <li>Higher limits on everything AI</li>
              </ul>
              <button className="plan-btn" disabled={billingBusy} onClick={() => openBilling('/api/stripe/checkout')}>
                {billingBusy ? 'Opening…' : 'Upgrade to Pro — $8/mo'}
              </button>
              <p className="plan-card-note">Beta — test mode. No real card is charged.</p>
            </>
          )}

          {account.plan === 'pro' && (
            <button className="plan-btn plan-btn--ghost" disabled={billingBusy} onClick={() => openBilling('/api/stripe/portal')}>
              {billingBusy ? 'Opening…' : 'Manage billing'}
            </button>
          )}

          {billingError && <p className="plan-card-error">{billingError}</p>}
        </div>

        <div className="profile-stats-grid">
          <div className="profile-stat">
            <div className="profile-stat-val">🔥{streak}</div>
            <div className="profile-stat-lbl">Day streak</div>
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
