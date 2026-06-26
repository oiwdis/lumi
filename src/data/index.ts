import type { CourseId, CourseInfo, Story, RolePlay } from '../types';
import { enEsStories } from './stories/en-es';
import { enZhStories } from './stories/en-zh';
import { rolePlays } from './roleplays';
import { INLINE_STORIES } from './inlineStories';

export const COURSES: CourseInfo[] = [
  { id: 'en-es', fromFlag: '🇺🇸', toFlag: '🇪🇸', fromLang: 'English', toLang: 'Spanish', color: '#FF9600', tagline: '500M+ speakers worldwide' },
  { id: 'en-zh', fromFlag: '🇺🇸', toFlag: '🇨🇳', fromLang: 'English', toLang: 'Chinese', color: '#FF4B4B', tagline: '1B+ speakers worldwide' },
  { id: 'en-fr', fromFlag: '🇺🇸', toFlag: '🇫🇷', fromLang: 'English', toLang: 'French', color: '#CE82FF', tagline: 'The language of love & diplomacy' },
  { id: 'en-ja', fromFlag: '🇺🇸', toFlag: '🇯🇵', fromLang: 'English', toLang: 'Japanese', color: '#FF6B9D', tagline: '125M+ speakers, rich culture' },
];

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
