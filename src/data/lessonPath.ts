export interface LessonDef {
  id: string;
  title: string;
  emoji: string;
  topicId: string;
  xpReward: number;
}

export interface UnitDef {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  emoji: string;
  lessons: LessonDef[];
}

// Same structure for all languages — topicIds match keys in TOPICS[courseId]
export const LESSON_UNITS: UnitDef[] = [
  {
    id: 'u1',
    title: 'Unit 1',
    subtitle: 'The Basics',
    color: '#58CC02',
    emoji: '🌱',
    lessons: [
      { id: 'greetings', title: 'Greetings',    emoji: '👋',  topicId: 'greetings', xpReward: 10 },
      { id: 'phrases',   title: 'Basic Phrases', emoji: '💬', topicId: 'phrases',   xpReward: 10 },
      { id: 'numbers1',  title: 'Numbers 1–5',   emoji: '🔢', topicId: 'numbers1',  xpReward: 10 },
      { id: 'colors',    title: 'Colors',         emoji: '🎨', topicId: 'colors',    xpReward: 10 },
    ],
  },
  {
    id: 'u2',
    title: 'Unit 2',
    subtitle: 'People & Feelings',
    color: '#1CB0F6',
    emoji: '👥',
    lessons: [
      { id: 'family',   title: 'Family',      emoji: '👨‍👩‍👧', topicId: 'family',   xpReward: 15 },
      { id: 'body',     title: 'Body Parts',  emoji: '🫀',   topicId: 'body',     xpReward: 15 },
      { id: 'emotions', title: 'Feelings',    emoji: '😊',   topicId: 'emotions', xpReward: 15 },
      { id: 'clothing', title: 'Clothing',    emoji: '👕',   topicId: 'clothing', xpReward: 15 },
    ],
  },
  {
    id: 'u3',
    title: 'Unit 3',
    subtitle: 'Food & Home',
    color: '#FF9600',
    emoji: '🍽️',
    lessons: [
      { id: 'food',   title: 'Food',    emoji: '🍽️', topicId: 'food',   xpReward: 20 },
      { id: 'fruits', title: 'Fruits',  emoji: '🍎', topicId: 'fruits', xpReward: 20 },
      { id: 'drinks', title: 'Drinks',  emoji: '🥤', topicId: 'drinks', xpReward: 20 },
      { id: 'home',   title: 'Home',    emoji: '🏠', topicId: 'home',   xpReward: 20 },
    ],
  },
  {
    id: 'u4',
    title: 'Unit 4',
    subtitle: 'The World Around You',
    color: '#CE82FF',
    emoji: '🌍',
    lessons: [
      { id: 'animals', title: 'Animals',          emoji: '🐾',  topicId: 'animals', xpReward: 25 },
      { id: 'weather', title: 'Weather',           emoji: '🌤️', topicId: 'weather', xpReward: 25 },
      { id: 'days',    title: 'Days of the Week',  emoji: '📅',  topicId: 'days',    xpReward: 25 },
      { id: 'places',  title: 'Places',            emoji: '🏙️', topicId: 'places',  xpReward: 25 },
    ],
  },
  {
    id: 'u5',
    title: 'Unit 5',
    subtitle: 'Level Up',
    color: '#FF4B4B',
    emoji: '🚀',
    lessons: [
      { id: 'jobs',      title: 'Jobs',         emoji: '💼', topicId: 'jobs',      xpReward: 30 },
      { id: 'transport', title: 'Transport',    emoji: '🚗', topicId: 'transport', xpReward: 30 },
      { id: 'numbers2',  title: 'Numbers 6–10', emoji: '🔟', topicId: 'numbers2',  xpReward: 30 },
      { id: 'time',      title: 'Time',         emoji: '⏰', topicId: 'time',      xpReward: 30 },
    ],
  },
  {
    id: 'u6',
    title: 'Unit 6',
    subtitle: 'Nature & Sports',
    color: '#2EC4B6',
    emoji: '🌿',
    lessons: [
      { id: 'nature',  title: 'Nature',   emoji: '🌳', topicId: 'nature',  xpReward: 35 },
      { id: 'sports',  title: 'Sports',   emoji: '⚽', topicId: 'sports',  xpReward: 35 },
      { id: 'seasons', title: 'Seasons',  emoji: '🍂', topicId: 'seasons', xpReward: 35 },
      { id: 'sizes',   title: 'Sizes & Adjectives', emoji: '📏', topicId: 'sizes', xpReward: 35 },
    ],
  },
  {
    id: 'u7',
    title: 'Unit 7',
    subtitle: 'Around Town',
    color: '#E76F51',
    emoji: '🏙️',
    lessons: [
      { id: 'restaurant',  title: 'Restaurant',  emoji: '🍴', topicId: 'restaurant',  xpReward: 40 },
      { id: 'shopping',    title: 'Shopping',    emoji: '🛍️', topicId: 'shopping',    xpReward: 40 },
      { id: 'hotel',       title: 'Hotel',       emoji: '🏨', topicId: 'hotel',       xpReward: 40 },
      { id: 'directions',  title: 'Directions',  emoji: '🧭', topicId: 'directions',  xpReward: 40 },
    ],
  },
  {
    id: 'u8',
    title: 'Unit 8',
    subtitle: 'Fluency Builder',
    color: '#9B5DE5',
    emoji: '🎓',
    lessons: [
      { id: 'months',    title: 'Months',          emoji: '📆', topicId: 'months',    xpReward: 45 },
      { id: 'verbs',     title: 'Action Verbs',    emoji: '🏃', topicId: 'verbs',     xpReward: 45 },
      { id: 'adjectives',title: 'Adjectives',      emoji: '✨', topicId: 'adjectives',xpReward: 45 },
      { id: 'phrases2',  title: 'Useful Phrases',  emoji: '💡', topicId: 'phrases2',  xpReward: 45 },
    ],
  },
];

// Flat list for index-based unlock logic
export const FLAT_LESSONS = LESSON_UNITS.flatMap(u => u.lessons);
