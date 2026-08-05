import type { CourseId, CourseInfo, Story, RolePlay } from '../types';
import { enEsStories } from './stories/en-es';
import { enZhStories } from './stories/en-zh';
import { rolePlays } from './roleplays';
import { INLINE_STORIES } from './inlineStories';

export const COURSES: CourseInfo[] = [
  { id: 'en-es', fromFlag: '🇺🇸', toFlag: '🇪🇸', fromLang: 'English', toLang: 'Spanish', color: '#FF9600', tagline: '500M+ speakers' },
  { id: 'en-zh', fromFlag: '🇺🇸', toFlag: '🇨🇳', fromLang: 'English', toLang: 'Chinese', color: '#FF4B4B', tagline: '1B+ speakers' },
  { id: 'en-fr', fromFlag: '🇺🇸', toFlag: '🇫🇷', fromLang: 'English', toLang: 'French', color: '#CE82FF', tagline: '300M+ speakers' },
  { id: 'en-ja', fromFlag: '🇺🇸', toFlag: '🇯🇵', fromLang: 'English', toLang: 'Japanese', color: '#FF6B9D', tagline: '125M+ speakers' },
  { id: 'en-ko', fromFlag: '🇺🇸', toFlag: '🇰🇷', fromLang: 'English', toLang: 'Korean', color: '#00C4CC', tagline: '80M+ speakers' },
  { id: 'en-de', fromFlag: '🇺🇸', toFlag: '🇩🇪', fromLang: 'English', toLang: 'German', color: '#58CC02', tagline: '100M+ speakers' },
  { id: 'en-it', fromFlag: '🇺🇸', toFlag: '🇮🇹', fromLang: 'English', toLang: 'Italian', color: '#1CB0F6', tagline: '65M+ speakers' },
  { id: 'en-pt', fromFlag: '🇺🇸', toFlag: '🇧🇷', fromLang: 'English', toLang: 'Portuguese', color: '#FFD900', tagline: '260M+ speakers' },
];

/**
 * Display name per course. Typed as an exhaustive Record<CourseId, …> on purpose:
 * this used to be copy-pasted as Record<string, string> into three components,
 * so adding a language silently produced "Unknown" in the UI instead of a
 * compile error. Import this rather than redeclaring it.
 */
export const LANG_NAME: Record<CourseId, string> = {
  'en-es': 'Spanish',
  'en-zh': 'Chinese',
  'en-fr': 'French',
  'en-ja': 'Japanese',
  'en-ko': 'Korean',
  'en-de': 'German',
  'en-it': 'Italian',
  'en-pt': 'Portuguese',
};

export const ALL_STORIES: Story[] = [
  ...enEsStories,
  ...enZhStories,
  ...INLINE_STORIES,
];

export const ALL_ROLEPLAYS: RolePlay[] = rolePlays;

export function getStoriesForCourse(courseId: CourseId): Story[] {
  return ALL_STORIES.filter(s => s.courseId === courseId);
}

export function getRolePlaysForCourse(courseId: CourseId): RolePlay[] {
  return ALL_ROLEPLAYS.filter(rp => rp.courseId === courseId);
}

export function getStory(id: string): Story | undefined {
  return ALL_STORIES.find(s => s.id === id);
}

export function getRolePlay(id: string): RolePlay | undefined {
  return ALL_ROLEPLAYS.find(rp => rp.id === id);
}

export function getCourse(id: CourseId): CourseInfo {
  return COURSES.find(c => c.id === id)!;
}
