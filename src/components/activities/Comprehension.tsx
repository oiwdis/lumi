import { useState } from 'react';
import type { ComprehensionQ } from '../../data/courseLessons';

interface Props {
  question: ComprehensionQ;
  onComplete: (correct: boolean, xp: number) => void;
}

export default function Comprehension({ question, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const correct = selected === question.answer;

  const handleSelect = (opt: string) => {
    if (selected !== null) return;
    setSelected(opt);
  };

  const handleContinue = () => {
    onComplete(correct, correct ? 10 : 0);
  };

  return (
    <div className="comprehension">
      <p className="comprehension-label">Comprehension</p>
      <h2 className="comprehension-question">{question.question}</h2>

      <div className="comprehension-options">
        {question.options.map(opt => {
          let cls = 'comp-option';
          if (selected !== null) {
            if (opt === question.answer) cls += ' correct';
            else if (opt === selected) cls += ' wrong';
          }
          return (
            <button key={opt} className={cls} onClick={() => handleSelect(opt)}>
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className={`comp-feedback ${correct ? 'correct' : 'wrong'}`}>
          <span className="comp-feedback-icon">{correct ? '✓' : '✗'}</span>
          <span>{correct ? 'Correct!' : `Answer: ${question.answer}`}</span>
        </div>
      )}

      {selected !== null && (
        <button className="primary-btn" onClick={handleContinue}>
          Continue →
        </button>
      )}
    </div>
  );
}
