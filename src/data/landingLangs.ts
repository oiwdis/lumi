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
}

export const LANDING_LANGS: LandingLang[] = [
  { slug: 'learn-spanish',  courseId: 'en-es', name: 'Spanish',  flag: '🇪🇸', speakers: '500M+' },
  { slug: 'learn-french',   courseId: 'en-fr', name: 'French',   flag: '🇫🇷', speakers: '300M+' },
  { slug: 'learn-chinese',  courseId: 'en-zh', name: 'Chinese',  flag: '🇨🇳', speakers: '1B+'   },
  { slug: 'learn-japanese', courseId: 'en-ja', name: 'Japanese', flag: '🇯🇵', speakers: '125M+' },
  { slug: 'learn-korean',   courseId: 'en-ko', name: 'Korean',   flag: '🇰🇷', speakers: '80M+'  },
  { slug: 'learn-german',   courseId: 'en-de', name: 'German',   flag: '🇩🇪', speakers: '100M+' },
];

export function langBySlug(slug: string): LandingLang | undefined {
  return LANDING_LANGS.find(l => l.slug === slug);
}

/** Goal placeholder tuned per language so the example never feels generic. */
export const GOAL_EXAMPLE: Record<CourseId, string> = {
  'en-es': "I'm moving to Madrid in March",
  'en-fr': "I'm spending a semester in Lyon",
  'en-zh': "I'm meeting my partner's family in Taipei",
  'en-ja': "I'm going to Tokyo for two weeks in autumn",
  'en-ko': "I want to follow interviews without subtitles",
  'en-de': "I just took a job in Berlin",
};
