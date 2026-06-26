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
];

// Flat list for index-based unlock logic
export const FLAT_LESSONS = LESSON_UNITS.flatMap(u => u.lessons);
