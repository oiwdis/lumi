export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'xp_boost' | 'streak_shield' | 'heart_refill' | 'coins' | 'title' | 'avatar';

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  description: string;
  type: ItemType;
  value?: number;
}

export interface Box {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  color: string;
  levelRequired: number;
  itemsPerOpen: number;
  rarityWeights: Record<Rarity, number>; // weights (not %)
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common:    '#9CA3AF',
  uncommon:  '#34D399',
  rare:      '#60A5FA',
  epic:      '#A78BFA',
  legendary: '#F59E0B',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common:    'Common',
  uncommon:  'Uncommon',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Legendary',
};

export const ITEMS: ShopItem[] = [
  // Common
  { id: 'xp_1', name: 'XP Boost I',       emoji: '⚡', rarity: 'common',    type: 'xp_boost',      value: 1.5,  description: '1.5× XP for your next lesson' },
  { id: 'coins_sm', name: 'Coin Bag',      emoji: '💰', rarity: 'common',    type: 'coins',          value: 30,   description: '+30 coins' },
  { id: 'heart_1', name: 'Heart Refill',   emoji: '💚', rarity: 'common',    type: 'heart_refill',   value: 1,    description: 'Start next lesson with full energy' },
  { id: 'title_learner', name: 'Learner',  emoji: '📖', rarity: 'common',    type: 'title',                       description: 'Display "Learner" title' },

  // Uncommon
  { id: 'xp_2', name: 'XP Boost II',       emoji: '⚡', rarity: 'uncommon',  type: 'xp_boost',      value: 2,    description: '2× XP for your next lesson' },
  { id: 'coins_md', name: 'Coin Chest',    emoji: '💎', rarity: 'uncommon',  type: 'coins',          value: 75,   description: '+75 coins' },
  { id: 'shield_1', name: 'Streak Shield', emoji: '🛡️', rarity: 'uncommon',  type: 'streak_shield',  value: 1,    description: 'Protect your streak for 1 day' },
  { id: 'title_explorer', name: 'Explorer',emoji: '🧭', rarity: 'uncommon',  type: 'title',                       description: 'Display "Explorer" title' },

  // Rare
  { id: 'xp_3', name: 'XP Boost III',      emoji: '⚡', rarity: 'rare',      type: 'xp_boost',      value: 3,    description: '3× XP for your next lesson' },
  { id: 'coins_lg', name: 'Gold Vault',    emoji: '🏆', rarity: 'rare',      type: 'coins',          value: 200,  description: '+200 coins' },
  { id: 'shield_3', name: 'Triple Shield', emoji: '🛡️', rarity: 'rare',      type: 'streak_shield',  value: 3,    description: 'Protect your streak for 3 days' },
  { id: 'title_scholar', name: 'Scholar',  emoji: '🎓', rarity: 'rare',      type: 'title',                       description: 'Display "Scholar" title' },
  { id: 'avatar_fox', name: 'Fox Avatar',  emoji: '🦊', rarity: 'rare',      type: 'avatar',                      description: 'Unlock the Fox avatar' },

  // Epic
  { id: 'xp_5', name: 'XP Surge',          emoji: '💥', rarity: 'epic',      type: 'xp_boost',      value: 5,    description: '5× XP for your next lesson' },
  { id: 'coins_xl', name: 'Diamond Crate', emoji: '💠', rarity: 'epic',      type: 'coins',          value: 500,  description: '+500 coins' },
  { id: 'shield_7', name: 'Week Shield',   emoji: '🛡️', rarity: 'epic',      type: 'streak_shield',  value: 7,    description: 'Protect your streak for 7 days' },
  { id: 'title_master', name: 'Master',    emoji: '⚔️', rarity: 'epic',      type: 'title',                       description: 'Display "Master" title' },
  { id: 'avatar_dragon', name: 'Dragon',   emoji: '🐉', rarity: 'epic',      type: 'avatar',                      description: 'Unlock the Dragon avatar' },

  // Legendary
  { id: 'xp_10', name: 'XP Godmode',       emoji: '🌟', rarity: 'legendary', type: 'xp_boost',      value: 10,   description: '10× XP for your next lesson' },
  { id: 'coins_xx', name: 'Treasure Hoard',emoji: '👑', rarity: 'legendary', type: 'coins',          value: 1500, description: '+1500 coins' },
  { id: 'title_legend', name: 'Legend',    emoji: '🏅', rarity: 'legendary', type: 'title',                       description: 'Display "Legend" title' },
  { id: 'avatar_star', name: 'Star Avatar',emoji: '⭐', rarity: 'legendary', type: 'avatar',                      description: 'Unlock the Star avatar' },
  { id: 'avatar_phoenix',name:'Phoenix',   emoji: '🔥', rarity: 'legendary', type: 'avatar',                      description: 'Unlock the Phoenix avatar' },
];

export const BOXES: Box[] = [
  {
    id: 'seedling',
    name: 'Seedling Pack',
    emoji: '🌱',
    description: 'A humble pack for new learners',
    cost: 50,
    color: '#34D399',
    levelRequired: 1,
    itemsPerOpen: 2,
    rarityWeights: { common: 60, uncommon: 30, rare: 9, epic: 1, legendary: 0 },
  },
  {
    id: 'explorer',
    name: 'Explorer Chest',
    emoji: '🧭',
    description: 'For those venturing further',
    cost: 120,
    color: '#60A5FA',
    levelRequired: 2,
    itemsPerOpen: 3,
    rarityWeights: { common: 45, uncommon: 35, rare: 15, epic: 4, legendary: 1 },
  },
  {
    id: 'scholar',
    name: 'Scholar Vault',
    emoji: '🎓',
    description: 'Reserved for dedicated students',
    cost: 280,
    color: '#A78BFA',
    levelRequired: 4,
    itemsPerOpen: 3,
    rarityWeights: { common: 25, uncommon: 35, rare: 28, epic: 10, legendary: 2 },
  },
  {
    id: 'master',
    name: 'Master Crate',
    emoji: '⚔️',
    description: 'Only the skilled may open this',
    cost: 600,
    color: '#F59E0B',
    levelRequired: 7,
    itemsPerOpen: 4,
    rarityWeights: { common: 10, uncommon: 25, rare: 40, epic: 20, legendary: 5 },
  },
  {
    id: 'legend',
    name: 'Legend Box',
    emoji: '👑',
    description: 'The ultimate reward for the elite',
    cost: 1500,
    color: '#F87171',
    levelRequired: 9,
    itemsPerOpen: 5,
    rarityWeights: { common: 0, uncommon: 10, rare: 35, epic: 40, legendary: 15 },
  },
];

export function rollItem(box: Box): ShopItem {
  const weights = box.rarityWeights;
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let chosenRarity: Rarity = 'common';
  for (const [rarity, weight] of Object.entries(weights) as [Rarity, number][]) {
    roll -= weight;
    if (roll <= 0) { chosenRarity = rarity; break; }
  }
  const pool = ITEMS.filter(i => i.rarity === chosenRarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openBox(box: Box): ShopItem[] {
  return Array.from({ length: box.itemsPerOpen }, () => rollItem(box));
}
