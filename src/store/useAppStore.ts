import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CourseId } from '../types';
import type { Rarity, ShopItem } from '../data/shop';
import { SELL_PRICE, ITEMS } from '../data/shop';

interface UserProgress {
  completedLessons: Record<string, string[]>;
  xp: number;
  streak: number;
  lastSessionDate: string | null;
  coins: number;
  inventory: Record<string, number>;
  equippedPet: string | null;
}

function loadProgress(userId: string): UserProgress {
  try {
    const saved = localStorage.getItem(`lumi-progress-${userId}`);
    const base: UserProgress = { completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null, coins: 0, inventory: {}, equippedPet: null };
    return saved ? { ...base, ...JSON.parse(saved) } : base;
  } catch { return { completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null, coins: 0, inventory: {}, equippedPet: null }; }
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
  equippedPet: string | null;

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
  equipPet: (itemId: string | null) => void;
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
    coins: state.coins, inventory: state.inventory, equippedPet: state.equippedPet,
  };
}

function getEquippedItem(equippedPet: string | null): ShopItem | null {
  if (!equippedPet) return null;
  return ITEMS.find(i => i.id === equippedPet) ?? null;
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
      equippedPet: null,

      login: (user) => {
        const progress = loadProgress(user.id);
        localStorage.setItem('lumi-user', JSON.stringify(user));
        if (user.email === 'elliot@themaclan.com') {
          const adminInv: Record<string, number> = {};
          ITEMS.forEach(i => { adminInv[i.id] = 99; });
          const adminProgress: UserProgress = { ...progress, xp: 9999, coins: 99999, streak: 999, inventory: adminInv };
          saveProgress(user.id, adminProgress);
          set({ user, screen: 'select', ...adminProgress });
          return;
        }
        set({ user, screen: 'select', ...progress });
      },

      logout: () => {
        const s = get();
        if (s.user) saveProgress(s.user.id, getFullProgress(s));
        localStorage.removeItem('lumi-token');
        localStorage.removeItem('lumi-user');
        set({ user: null, screen: 'login', selectedCourse: null, currentLessonId: null,
          completedLessons: {}, xp: 0, streak: 0, lastSessionDate: null, coins: 0, inventory: {}, equippedPet: null });
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
        const pet = getEquippedItem(s.equippedPet);
        const coinMult = pet?.ability.type === 'coin_boost' ? pet.ability.value : 1;
        const newCoins = s.coins + Math.round(50 * coinMult);
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
        const pet = getEquippedItem(s.equippedPet);
        const xpMult = pet?.ability.type === 'xp_boost' ? pet.ability.value : 1;
        const coinMult = pet?.ability.type === 'coin_boost' ? pet.ability.value : 1;
        const todayStr = today();
        const newStreak = s.lastSessionDate === yesterday() ? s.streak + 1
          : s.lastSessionDate === todayStr ? s.streak : 1;
        const newXp = s.xp + Math.round(amount * xpMult);
        const newCoins = s.coins + Math.round(Math.floor(amount / 4) * coinMult);
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
        for (const item of items) {
          newInv[item.id] = (newInv[item.id] ?? 0) + 1;
        }
        set({ inventory: newInv });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), inventory: newInv });
      },

      sellItem: (itemId, rarity) => {
        const s = get();
        if ((s.inventory[itemId] ?? 0) < 1) return;
        const newInv = { ...s.inventory, [itemId]: s.inventory[itemId] - 1 };
        if (newInv[itemId] === 0) delete newInv[itemId];
        const newEquipped = s.equippedPet === itemId && newInv[itemId] === undefined ? null : s.equippedPet;
        const newCoins = s.coins + SELL_PRICE[rarity];
        set({ inventory: newInv, coins: newCoins, equippedPet: newEquipped });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), inventory: newInv, coins: newCoins, equippedPet: newEquipped });
      },

      equipPet: (itemId) => {
        const s = get();
        set({ equippedPet: itemId });
        if (s.user) saveProgress(s.user.id, { ...getFullProgress(s), equippedPet: itemId });
      },

      resetProgress: () => set({ xp: 0, streak: 0, lastSessionDate: null, completedLessons: {}, coins: 0, inventory: {}, equippedPet: null }),
    }),
    { name: 'lumi-v2' }
  )
);
