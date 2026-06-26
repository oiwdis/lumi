export interface Level {
  level: number;
  title: string;
  minXp: number;
  avatarId: string; // matches key in AVATARS
  color: string;    // accent color for the level
}

// XP needed to reach each level
export const LEVELS: Level[] = [
  { level: 1,  title: 'Seedling',      minXp: 0,    avatarId: 'seedling',    color: '#7ecf6e' },
  { level: 2,  title: 'Explorer',      minXp: 100,  avatarId: 'explorer',    color: '#5bb8f5' },
  { level: 3,  title: 'Adventurer',    minXp: 250,  avatarId: 'adventurer',  color: '#f5a623' },
  { level: 4,  title: 'Scholar',       minXp: 500,  avatarId: 'scholar',     color: '#b8a9f5' },
  { level: 5,  title: 'Linguist',      minXp: 900,  avatarId: 'linguist',    color: '#f56b6b' },
  { level: 6,  title: 'Polyglot',      minXp: 1400, avatarId: 'polyglot',    color: '#f5c842' },
  { level: 7,  title: 'Master',        minXp: 2100, avatarId: 'master',      color: '#42e8c8' },
  { level: 8,  title: 'Grand Master',  minXp: 3000, avatarId: 'grandmaster', color: '#e842f5' },
  { level: 9,  title: 'Legend',        minXp: 4200, avatarId: 'legend',      color: '#f58c42' },
  { level: 10, title: 'Luminary',      minXp: 6000, avatarId: 'luminary',    color: '#ffd700' },
];

export function getLevelForXp(xp: number): Level {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
    else break;
  }
  return current;
}

export function getNextLevel(xp: number): Level | null {
  const cur = getLevelForXp(xp);
  return LEVELS.find(l => l.level === cur.level + 1) ?? null;
}

export function xpProgressInLevel(xp: number): { earned: number; needed: number; pct: number } {
  const cur = getLevelForXp(xp);
  const next = getNextLevel(xp);
  if (!next) return { earned: xp - cur.minXp, needed: xp - cur.minXp, pct: 100 };
  const earned = xp - cur.minXp;
  const needed = next.minXp - cur.minXp;
  return { earned, needed, pct: Math.round((earned / needed) * 100) };
}
