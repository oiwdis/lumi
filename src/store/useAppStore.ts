import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CourseId } from '../types';

interface UserProgress {
  completedLessons: Record<string, string[]>;
  xp: number;
  streak: number;
  lastSessionDate: string | null;
  coins: number;
  customLessons: Record<string, CustomUnit[]>;
  customGoal: Record<string, string>;
  goalSkipped: Record<string, boolean>;
}

function loadProgress(userId: string): UserProgress {
  try {
    const saved = localStorage.getItem(`lumi-progress-${userId}`);
    const base: UserProgress = { completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null, coins: 0, customLessons: {}, customGoal: {}, goalSkipped: {} };
    return saved ? { ...base, ...JSON.parse(saved) } : base;
  } catch { return { completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null, coins: 0, customLessons: {}, customGoal: {}, goalSkipped: {} }; }
}

function saveProgress(userId: string, p: UserProgress) {
  localStorage.setItem(`lumi-progress-${userId}`, JSON.stringify(p));
  const token = localStorage.getItem('lumi-token');
  if (token) {
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(p),
    }).catch(() => {});
  }
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
  coins: number;
  customLessons: Record<string, CustomUnit[]>;
  customGoal: Record<string, string>;
  goalSkipped: Record<string, boolean>;

  setScreen: (screen: Screen) => void;
  toggleTheme: () => void;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
  setCourse: (c: CourseId) => void;
  startLesson: (lessonId: string) => void;
  completeLesson: () => void;
  goBack: () => void;
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
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
    coins: state.coins,
    customLessons: state.customLessons,
    customGoal: state.customGoal,
    goalSkipped: state.goalSkipped,
  };
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
      coins: 0,
      customLessons: {},
      customGoal: {},
      goalSkipped: {},

      login: (user, token?: string) => {
        const localProgress = loadProgress(user.id);
        localStorage.setItem('lumi-user', JSON.stringify(user));
        if (user.email === 'elliot@themaclan.com') {
          const adminProgress: UserProgress = { ...localProgress, xp: 9999, coins: 99999, streak: 999 };
          saveProgress(user.id, adminProgress);
          set({ user, screen: 'select', ...adminProgress });
          return;
        }
        set({ user, screen: 'select', ...localProgress });
        const authToken = token ?? localStorage.getItem('lumi-token');
        if (authToken) {
          fetch('/api/progress', { headers: { 'Authorization': `Bearer ${authToken}` } })
            .then(r => r.ok ? r.json() : null)
            .then((serverProgress: UserProgress | null) => {
              if (!serverProgress) return;
              const current = useAppStore.getState();
              const base = getFullProgress(current);
              const merged: UserProgress = {
                xp: Math.max(base.xp, serverProgress.xp ?? 0),
                coins: Math.max(base.coins, serverProgress.coins ?? 0),
                streak: Math.max(base.streak, serverProgress.streak ?? 0),
                lastSessionDate: base.lastSessionDate ?? serverProgress.lastSessionDate,
                completedLessons: (() => {
                  const out: Record<string, string[]> = { ...base.completedLessons };
                  for (const [c, ids] of Object.entries(serverProgress.completedLessons ?? {})) {
                    out[c] = [...new Set([...(out[c] ?? []), ...(ids as string[])])];
                  }
                  return out;
                })(),
                customLessons: Object.keys(serverProgress.customLessons ?? {}).length
                  ? serverProgress.customLessons
                  : base.customLessons,
                customGoal: { ...base.customGoal, ...serverProgress.customGoal },
                goalSkipped: { ...base.goalSkipped, ...(serverProgress.goalSkipped ?? {}) },
              };
              saveProgress(user.id, merged);
              set(merged);
            })
            .catch(() => {});
        }
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
          completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null, coins: 0,
          customLessons: {}, customGoal: {}, goalSkipped: {} });
      },

      setCourse: (c) => set({ selectedCourse: c, screen: 'path' }),
      openOnboarding: (c) => set({ selectedCourse: c, screen: 'onboarding' }),

      skipOnboarding: () => {
        const s = get();
        const course = s.selectedCourse;
        if (!course) { set({ screen: 'path' }); return; }
        const newSkipped = { ...s.goalSkipped, [course]: true };
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), goalSkipped: newSkipped });
        set({ goalSkipped: newSkipped, screen: 'path' });
      },

      setCustomLessons: (courseId, units, goal) => {
        const s = get();
        const newCustomLessons = { ...s.customLessons, [courseId]: units };
        const newCustomGoal = { ...s.customGoal, [courseId]: goal };
        // Clear the skipped flag since they now have a goal
        const newSkipped = { ...s.goalSkipped, [courseId]: false };
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), customLessons: newCustomLessons, customGoal: newCustomGoal, goalSkipped: newSkipped });
        set({ customLessons: newCustomLessons, customGoal: newCustomGoal, goalSkipped: newSkipped, screen: 'path' });
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
        const newCoins = s.coins + 50;
        const updated = { ...getFullProgress(s), completedLessons: newCompleted, coins: newCoins };
        if (s.user) saveProgress(s.user.id, updated);
        set({ completedLessons: newCompleted, coins: newCoins, screen: 'path', currentLessonId: null });
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
        const newCoins = s.coins + Math.floor(amount / 4);
        set({ xp: newXp, streak: newStreak, lastSessionDate: todayStr, coins: newCoins });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), xp: newXp, streak: newStreak, lastSessionDate: todayStr, coins: newCoins });
      },

      addCoins: (amount) => {
        const s = get();
        const newCoins = s.coins + amount;
        set({ coins: newCoins });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), coins: newCoins });
      },

      resetProgress: () => set({ xp: 0, streak: 0, lastSessionDate: null, completedLessons: {}, coins: 0, customLessons: {}, customGoal: {}, goalSkipped: {} }),
    }),
    {
      name: 'lumi-v2',
      partialize: (s) => {
        // Never persist screen — always recompute on load based on lumi-user
        const { screen: _screen, ...rest } = s;
        return rest;
      },
      onRehydrateStorage: () => () => {
        // After rehydration, force screen to correct value based on auth state
        useAppStore.setState({ screen: initialScreen() });
      },
    }
  )
);
