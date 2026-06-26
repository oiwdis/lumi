import { useState } from 'react';

interface Props {
  options: string[];
  correctAnswer: string;
  disabled: boolean;
  onAnswer: (answer: string) => void;
}

export default function MultipleChoice({ options, correctAnswer, disabled, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (opt: string) => {
    if (disabled) return;
    setSelected(opt);
    onAnswer(opt);
  };

  const getClass = (opt: string) => {
    if (!disabled) return selected === opt ? 'option selected' : 'option';
    if (opt === correctAnswer) return 'option correct';
    if (opt === selected && opt !== correctAnswer) return 'option wrong';
    return 'option';
  };

  return (
    <div className="mc-options">
      {options.map((opt) => (
        <button
          key={opt}
          className={getClass(opt)}
          onClick={() => handleSelect(opt)}
          disabled={disabled}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
