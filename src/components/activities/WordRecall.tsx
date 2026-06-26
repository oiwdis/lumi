import { useState } from 'react';
import type { WordRecord } from '../../types';

interface Props {
  record: WordRecord;
  onComplete: (correct: boolean, xp: number) => void;
}

export default function WordRecall({ record, onComplete }: Props) {
  const [input, setInput] = useState('');
  const [revealed, setRevealed] = useState(false);

  const normalize = (s: string) =>
    s.trim().toLowerCase()
      .replace(/[¿¡.,!?;:'"()]/g, '')
      .replace(/[áàâä]/g, 'a').replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i').replace(/[óòôö]/g, 'o')
      .replace(/[úùûü]/g, 'u').replace(/ñ/g, 'n');

  const correct = normalize(input) === normalize(record.word);

  const handleReveal = () => setRevealed(true);

  return (
    <div className="activity-card">
      <div className="activity-tag">Word Recall</div>
      <p className="activity-direction">How do you say this in the target language?</p>

      <div className="recall-prompt">
        <div className="recall-translation">{record.translation}</div>
        <div className="recall-example">"{record.example}"</div>
      </div>

      <input
        className={`recall-input ${revealed ? correct ? 'input-correct' : 'input-wrong' : ''}`}
        placeholder="Type your answer…"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !revealed) handleReveal(); }}
        disabled={revealed}
        autoFocus
      />

      {!revealed ? (
        <button className="primary-btn" disabled={!input.trim()} onClick={handleReveal}>
          Check
        </button>
      ) : (
        <div className={`feedback-strip ${correct ? 'fb-correct' : 'fb-wrong'}`}>
          <div>
            {correct ? '✓ Correct!' : `✗ It's "${record.word}"`}
          </div>
          <button className="continue-sm-btn" onClick={() => onComplete(correct, correct ? 10 : 3)}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
