import { useState, useEffect } from 'react';
import { type Lesson, type Exercise } from '../data/lessons';
import { useGameStore } from '../store/useGameStore';
import MultipleChoice from './exercises/MultipleChoice';
import TapWords from './exercises/TapWords';
import TypeAnswer from './exercises/TypeAnswer';

interface Props {
  lesson: Lesson;
  onExit: () => void;
}

type Phase = 'exercise' | 'feedback' | 'complete';

export default function LessonScreen({ lesson, onExit }: Props) {
  const { addXP, completeLesson, loseHeart, hearts, incrementStreak } = useGameStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('exercise');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState(false);

  const exercises = lesson.exercises;
  const current = exercises[currentIdx];
  const progress = (currentIdx / exercises.length) * 100;

  const handleAnswer = (answer: string) => {
    const correct = normalize(answer) === normalize(current.answer);
    setLastCorrect(correct);
    setPhase('feedback');
    if (!correct) {
      setMistakes((m) => m + 1);
      loseHeart();
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleContinue = () => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx((i) => i + 1);
      setPhase('exercise');
    } else {
      setPhase('complete');
      completeLesson(lesson.id);
      addXP(lesson.xpReward);
      if (mistakes === 0) incrementStreak();
    }
  };

  const xpEarned = mistakes === 0 ? lesson.xpReward : Math.max(5, lesson.xpReward - mistakes * 2);

  return (
    <div className={`lesson-screen ${shake ? 'shake' : ''}`}>
      {/* Header */}
      <div className="lesson-header">
        <button className="exit-btn" onClick={onExit}>✕</button>
        <div className="lesson-progress-bar-bg">
          <div className="lesson-progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="hearts-display">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`heart ${i < hearts ? 'full' : 'empty'}`}>❤️</span>
          ))}
        </div>
      </div>

      {phase === 'complete' ? (
        <CompletionScreen
          lesson={lesson}
          xp={xpEarned}
          mistakes={mistakes}
          perfect={mistakes === 0}
          onContinue={onExit}
        />
      ) : (
        <>
          <div className="exercise-area">
            <ExercisePrompt exercise={current} />
            {renderExercise(current, phase === 'feedback', handleAnswer)}
          </div>

          {phase === 'feedback' && (
            <FeedbackBar
              correct={lastCorrect}
              correctAnswer={current.answer}
              onContinue={handleContinue}
            />
          )}
        </>
      )}
    </div>
  );
}

function normalize(s: string) {
  return s.trim().toLowerCase()
    .replace(/[¿¡]/g, '')
    .replace(/[áàâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, ' ');
}

function ExercisePrompt({ exercise }: { exercise: Exercise }) {
  const isTargetLang = exercise.promptLang !== 'english';
  return (
    <div className="exercise-prompt">
      <p className="exercise-direction">
        {exercise.type === 'translate-to-target' ? 'Translate to the target language' :
          exercise.type === 'translate-to-english' ? 'Translate to English' :
            exercise.type === 'tap-words' ? 'Tap the words in order' :
              'Choose the correct answer'}
      </p>
      <div className={`prompt-bubble ${isTargetLang ? 'target-lang' : ''}`}>
        <span className="prompt-char">🦉</span>
        <p className="prompt-text">{exercise.prompt}</p>
      </div>
      {exercise.hint && (
        <p className="hint-text">Hint: {exercise.hint}</p>
      )}
    </div>
  );
}

function renderExercise(exercise: Exercise, disabled: boolean, onAnswer: (a: string) => void) {
  if (exercise.type === 'multiple-choice' || exercise.type === 'translate-to-english') {
    return (
      <MultipleChoice
        options={exercise.options!}
        correctAnswer={exercise.answer}
        disabled={disabled}
        onAnswer={onAnswer}
      />
    );
  }
  if (exercise.type === 'tap-words') {
    return (
      <TapWords
        wordBank={exercise.wordBank!}
        correctAnswer={exercise.answer}
        disabled={disabled}
        onAnswer={onAnswer}
      />
    );
  }
  return (
    <TypeAnswer
      correctAnswer={exercise.answer}
      disabled={disabled}
      onAnswer={onAnswer}
    />
  );
}

function FeedbackBar({ correct, correctAnswer, onContinue }: {
  correct: boolean;
  correctAnswer: string;
  onContinue: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onContinue();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onContinue]);

  return (
    <div className={`feedback-bar ${correct ? 'correct' : 'incorrect'}`}>
      <div className="feedback-content">
        <div className="feedback-icon">{correct ? '✓' : '✗'}</div>
        <div className="feedback-text">
          <strong>{correct ? 'Great job!' : 'Correct answer:'}</strong>
          {!correct && <span>{correctAnswer}</span>}
        </div>
      </div>
      <button className="continue-btn" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

function CompletionScreen({ lesson, xp, mistakes, perfect, onContinue }: {
  lesson: Lesson;
  xp: number;
  mistakes: number;
  perfect: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="completion-screen">
      <div className="completion-animation">{perfect ? '🎉' : '⭐'}</div>
      <h2>{perfect ? 'Perfect Lesson!' : 'Lesson Complete!'}</h2>
      <p className="completion-subtitle">{lesson.title}</p>

      <div className="completion-stats">
        <div className="completion-stat">
          <span className="cstat-icon">⚡</span>
          <span className="cstat-label">XP Earned</span>
          <span className="cstat-value">+{xp}</span>
        </div>
        <div className="completion-stat">
          <span className="cstat-icon">❌</span>
          <span className="cstat-label">Mistakes</span>
          <span className="cstat-value">{mistakes}</span>
        </div>
        {perfect && (
          <div className="completion-stat">
            <span className="cstat-icon">🔥</span>
            <span className="cstat-label">Streak</span>
            <span className="cstat-value">+1</span>
          </div>
        )}
      </div>

      <button className="big-btn" onClick={onContinue}>Continue</button>
    </div>
  );
}
