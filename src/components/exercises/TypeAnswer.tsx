import { useState, useRef, useEffect } from 'react';

interface Props {
  correctAnswer: string;
  disabled: boolean;
  onAnswer: (answer: string) => void;
}

export default function TypeAnswer({ disabled, onAnswer }: Omit<Props, 'correctAnswer'> & { correctAnswer?: string }) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    setSubmitted(true);
    onAnswer(value);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="type-answer">
      <input
        ref={inputRef}
        className="type-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled || submitted}
        placeholder="Type your answer..."
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        className="check-btn"
        onClick={handleSubmit}
        disabled={!value.trim() || submitted}
      >
        Check
      </button>
    </div>
  );
}
