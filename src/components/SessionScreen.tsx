import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getStory, getRolePlay, ALL_STORIES } from '../data';
import { getLessonsForCourse } from '../data/courseLessons';
import StoryReader from './activities/StoryReader';
import FillBlank from './activities/FillBlank';
import WordRecall from './activities/WordRecall';
import RolePlay from './activities/RolePlay';
import SrsReview from './activities/SrsReview';
import VocabIntro from './activities/VocabIntro';
import Comprehension from './activities/Comprehension';
import TutorChat from './TutorChat';
import type { TutorContext } from '../lib/tutorApi';

export default function SessionScreen() {
  const { session, wordRecords, advanceSession, endSession, goHome, reviewWord, completeStory } = useAppStore();
  const [tutorOpen, setTutorOpen] = useState(false);

  if (!session) return null;

  const { queue, currentIndex, courseId, lessonIndex } = session;

  if (currentIndex >= queue.length) {
    endSession();
    return null;
  }

  const activity = queue[currentIndex];
  const progress = (currentIndex / queue.length) * 100;

  const handleAdvance = (xp = 0, words = 0) => {
    advanceSession(xp, words);
  };

  const renderActivity = () => {
    switch (activity.type) {
      case 'vocab-intro': {
        const lessons = getLessonsForCourse(courseId);
        const lesson = lessons[lessonIndex];
        const word = lesson?.vocab.find(w => w.id === activity.id);
        if (!word) { handleAdvance(); return null; }
        return (
          <VocabIntro
            word={word}
            courseId={courseId}
            onNext={() => handleAdvance(5, 1)}
          />
        );
      }

      case 'comprehension': {
        const lessons = getLessonsForCourse(courseId);
        const lesson = lessons[lessonIndex];
        const q = lesson?.comprehension.find(c => c.id === activity.id);
        if (!q) { handleAdvance(); return null; }
        return (
          <Comprehension
            question={q}
            onComplete={(_, xp) => handleAdvance(xp)}
          />
        );
      }

      case 'story': {
        const story = getStory(activity.id);
        if (!story) return null;
        return (
          <StoryReader
            story={story}
            courseId={courseId}
            onComplete={(xp, words) => {
              completeStory(story.id);
              handleAdvance(xp, words);
            }}
          />
        );
      }

      case 'fill-blank': {
        const item = ALL_STORIES
          .flatMap(s => s.fillBlanks)
          .find(fb => fb.id === activity.id);
        if (!item) { handleAdvance(); return null; }
        return (
          <FillBlank
            item={item}
            onComplete={(_, xp) => handleAdvance(xp)}
          />
        );
      }

      case 'recall': {
        // Check lesson vocab first, then word records
        const lessons = getLessonsForCourse(courseId);
        const lesson = lessons[lessonIndex];
        const vocabWord = lesson?.vocab.find(w => w.id === activity.id);

        if (vocabWord) {
          // Build a temporary WordRecord-like object for WordRecall
          const key = `${courseId}:${activity.id}`;
          const record = wordRecords[key] ?? {
            wordId: activity.id,
            courseId,
            word: vocabWord.word,
            translation: vocabWord.translation,
            example: vocabWord.exampleSentence,
            status: 'seen' as const,
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewAt: 0,
            lastSeenAt: Date.now(),
          };
          return (
            <WordRecall
              record={record}
              onComplete={(correct, xp) => {
                reviewWord(courseId, activity.id, correct ? 4 : 1);
                handleAdvance(xp);
              }}
            />
          );
        }

        const key = `${courseId}:${activity.id}`;
        const record = wordRecords[key];
        if (!record) { handleAdvance(); return null; }
        return (
          <WordRecall
            record={record}
            onComplete={(correct, xp) => {
              reviewWord(courseId, activity.id, correct ? 4 : 1);
              handleAdvance(xp);
            }}
          />
        );
      }

      case 'roleplay': {
        const rp = getRolePlay(activity.id);
        if (!rp) { handleAdvance(); return null; }
        return (
          <RolePlay
            rolePlay={rp}
            onComplete={xp => handleAdvance(xp)}
          />
        );
      }

      case 'srs-review': {
        const key = `${courseId}:${activity.id}`;
        const record = wordRecords[key];
        if (!record) { handleAdvance(); return null; }
        return (
          <SrsReview
            record={record}
            onComplete={quality => {
              reviewWord(courseId, activity.id, quality);
              handleAdvance(quality >= 3 ? 5 : 0);
            }}
          />
        );
      }

      default:
        return null;
    }
  };

  const phaseLabel = (): string => {
    const idx = currentIndex;
    const lessons = getLessonsForCourse(courseId);
    const lesson = lessons[lessonIndex];
    if (!lesson) return '';

    const vocabCount = lesson.vocab.length;
    const quizCount = Math.ceil(vocabCount / 2);
    const storyStart = vocabCount + quizCount;
    const compStart = storyStart + 1;

    if (idx < vocabCount) return `📚 Vocabulary (${idx + 1}/${vocabCount})`;
    if (idx < storyStart) return `💭 Quick quiz`;
    if (idx === storyStart) return `📖 Story`;
    if (idx < compStart + lesson.comprehension.length) return `🎯 Comprehension`;
    return `🧠 Review`;
  };

  const buildTutorContext = (): TutorContext => {
    const lessons = getLessonsForCourse(courseId);
    const lesson = lessons[lessonIndex];
    const ctx: TutorContext = { courseId, lessonIndex, activityType: activity.type };

    if (activity.type === 'vocab-intro' || activity.type === 'recall') {
      const word = lesson?.vocab.find(w => w.id === activity.id);
      if (word) ctx.currentWord = { word: word.word, translation: word.translation, example: word.exampleSentence };
    }

    if (activity.type === 'story') {
      const story = getStory(activity.id);
      if (story) {
        ctx.storyTitle = story.title;
        ctx.storyText = story.paragraphs.flat().map(s => s.text).join(' ');
      }
    }
    return ctx;
  };

  const handleTutorButtonClick = () => setTutorOpen(true);

  return (
    <div className="session-screen">
      <div className="session-topbar">
        <button className="exit-session-btn" onClick={goHome}>✕</button>
        <div className="session-progress-wrap">
          <div className="session-progress-bg">
            <div className="session-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="session-activity-label">{phaseLabel()}</div>
      </div>

      <div className="session-body" key={`${activity.type}-${activity.id}-${currentIndex}`}>
        {renderActivity()}
      </div>

      <button className="tutor-fab" onClick={handleTutorButtonClick} title="Ask AI Tutor">
        ✨
      </button>

      {tutorOpen && (
        <TutorChat
          ctx={buildTutorContext()}
          onClose={() => setTutorOpen(false)}
        />
      )}
    </div>
  );
}
