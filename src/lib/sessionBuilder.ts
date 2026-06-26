import type { CourseId, Activity, WordRecord } from '../types';
import { isDue } from './srs';
import { getLessonsForCourse } from '../data/courseLessons';

export function buildLessonSession(
  courseId: CourseId,
  lessonIndex: number,
  wordRecords: Record<string, WordRecord>
): Activity[] {
  const lessons = getLessonsForCourse(courseId);
  const lesson = lessons[lessonIndex];
  if (!lesson) return [];

  const queue: Activity[] = [];

  // Phase 1: Introduce each vocab word one at a time
  lesson.vocab.forEach(w => {
    queue.push({ type: 'vocab-intro', id: w.id });
  });

  // Phase 2: Quick recall quiz — every other word introduced
  lesson.vocab
    .filter((_, i) => i % 2 === 0)
    .forEach(w => {
      queue.push({ type: 'recall', id: w.id });
    });

  // Phase 3: Story using those words
  queue.push({ type: 'story', id: lesson.storyId });

  // Phase 4: Comprehension questions about the story
  lesson.comprehension.forEach(q => {
    queue.push({ type: 'comprehension', id: q.id, lessonId: lesson.id });
  });

  // Phase 5: SRS reviews for due words from previous lessons (cap at 5)
  const dueReviews = Object.values(wordRecords)
    .filter(r => r.courseId === courseId && isDue(r) && r.status !== 'seen')
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
    .slice(0, 5);
  dueReviews.forEach(r => {
    queue.push({ type: 'srs-review', id: r.wordId });
  });

  return queue;
}

// Kept for compatibility
export function buildSession(
  courseId: CourseId,
  wordRecords: Record<string, WordRecord>,
  _completedStories: string[]
): Activity[] {
  return buildLessonSession(courseId, 0, wordRecords);
}
