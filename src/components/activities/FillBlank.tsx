import { useState } from 'react';
import type { FillBlankItem } from '../../types';

interface Props {
  item: FillBlankItem;
  onComplete: (correct: boolean, xp: number) => void;
}

export default function FillBlank({ item, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const correct = selected === item.answer;

  const handleSelect = (opt: string) => {
    if (revealed) return;
    setSelected(opt);
  };

  const handleCheck = () => {
    if (!selected) return;
    setRevealed(true);
  };

  return (
    <div className="activity-card">
      <div className="activity-tag">Fill in the blank</div>
      <p className="activity-direction">Choose the word that best completes the sentence.</p>

      <div className="fill-sentence">
        <span>{item.before} </span>
        <span className={`fill-blank-slot ${revealed ? (correct ? 'slot-correct' : 'slot-wrong') : selected ? 'slot-filled' : ''}`}>
          {selected ?? '___'}
        </span>
        <span> {item.after}</span>
      </div>

      <div className="fill-translation">"{item.fullTranslation}"</div>

      <div className="mc-options">
        {item.options.map(opt => (
          <button
            key={opt}
            className={`mc-option ${
              revealed
                ? opt === item.answer ? 'opt-correct'
                  : opt === selected ? 'opt-wrong' : ''
                : selected === opt ? 'opt-selected' : ''
            }`}
            onClick={() => handleSelect(opt)}
            disabled={revealed}
          >
            {opt}
          </button>
        ))}
      </div>

      {!revealed ? (
        <button className="primary-btn" disabled={!selected} onClick={handleCheck}>
          Check
        </button>
      ) : (
        <div className={`feedback-strip ${correct ? 'fb-correct' : 'fb-wrong'}`}>
          <span>{correct ? '✓ Correct!' : `✗ The answer is "${item.answer}"`}</span>
          <button className="continue-sm-btn" onClick={() => onComplete(correct, correct ? 10 : 3)}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
