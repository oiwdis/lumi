import type { WordRecord } from '../types';

export function sm2(record: WordRecord, quality: 0 | 1 | 2 | 3 | 4 | 5): Partial<WordRecord> {
  let { interval, easeFactor, repetitions } = record;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  const status = repetitions >= 3 ? 'known' : repetitions >= 1 ? 'learning' : 'seen';

  return {
    interval,
    easeFactor,
    repetitions,
    status,
    nextReviewAt: Date.now() + interval * 86_400_000,
    lastSeenAt: Date.now(),
  };
}

export function isDue(record: WordRecord): boolean {
  return Date.now() >= record.nextReviewAt;
}

export function freshRecord(
  wordId: string,
  courseId: WordRecord['courseId'],
  word: string,
  translation: string,
  example: string,
): WordRecord {
  return {
    wordId,
    courseId,
    word,
    translation,
    example,
    status: 'seen',
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewAt: Date.now() + 86_400_000,
    lastSeenAt: Date.now(),
  };
}
