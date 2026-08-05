import type { CourseId } from '../types';

/**
 * The languages offered on the marketing pages. `slug` also serves as the
 * per-language landing route (/learn-japanese), which server/index.js reads to
 * inject a crawlable title and description.
 */
export interface LandingLang {
  slug: string;
  courseId: CourseId;
  name: string;
  flag: string;
  speakers: string;
  /** Short goal used in prose, e.g. "Say you're {shortGoal} and …". */
  shortGoal: string;
}

export const LANDING_LANGS: LandingLang[] = [
  { slug: 'learn-spanish',  courseId: 'en-es', name: 'Spanish',  flag: '🇪🇸', speakers: '500M+', shortGoal: 'moving to Madrid in March' },
  { slug: 'learn-french',   courseId: 'en-fr', name: 'French',   flag: '🇫🇷', speakers: '300M+', shortGoal: 'starting a semester in Lyon' },
  { slug: 'learn-chinese',  courseId: 'en-zh', name: 'Chinese',  flag: '🇨🇳', speakers: '1B+',   shortGoal: "meeting your partner's family in Taipei" },
  { slug: 'learn-japanese', courseId: 'en-ja', name: 'Japanese', flag: '🇯🇵', speakers: '125M+', shortGoal: 'spending two weeks in Tokyo' },
  { slug: 'learn-korean',   courseId: 'en-ko', name: 'Korean',   flag: '🇰🇷', speakers: '80M+',  shortGoal: 'visiting your cousin in Seoul' },
  { slug: 'learn-german',   courseId: 'en-de', name: 'German',   flag: '🇩🇪', speakers: '100M+', shortGoal: 'starting a job in Berlin' },
  { slug: 'learn-italian',  courseId: 'en-it', name: 'Italian',  flag: '🇮🇹', speakers: '65M+',  shortGoal: 'spending two weeks in Rome' },
  { slug: 'learn-portuguese', courseId: 'en-pt', name: 'Portuguese', flag: '🇧🇷', speakers: '260M+', shortGoal: 'moving to São Paulo in February' },
];

/**
 * The exercise the looping product demo plays, per language. Each one carries a
 * real grammar question a beginner in that language actually asks, so the demo
 * shown on /learn-korean is Korean rather than Spanish.
 */
export interface DemoScript {
  flag: string;
  word: string;
  options: string[];
  correct: number;
  question: string;
  answer: string;
}

export const DEMO_SCRIPT: Record<CourseId, DemoScript> = {
  'en-es': {
    flag: '🇪🇸',
    word: 'Buenas tardes',
    options: ['Good morning', 'Good afternoon', 'Good night', 'Goodbye'],
    correct: 1,
    question: 'why buenas and not buenos?',
    answer: '“Tardes” is feminine and plural, so “buenas” has to agree with it. That’s why “buenos días” is correct too — “días” is masculine.',
  },
  'en-fr': {
    flag: '🇫🇷',
    word: 'Bonne journée',
    options: ['Good morning', 'Have a good day', 'Good night', 'See you soon'],
    correct: 1,
    question: 'why bonne and not bon?',
    answer: '“Journée” is feminine, so the adjective becomes “bonne”. “Bonjour” keeps “bon” because “jour” is masculine — same word, different gender.',
  },
  'en-zh': {
    flag: '🇨🇳',
    word: '你好吗？',
    options: ['How are you?', 'Hello', 'Goodbye', 'Thank you'],
    correct: 0,
    question: 'what is 吗 doing there?',
    answer: '“吗” turns a statement into a yes/no question. On its own “你好” is just “hello” — add “吗” and you are asking whether they are well.',
  },
  'en-ja': {
    flag: '🇯🇵',
    word: 'おはようございます',
    options: ['Good morning', 'Good evening', 'Thank you', 'Excuse me'],
    correct: 0,
    question: 'what is the ございます for?',
    answer: '“おはよう” by itself is casual — fine for family. Adding “ございます” makes it polite, which is what you want for a teacher, a colleague or a stranger.',
  },
  'en-ko': {
    flag: '🇰🇷',
    word: '안녕하세요',
    options: ['Hello', 'Thank you', 'Goodbye', 'Excuse me'],
    correct: 0,
    question: 'why does it end in 세요?',
    answer: '“-세요” is the polite ending. Drop it and you get “안녕”, which is casual — only for close friends or children.',
  },
  'en-de': {
    flag: '🇩🇪',
    word: 'Guten Morgen',
    options: ['Good morning', 'Good evening', 'Good night', 'Goodbye'],
    correct: 0,
    question: 'why guten and not gut?',
    answer: 'The greeting is a shortened “Ich wünsche Ihnen einen guten Morgen”, so “Morgen” is the object of the sentence. Masculine accusative takes the -en ending.',
  },
  'en-it': {
    flag: '🇮🇹',
    word: 'Buonasera',
    options: ['Good morning', 'Good evening', 'Good night', 'Goodbye'],
    correct: 1,
    question: 'why buona and not buono?',
    answer: '“Sera” is feminine, so the adjective becomes “buona”. “Buongiorno” keeps the masculine “buon” because “giorno” is masculine — the ending follows the noun.',
  },
  'en-pt': {
    flag: '🇧🇷',
    word: 'Bom dia',
    options: ['Good morning', 'Good afternoon', 'Good night', 'Goodbye'],
    correct: 0,
    question: 'why bom dia but boa tarde?',
    answer: '“Dia” is masculine so it takes “bom”. “Tarde” and “noite” are feminine, so they take “boa” — the adjective always agrees with the noun’s gender.',
  },
};

export function langBySlug(slug: string): LandingLang | undefined {
  return LANDING_LANGS.find(l => l.slug === slug);
}

/**
 * Example goals shown as placeholders. Each one names a place, a time and who
 * the learner will be talking to, because that is the level of detail that makes
 * the generated curriculum useful — a vague goal produces a generic course.
 *
 * Keyed by course so the example always matches the language being learned.
 * Prompting for Korean with a "moving to Mexico" example is worse than no
 * example at all.
 */
export const GOAL_EXAMPLE: Record<CourseId, string> = {
  'en-es': 'Moving to Madrid in March for work — I need to view flats and talk to my neighbours',
  'en-fr': 'Starting a semester in Lyon in September — I want to follow lectures and make friends',
  'en-zh': "Meeting my partner's family in Taipei in December — I want to talk with their grandparents",
  'en-ja': 'Two weeks in Tokyo in April — ordering in restaurants and chatting with my Airbnb host',
  'en-ko': 'Visiting my cousin in Seoul in October — I want to order food and follow shows without subtitles',
  'en-de': 'Just took a job in Berlin — I need to handle the Anmeldung and join lunch chat at work',
  'en-it': 'Two weeks in Rome in June — ordering in trattorias and talking to my landlady',
  'en-pt': 'Moving to São Paulo in February for work — I need to open a bank account and chat with colleagues',
};

/** Shown under the goal field, in both the landing demo and onboarding. */
export const GOAL_HINT =
  'Be as specific as you can — where you will be, when, and who you will be talking to. Vague goals make generic lessons.';
