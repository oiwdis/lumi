import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CourseId } from '../types';

export interface WordStat {
  correct: number;
  wrong: number;
  interval: number;   // days until next review
  nextDue: number;    // timestamp ms
}

interface UserProgress {
  completedLessons: Record<string, string[]>;
  xp: number;
  streak: number;
  lastSessionDate: string | null;
  customLessons: Record<string, CustomUnit[]>;
  customGoal: Record<string, string>;
  goalSkipped: Record<string, boolean>;
  wordStats: Record<string, WordStat>; // key: `${courseId}:${word.target}`
  // When each course's goal was last changed, so a sync can tell which side is
  // newer instead of assuming the server is. Missing entry = older than anything.
  goalUpdatedAt: Record<string, number>;
}

function emptyProgress(): UserProgress {
  return {
    completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null,
    customLessons: {}, customGoal: {}, goalSkipped: {}, wordStats: {},
    goalUpdatedAt: {},
  };
}

function loadProgress(userId: string): UserProgress {
  try {
    const saved = localStorage.getItem(`lumi-progress-${userId}`);
    return saved ? { ...emptyProgress(), ...JSON.parse(saved) } : emptyProgress();
  } catch { return emptyProgress(); }
}

const SYNC_QUEUE_KEY = 'lumi-sync-pending';

function flushSyncQueue() {
  const token = localStorage.getItem('lumi-token');
  if (!token) return;
  const raw = localStorage.getItem(SYNC_QUEUE_KEY);
  if (!raw) return;
  const pending: UserProgress = JSON.parse(raw);
  localStorage.removeItem(SYNC_QUEUE_KEY);
  postProgress(token, pending);
}

// A rejected fetch is not the only way this fails — a 4xx/5xx resolves
// normally, so check the status too or the snapshot is dropped silently.
function postProgress(token: string, p: UserProgress) {
  const requeue = () => localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(p));
  fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(p),
  })
    .then(res => { if (!res.ok) requeue(); })
    .catch(requeue);
}

// Flush queued progress whenever we come back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushSyncQueue);
}

function saveProgress(userId: string, p: UserProgress) {
  localStorage.setItem(`lumi-progress-${userId}`, JSON.stringify(p));
  const token = localStorage.getItem('lumi-token');
  if (!token) return;
  if (!navigator.onLine) {
    // Queue latest snapshot; next flush will send it
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(p));
    return;
  }
  postProgress(token, p);
}

function mergeProgress(base: UserProgress, server: UserProgress): UserProgress {
  // For wordStats: keep whichever entry has more total attempts or a later nextDue
  const mergedWordStats: Record<string, WordStat> = { ...base.wordStats };
  for (const [key, sv] of Object.entries(server.wordStats ?? {})) {
    const bv = base.wordStats[key];
    if (!bv) {
      mergedWordStats[key] = sv;
    } else {
      const baseTotalAttempts = bv.correct + bv.wrong;
      const serverTotalAttempts = sv.correct + sv.wrong;
      mergedWordStats[key] = serverTotalAttempts >= baseTotalAttempts ? sv : bv;
    }
  }
  return {
    xp: Math.max(base.xp, server.xp ?? 0),
    streak: Math.max(base.streak, server.streak ?? 0),
    lastSessionDate: base.lastSessionDate ?? server.lastSessionDate,
    completedLessons: (() => {
      const out: Record<string, string[]> = { ...base.completedLessons };
      for (const [c, ids] of Object.entries(server.completedLessons ?? {})) {
        out[c] = [...new Set([...(out[c] ?? []), ...(ids as string[])])];
      }
      return out;
    })(),
    // Goal state is merged per course, taking whichever side was edited last.
    // Previously the server's copy replaced the local one outright, so a goal
    // set on this device could be wiped by the next background sync before its
    // POST had landed.
    ...mergeGoals(base, server),
    wordStats: mergedWordStats,
  };
}

type GoalFields = Pick<UserProgress, 'customLessons' | 'customGoal' | 'goalSkipped' | 'goalUpdatedAt'>;

function mergeGoals(base: UserProgress, server: UserProgress): GoalFields {
  const out: GoalFields = {
    customLessons: { ...base.customLessons },
    customGoal: { ...base.customGoal },
    goalSkipped: { ...base.goalSkipped },
    goalUpdatedAt: { ...base.goalUpdatedAt },
  };

  const courses = new Set([
    ...Object.keys(base.customLessons ?? {}), ...Object.keys(server.customLessons ?? {}),
    ...Object.keys(base.customGoal ?? {}),    ...Object.keys(server.customGoal ?? {}),
    ...Object.keys(base.goalSkipped ?? {}),   ...Object.keys(server.goalSkipped ?? {}),
  ]);

  for (const c of courses) {
    const baseAt   = base.goalUpdatedAt?.[c] ?? 0;
    const serverAt = server.goalUpdatedAt?.[c] ?? 0;
    // Only let the server override when it is strictly newer. Ties and missing
    // timestamps favour whatever this device already has.
    const takeServer = serverAt > baseAt || (baseAt === 0 && serverAt === 0 && base.customLessons?.[c] === undefined);
    if (!takeServer) continue;

    if (server.customLessons?.[c] !== undefined) out.customLessons[c] = server.customLessons[c];
    if (server.customGoal?.[c]    !== undefined) out.customGoal[c]    = server.customGoal[c];
    if (server.goalSkipped?.[c]   !== undefined) out.goalSkipped[c]   = server.goalSkipped[c];
    if (serverAt) out.goalUpdatedAt[c] = serverAt;
  }

  return out;
}

type Screen = 'home' | 'login' | 'select' | 'onboarding' | 'path' | 'chat' | 'profile';

export interface CustomWord { english: string; target: string; hint?: string; reading?: string; }
export interface CustomLesson { id: string; title: string; emoji: string; words: CustomWord[]; }
export interface CustomUnit { id: string; title: string; subtitle: string; emoji: string; color: string; lessons: CustomLesson[]; }

interface AuthUser { id: string; name: string; email: string; }

interface AppStore {
  screen: Screen;
  theme: 'dark' | 'light';
  user: AuthUser | null;
  selectedCourse: CourseId | null;
  currentLessonId: string | null;
  completedLessons: Record<string, string[]>;
  xp: number;
  streak: number;
  lastSessionDate: string | null;
  customLessons: Record<string, CustomUnit[]>;
  customGoal: Record<string, string>;
  goalSkipped: Record<string, boolean>;
  wordStats: Record<string, WordStat>;
  goalUpdatedAt: Record<string, number>;

  setScreen: (screen: Screen) => void;
  toggleTheme: () => void;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
  setCourse: (c: CourseId) => void;
  startLesson: (lessonId: string) => void;
  completeLesson: () => void;
  goBack: () => void;
  addXp: (amount: number) => void;
  recordAnswer: (courseId: string, wordTarget: string, correct: boolean) => void;
  syncFromServer: () => void;
  openProfile: () => void;
  openOnboarding: (c: CourseId) => void;
  setCustomLessons: (courseId: string, units: CustomUnit[], goal: string) => void;
  skipOnboarding: () => void;
  resetProgress: () => void;
}

function today(): string { return new Date().toISOString().slice(0, 10); }
function yesterday(): string {
  const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10);
}

function getFullProgress(state: AppStore): UserProgress {
  return {
    completedLessons: state.completedLessons,
    xp: state.xp, streak: state.streak, lastSessionDate: state.lastSessionDate,
    customLessons: state.customLessons,
    customGoal: state.customGoal,
    goalSkipped: state.goalSkipped,
    wordStats: state.wordStats,
    goalUpdatedAt: state.goalUpdatedAt,
  };
}

function nextInterval(stat: WordStat | undefined, correct: boolean): number {
  if (!correct) return 1;
  const prev = stat?.interval ?? 0;
  // Double the interval each correct answer: 1 → 2 → 4 → 8 days, cap at 30
  return Math.min(prev === 0 ? 1 : prev * 2, 30);
}

function initialScreen(): Screen {
  try { return localStorage.getItem('lumi-user') ? 'select' : 'home'; } catch { return 'home'; }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      screen: initialScreen(),
      theme: (() => { try { return (localStorage.getItem('lumi-theme') as 'dark' | 'light') ?? 'dark'; } catch { return 'dark'; } })(),
      user: (() => {
        try { const u = localStorage.getItem('lumi-user'); return u ? JSON.parse(u) : null; } catch { return null; }
      })(),
      selectedCourse: null,
      currentLessonId: null,
      completedLessons: {},
      xp: 0,
      streak: 0,
      lastSessionDate: null,
      customLessons: {},
      customGoal: {},
      goalSkipped: {},
      wordStats: {},
      goalUpdatedAt: {},

      login: (user, token?: string) => {
        const localProgress = loadProgress(user.id);
        localStorage.setItem('lumi-user', JSON.stringify(user));
        if (user.email === 'elliot@themaclan.com') {
          const adminProgress: UserProgress = { ...localProgress, xp: 9999, streak: 999 };
          saveProgress(user.id, adminProgress);
          set({ user, screen: 'select', ...adminProgress });
          return;
        }
        set({ user, screen: 'select', ...localProgress });
        const authToken = token ?? localStorage.getItem('lumi-token');
        if (authToken) {
          // Flush any queued offline progress first, then pull from server
          flushSyncQueue();
          fetch('/api/progress', { headers: { 'Authorization': `Bearer ${authToken}` } })
            .then(r => r.ok ? r.json() : null)
            .then((serverProgress: UserProgress | null) => {
              if (!serverProgress) return;
              const current = useAppStore.getState();
              const merged = mergeProgress(getFullProgress(current), serverProgress);
              saveProgress(user.id, merged);
              set(merged);
            })
            .catch(() => {});
        }
      },

      syncFromServer: () => {
        const s = get();
        if (!s.user) return;
        const token = localStorage.getItem('lumi-token');
        if (!token || !navigator.onLine) return;
        flushSyncQueue();
        fetch('/api/progress', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then((serverProgress: UserProgress | null) => {
            if (!serverProgress) return;
            const current = useAppStore.getState();
            const merged = mergeProgress(getFullProgress(current), serverProgress);
            saveProgress(current.user!.id, merged);
            set(merged);
          })
          .catch(() => {});
      },

      setScreen: (screen) => set({ screen }),

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('lumi-theme', next);
        document.body.classList.toggle('light', next === 'light');
        set({ theme: next });
      },

      logout: () => {
        const s = get();
        if (s.user) saveProgress(s.user.id, getFullProgress(s));
        localStorage.removeItem('lumi-token');
        localStorage.removeItem('lumi-user');
        set({ user: null, screen: 'home', selectedCourse: null, currentLessonId: null,
          completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null,
          customLessons: {}, customGoal: {}, goalSkipped: {}, wordStats: {}, goalUpdatedAt: {} });
      },

      setCourse: (c) => set({ selectedCourse: c, screen: 'path' }),
      openOnboarding: (c) => set({ selectedCourse: c, screen: 'onboarding' }),

      skipOnboarding: () => {
        const s = get();
        const course = s.selectedCourse;
        if (!course) { set({ screen: 'path' }); return; }
        const newSkipped = { ...s.goalSkipped, [course]: true };
        const newStamps = { ...s.goalUpdatedAt, [course]: Date.now() };
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), goalSkipped: newSkipped, goalUpdatedAt: newStamps });
        set({ goalSkipped: newSkipped, goalUpdatedAt: newStamps, screen: 'path' });
      },

      setCustomLessons: (courseId, units, goal) => {
        const s = get();
        const newCustomLessons = { ...s.customLessons, [courseId]: units };
        const newCustomGoal = { ...s.customGoal, [courseId]: goal };
        const newSkipped = { ...s.goalSkipped, [courseId]: false };
        const newStamps = { ...s.goalUpdatedAt, [courseId]: Date.now() };
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), customLessons: newCustomLessons, customGoal: newCustomGoal, goalSkipped: newSkipped, goalUpdatedAt: newStamps });
        set({ customLessons: newCustomLessons, customGoal: newCustomGoal, goalSkipped: newSkipped, goalUpdatedAt: newStamps, screen: 'path' });
      },

      startLesson: (lessonId) => set({ currentLessonId: lessonId, screen: 'chat' }),
      openProfile: () => set({ screen: 'profile' }),

      completeLesson: () => {
        const s = get();
        let newCompleted = s.completedLessons;
        if (s.selectedCourse && s.currentLessonId) {
          const done = s.completedLessons[s.selectedCourse] ?? [];
          if (!done.includes(s.currentLessonId)) {
            newCompleted = { ...s.completedLessons, [s.selectedCourse]: [...done, s.currentLessonId] };
          }
        }
        const updated = { ...getFullProgress(s), completedLessons: newCompleted };
        if (s.user) saveProgress(s.user.id, updated);
        set({ completedLessons: newCompleted, screen: 'path', currentLessonId: null });
      },

      recordAnswer: (courseId, wordTarget, correct) => {
        const s = get();
        const key = `${courseId}:${wordTarget}`;
        const prev = s.wordStats[key];
        const interval = nextInterval(prev, correct);
        const nextDue = Date.now() + interval * 24 * 60 * 60 * 1000;
        const updated: WordStat = {
          correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
          wrong:   (prev?.wrong   ?? 0) + (correct ? 0 : 1),
          interval,
          nextDue,
        };
        const newStats = { ...s.wordStats, [key]: updated };
        set({ wordStats: newStats });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), wordStats: newStats });
      },

      goBack: () => {
        const { screen } = get();
        if (screen === 'onboarding') set({ screen: 'select', selectedCourse: null });
        if (screen === 'path') set({ screen: 'select', selectedCourse: null });
        if (screen === 'chat') set({ screen: 'path', currentLessonId: null });
        if (screen === 'profile') set({ screen: 'path' });
      },

      addXp: (amount) => {
        const s = get();
        const todayStr = today();
        const newStreak = s.lastSessionDate === yesterday() ? s.streak + 1
          : s.lastSessionDate === todayStr ? s.streak : 1;
        const newXp = s.xp + amount;
        set({ xp: newXp, streak: newStreak, lastSessionDate: todayStr });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), xp: newXp, streak: newStreak, lastSessionDate: todayStr });
      },

      resetProgress: () => set({ xp: 0, streak: 0, lastSessionDate: null, completedLessons: {}, customLessons: {}, customGoal: {}, goalSkipped: {}, wordStats: {}, goalUpdatedAt: {} }),
    }),
    {
      name: 'lumi-v2',
      partialize: (s) => {
        const { screen: _screen, ...rest } = s;
        return rest;
      },
      // No onRehydrateStorage reset here. `screen` is partialized out, so the
      // shallow merge already leaves the value the store started with — and
      // re-deriving it after hydration overwrote whatever the router had just
      // resolved from the URL, which is why opening /signup while signed out
      // bounced to /login and lost the Sign up tab.
    }
  )
);
