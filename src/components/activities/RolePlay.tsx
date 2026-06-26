import { useState } from 'react';
import type { RolePlay as RolePlayType, RolePlayChoice } from '../../types';

interface Props {
  rolePlay: RolePlayType;
  onComplete: (xp: number) => void;
}

export default function RolePlay({ rolePlay, onComplete }: Props) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [selected, setSelected] = useState<RolePlayChoice | null>(null);
  const [history, setHistory] = useState<{ npc: string; user: string; correct: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const turn = rolePlay.turns[turnIndex];

  const handleChoice = (choice: RolePlayChoice) => {
    if (selected) return;
    setSelected(choice);
    if (choice.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (!selected) return;
    const newHistory = [...history, {
      npc: turn.npc,
      user: selected.text,
      correct: selected.correct,
    }];
    setHistory(newHistory);
    if (turnIndex < rolePlay.turns.length - 1) {
      setTurnIndex(i => i + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  };

  if (done) {
    const xp = score * 10;
    return (
      <div className="activity-card">
        <div className="activity-tag">Role-play complete</div>
        <div className="rp-scenario">{rolePlay.emoji} {rolePlay.scenario}</div>
        <div className="rp-done-score">
          {score}/{rolePlay.turns.length} correct responses
        </div>
        <div className="rp-history">
          {history.map((h, i) => (
            <div key={i} className={`rp-hist-item ${h.correct ? 'hist-correct' : 'hist-wrong'}`}>
              <div className="hist-npc">{rolePlay.npcEmoji} {h.npc}</div>
              <div className="hist-user">👤 {h.user} {h.correct ? '✓' : '✗'}</div>
            </div>
          ))}
        </div>
        <button className="primary-btn" onClick={() => onComplete(xp)}>
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div className="activity-card">
      <div className="activity-tag">Role-play</div>
      <div className="rp-scenario">
        <span>{rolePlay.emoji}</span>
        <span>{rolePlay.scenario}</span>
      </div>

      <div className="rp-progress">
        {rolePlay.turns.map((_, i) => (
          <div key={i} className={`rp-dot ${i < turnIndex ? 'dot-done' : i === turnIndex ? 'dot-active' : 'dot-future'}`} />
        ))}
      </div>

      <div className="rp-bubble npc-bubble">
        <span className="rp-speaker-icon">{rolePlay.npcEmoji}</span>
        <div>
          <div className="rp-npc-name">{rolePlay.npcName}</div>
          <div className="rp-line">{turn.npc}</div>
          <div className="rp-translation">{turn.npcTranslation}</div>
        </div>
      </div>

      <p className="rp-instruction">How do you respond?</p>

      <div className="mc-options">
        {turn.choices.map((choice, i) => (
          <button
            key={i}
            className={`mc-option rp-choice ${
              selected
                ? choice === selected
                  ? choice.correct ? 'opt-correct' : 'opt-wrong'
                  : choice.correct ? 'opt-correct-reveal' : ''
                : ''
            }`}
            onClick={() => handleChoice(choice)}
            disabled={!!selected}
          >
            <span className="choice-text">{choice.text}</span>
            <span className="choice-trans">{choice.translation}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className={`feedback-strip ${selected.correct ? 'fb-correct' : 'fb-wrong'}`}>
          <span>{selected.feedback}</span>
          <button className="continue-sm-btn" onClick={handleNext}>
            {turnIndex < rolePlay.turns.length - 1 ? 'Next →' : 'Finish →'}
          </button>
        </div>
      )}
    </div>
  );
}
