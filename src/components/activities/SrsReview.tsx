import { useState } from 'react';
import type { WordRecord } from '../../types';

interface Props {
  record: WordRecord;
  onComplete: (quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
}

export default function SrsReview({ record, onComplete }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="activity-card">
      <div className="activity-tag srs-tag">🧠 Spaced Repetition Review</div>
      <p className="activity-direction">Do you remember this word?</p>

      <div className="srs-card">
        <div className="srs-word">{record.word}</div>
        {!revealed ? (
          <button className="reveal-btn" onClick={() => setRevealed(true)}>
            Show meaning
          </button>
        ) : (
          <>
            <div className="srs-translation">{record.translation}</div>
            {record.example && (
              <div className="srs-example">
                <span className="srs-example-label">Example:</span>
                <span>{record.example}</span>
              </div>
            )}
          </>
        )}
      </div>

      {revealed && (
        <>
          <p className="srs-rate-prompt">How well did you remember it?</p>
          <div className="srs-rating">
            {[
              { label: "Didn't know", sub: 'Starting over', q: 0 as const, cls: 'rate-fail' },
              { label: 'Hard', sub: 'Got it wrong', q: 2 as const, cls: 'rate-hard' },
              { label: 'Good', sub: 'Got it right', q: 4 as const, cls: 'rate-good' },
              { label: 'Easy', sub: 'Instant recall', q: 5 as const, cls: 'rate-easy' },
            ].map(r => (
              <button key={r.label} className={`rate-btn ${r.cls}`} onClick={() => onComplete(r.q)}>
                <span className="rate-label">{r.label}</span>
                <span className="rate-sub">{r.sub}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
