import { useState } from 'react';
import type { VocabWord } from '../../data/courseLessons';
import { useAppStore } from '../../store/useAppStore';
import type { CourseId } from '../../types';

interface Props {
  word: VocabWord;
  courseId: CourseId;
  onNext: () => void;
}

export default function VocabIntro({ word, courseId, onNext }: Props) {
  const [revealed, setRevealed] = useState(false);
  const seeWord = useAppStore(s => s.seeWord);

  const handleReveal = () => {
    seeWord(courseId, word.id, word.word, word.translation, word.exampleSentence);
    setRevealed(true);
  };

  return (
    <div className="vocab-intro">
      <p className="vocab-intro-label">New word</p>

      <div className="vocab-card">
        <div className="vocab-emoji">{word.emoji}</div>
        <div className="vocab-word">{word.word}</div>

        {revealed ? (
          <>
            <div className="vocab-translation">{word.translation}</div>
            <div className="vocab-example-wrap">
              <p className="vocab-example">{word.exampleSentence}</p>
              <p className="vocab-example-tr">{word.exampleTranslation}</p>
            </div>
          </>
        ) : (
          <button className="vocab-reveal-btn" onClick={handleReveal}>
            Tap to reveal
          </button>
        )}
      </div>

      {revealed && (
        <button className="primary-btn" onClick={onNext}>
          Got it →
        </button>
      )}
    </div>
  );
}
