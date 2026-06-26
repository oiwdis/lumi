export type CourseId = 'en-es' | 'en-zh' | 'en-fr' | 'en-ja';

export interface CourseInfo {
  id: CourseId;
  fromFlag: string;
  toFlag: string;
  fromLang: string;
  toLang: string;
  color: string;
  tagline: string;
}

// ─── Story ───────────────────────────────────────────────────────────────────

export interface StorySegment {
  text: string;
  translation?: string;
  wordId?: string;
}

export interface FillBlankItem {
  id: string;
  before: string;
  answer: string;
  after: string;
  fullTranslation: string;
  options: string[]; // 4 choices including answer
}

export interface Story {
  id: string;
  courseId: CourseId;
  title: string;
  titleTranslation: string;
  level: 1 | 2 | 3;
  emoji: string;
  context: string;
  paragraphs: StorySegment[][];
  fillBlanks: FillBlankItem[];
  // auto-derived vocab for recall (wordId -> { word, translation })
  vocab: Record<string, { word: string; translation: string; example: string }>;
}

// ─── Role-play ───────────────────────────────────────────────────────────────

export interface RolePlayChoice {
  text: string;
  translation: string;
  correct: boolean;
  feedback: string;
}

export interface RolePlayTurn {
  npc: string;
  npcTranslation: string;
  choices: RolePlayChoice[];
}

export interface RolePlay {
  id: string;
  courseId: CourseId;
  scenario: string;
  emoji: string;
  npcName: string;
  npcEmoji: string;
  turns: RolePlayTurn[];
}

// ─── SRS / Word records ──────────────────────────────────────────────────────

export interface WordRecord {
  wordId: string;
  courseId: CourseId;
  word: string;
  translation: string;
  example: string;
  status: 'seen' | 'learning' | 'known';
  interval: number;     // days
  easeFactor: number;   // SM-2, starts 2.5
  repetitions: number;
  nextReviewAt: number; // ms timestamp
  lastSeenAt: number;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export type ActivityType = 'story' | 'fill-blank' | 'recall' | 'roleplay' | 'srs-review' | 'vocab-intro' | 'comprehension';

export interface Activity {
  type: ActivityType;
  id: string;
  // for comprehension: which lesson it belongs to
  lessonId?: string;
}
