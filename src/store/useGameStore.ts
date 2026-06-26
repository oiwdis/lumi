import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type CourseId } from '../data/lessons';

interface GameStore {
  selectedCourse: CourseId | null;
  xp: number;
  streak: number;
  hearts: number;
  completedLessons: string[];

  setCourse: (course: CourseId) => void;
  addXP: (amount: number) => void;
  completeLesson: (lessonId: string) => void;
  loseHeart: () => void;
  resetHearts: () => void;
  incrementStreak: () => void;
  resetProgress: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      selectedCourse: null,
      xp: 0,
      streak: 0,
      hearts: 5,
      completedLessons: [],

      setCourse: (course) => set({ selectedCourse: course }),
      addXP: (amount) => set((state) => ({ xp: state.xp + amount })),
      completeLesson: (lessonId) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(lessonId)
            ? state.completedLessons
            : [...state.completedLessons, lessonId],
        })),
      loseHeart: () => set((state) => ({ hearts: Math.max(0, state.hearts - 1) })),
      resetHearts: () => set({ hearts: 5 }),
      incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
      resetProgress: () =>
        set({ xp: 0, streak: 0, hearts: 5, completedLessons: [], selectedCourse: null }),
    }),
    { name: 'linguo-store' }
  )
);
