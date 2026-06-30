import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CourseId } from '../types';
import type { Rarity } from '../data/shop';
import type { ShopItem } from '../data/shop';
import { SELL_PRICE } from '../data/shop';

interface UserProgress {
  completedLessons: Record<string, string[]>;
  xp: number;
  streak: number;
  lastSessionDate: string | null;
  coins: number;
  inventory: Record<string, number>; // itemId → count
}

function loadProgress(userId: string): UserProgress {
  try {
    const saved = localStorage.getItem(`lumi-progress-${userId}`);
    const base = { completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null, coins: 0, inventory: {} };
    return saved ? { ...base, ...JSON.parse(saved) } : base;
  } catch { return { completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null, coins: 0, inventory: {} }; }
}

function saveProgress(userId: string, p: UserProgress) {
  localStorage.setItem(`lumi-progress-${userId}`, JSON.stringify(p));
}

type Screen = 'login' | 'select' | 'path' | 'chat' | 'shop' | 'profile';

interface AuthUser { id: string; name: string; email: string; }

interface AppStore {
  screen: Screen;
  user: AuthUser | null;
  selectedCourse: CourseId | null;
  currentLessonId: string | null;
  completedLessons: Record<string, string[]>;
  xp: number;
  streak: number;
  lastSessionDate: string | null;
  coins: number;
  inventory: Record<string, number>;

  login: (user: AuthUser) => void;
  logout: () => void;
  setCourse: (c: CourseId) => void;
  startLesson: (lessonId: string) => void;
  completeLesson: () => void;
  goBack: () => void;
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addToInventory: (items: ShopItem[]) => void;
  openShop: () => void;
  openProfile: () => void;
  sellItem: (itemId: string, rarity: Rarity) => void;
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
    coins: state.coins, inventory: state.inventory,
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      screen: (() => {
        try { return localStorage.getItem('lumi-user') ? 'select' : 'login'; } catch { return 'login'; }
      })() as Screen,
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
      inventory: {},

      login: (user) => {
        const progress = loadProgress(user.id);
        localStorage.setItem('lumi-user', JSON.stringify(user));
        set({ user, screen: 'select', ...progress });
      },

      logout: () => {
        const s = get();
        if (s.user) saveProgress(s.user.id, getFullProgress(s));
        localStorage.removeItem('lumi-token');
        localStorage.removeItem('lumi-user');
        set({ user: null, screen: 'login', selectedCourse: null, currentLessonId: null,
          completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null, coins: 0, inventory: {} });
      },

      setCourse: (c) => set({ selectedCourse: c, screen: 'path' }),
      startLesson: (lessonId) => set({ currentLessonId: lessonId, screen: 'chat' }),
      openShop: () => set({ screen: 'shop' }),
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
        // Award coins on lesson completion
        const newCoins = s.coins + 50;
        const updated = { ...getFullProgress(s), completedLessons: newCompleted, coins: newCoins };
        if (s.user) saveProgress(s.user.id, updated);
        set({ completedLessons: newCompleted, coins: newCoins, screen: 'path', currentLessonId: null });
      },

      goBack: () => {
        const { screen } = get();
        if (screen === 'path') set({ screen: 'select', selectedCourse: null });
        if (screen === 'chat') set({ screen: 'path', currentLessonId: null });
        if (screen === 'shop') set({ screen: 'path' });
        if (screen === 'profile') set({ screen: 'path' });
      },

      addXp: (amount) => {
        const s = get();
        const todayStr = today();
        const newStreak = s.lastSessionDate === yesterday() ? s.streak + 1
          : s.lastSessionDate === todayStr ? s.streak : 1;
        const newXp = s.xp + amount;
        // +5 coins per correct answer
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

      spendCoins: (amount) => {
        const s = get();
        if (s.coins < amount) return false;
        const newCoins = s.coins - amount;
        set({ coins: newCoins });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), coins: newCoins });
        return true;
      },

      addToInventory: (items) => {
        const s = get();
        const newInv = { ...s.inventory };
        let bonusCoins = 0;
        for (const item of items) {
          if (item.type === 'coins' && item.value) {
            bonusCoins += item.value;
          } else {
            newInv[item.id] = (newInv[item.id] ?? 0) + 1;
          }
        }
        const newCoins = s.coins + bonusCoins;
        set({ inventory: newInv, coins: newCoins });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), inventory: newInv, coins: newCoins });
      },

      sellItem: (itemId, rarity) => {
        const s = get();
        if ((s.inventory[itemId] ?? 0) < 1) return;
        const newInv = { ...s.inventory, [itemId]: s.inventory[itemId] - 1 };
        if (newInv[itemId] === 0) delete newInv[itemId];
        const newCoins = s.coins + SELL_PRICE[rarity];
        set({ inventory: newInv, coins: newCoins });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), inventory: newInv, coins: newCoins });
      },

      resetProgress: () => set({ xp: 0, streak: 0, lastSessionDate: null, completedLessons: {}, coins: 0, inventory: {} }),
    }),
    { name: 'lumi-v2' }
  )
);
