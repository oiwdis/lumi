import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CourseId } from '../types';

type Screen = 'login' | 'select' | 'path' | 'chat';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AppStore {
  screen: Screen;
  user: AuthUser | null;
  selectedCourse: CourseId | null;
  currentLessonId: string | null;
  completedLessons: Record<string, string[]>; // courseId → lessonId[]
  xp: number;
  streak: number;
  lastSessionDate: string | null;

  login: (user: AuthUser) => void;
  logout: () => void;
  setCourse: (c: CourseId) => void;
  startLesson: (lessonId: string) => void;
  completeLesson: () => void;
  goBack: () => void;
  addXp: (amount: number) => void;
  resetProgress: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      screen: (() => {
        try {
          return localStorage.getItem('lumi-user') ? 'select' : 'login';
        } catch { return 'login'; }
      })() as Screen,
      user: (() => {
        try {
          const u = localStorage.getItem('lumi-user');
          return u ? JSON.parse(u) : null;
        } catch { return null; }
      })(),
      selectedCourse: null,
      currentLessonId: null,
      completedLessons: {},
      xp: 0,
      streak: 0,
      lastSessionDate: null,

      login: (user) => {
        localStorage.setItem('lumi-user', JSON.stringify(user));
        set({ user, screen: 'select' });
      },

      logout: () => {
        localStorage.removeItem('lumi-token');
        localStorage.removeItem('lumi-user');
        set({ user: null, screen: 'login', selectedCourse: null, currentLessonId: null });
      },

      setCourse: (c) => set({ selectedCourse: c, screen: 'path' }),

      startLesson: (lessonId) => set({ currentLessonId: lessonId, screen: 'chat' }),

      completeLesson: () => {
        const { selectedCourse, currentLessonId, completedLessons } = get();
        if (selectedCourse && currentLessonId) {
          const done = completedLessons[selectedCourse] ?? [];
          if (!done.includes(currentLessonId)) {
            set({
              completedLessons: {
                ...completedLessons,
                [selectedCourse]: [...done, currentLessonId],
              },
            });
          }
        }
        set({ screen: 'path', currentLessonId: null });
      },

      goBack: () => {
        const { screen } = get();
        if (screen === 'path') set({ screen: 'select', selectedCourse: null });
        if (screen === 'chat') set({ screen: 'path', currentLessonId: null });
      },

      addXp: (amount) => {
        const { xp, streak, lastSessionDate } = get();
        const todayStr = today();
        const newStreak = lastSessionDate === yesterday() ? streak + 1
          : lastSessionDate === todayStr ? streak
          : 1;
        set({ xp: xp + amount, streak: newStreak, lastSessionDate: todayStr });
      },

      resetProgress: () => set({ xp: 0, streak: 0, lastSessionDate: null, completedLessons: {} }),
    }),
    { name: 'lumi-v2' }
  )
);
