import { useState } from 'react';

interface Props {
  wordBank: string[];
  correctAnswer: string;
  disabled: boolean;
  onAnswer: (answer: string) => void;
}

export default function TapWords({ wordBank, disabled, onAnswer }: Omit<Props, 'correctAnswer'> & { correctAnswer?: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const addWord = (word: string) => {
    if (disabled || submitted) return;
    setSelected((prev) => [...prev, word]);
  };

  const removeWord = (idx: number) => {
    if (disabled || submitted) return;
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCheck = () => {
    if (selected.length === 0) return;
    setSubmitted(true);
    onAnswer(selected.join(' '));
  };

  const usedCounts: Record<string, number> = {};
  selected.forEach((w) => { usedCounts[w] = (usedCounts[w] || 0) + 1; });

  const bankCounts: Record<string, number> = {};
  wordBank.forEach((w) => { bankCounts[w] = (bankCounts[w] || 0) + 1; });

  // dedupe for display but track counts
  const seenInBank = new Set<string>();
  const displayBank = wordBank.filter((w) => {
    if (seenInBank.has(w)) return false;
    seenInBank.add(w);
    return true;
  });

  return (
    <div className="tap-words">
      {/* Answer area */}
      <div className="tap-answer-area">
        {selected.length === 0 ? (
          <span className="tap-placeholder">Tap words to build your answer</span>
        ) : (
          selected.map((word, idx) => (
            <button key={idx} className="tap-word selected-word" onClick={() => removeWord(idx)}>
              {word}
            </button>
          ))
        )}
      </div>

      <hr className="tap-divider" />

      {/* Word bank */}
      <div className="tap-word-bank">
        {displayBank.map((word, idx) => {
          const used = usedCounts[word] || 0;
          const total = bankCounts[word] || 0;
          const exhausted = used >= total;
          return (
            <button
              key={idx}
              className={`tap-word bank-word ${exhausted ? 'used' : ''}`}
              onClick={() => !exhausted && addWord(word)}
              disabled={disabled || exhausted}
            >
              {word}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          className="check-btn"
          onClick={handleCheck}
          disabled={selected.length === 0}
        >
          Check
        </button>
      )}
    </div>
  );
}
