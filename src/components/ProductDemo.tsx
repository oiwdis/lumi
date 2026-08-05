import { useEffect, useState } from 'react';

/**
 * Auto-looping recreation of a real lesson: the learner picks an answer, asks
 * Lumi why, and gets the grammar explained without leaving the exercise.
 *
 * Built from the app's own styling rather than a screen recording, so it stays
 * sharp at any width, follows the light/dark theme, and costs no page weight.
 */

const OPTIONS = ['Good morning', 'Good afternoon', 'Good night', 'Goodbye'];
const CORRECT = 1;

const QUESTION = 'why buenas and not buenos?';
const ANSWER =
  '“Tardes” is feminine and plural, so “buenas” has to agree with it. ' +
  'That’s why “buenos días” is correct too — “días” is masculine.';

// step → ms to wait before advancing to the next step
const TIMELINE = [
  1100, // 0 idle, exercise on screen
  900,  // 1 answer tapped
  700,  // 2 answer confirmed correct
  1000, // 3 chat opens
  1500, // 4 question types out
  600,  // 5 question sent
  900,  // 6 Lumi thinking
  0,    // 7 answer streams in (advances when the text finishes)
  4200, // 8 hold on the finished exchange
];

export default function ProductDemo() {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // With reduced motion we skip straight to the finished exchange and stay there
  const [step, setStep] = useState(reduceMotion ? 8 : 0);
  const [typed, setTyped] = useState(reduceMotion ? QUESTION : '');
  const [streamed, setStreamed] = useState(reduceMotion ? ANSWER : '');

  // Drive the timeline
  useEffect(() => {
    if (reduceMotion || step === 7) return;
    const t = window.setTimeout(
      () => setStep(s => (s + 1) % TIMELINE.length),
      TIMELINE[step],
    );
    return () => window.clearTimeout(t);
  }, [step, reduceMotion]);

  // Type the learner's question
  useEffect(() => {
    if (reduceMotion) return;
    if (step < 4) { setTyped(''); return; }
    if (step > 4) { setTyped(QUESTION); return; }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(QUESTION.slice(0, i));
      if (i >= QUESTION.length) window.clearInterval(id);
    }, 45);
    return () => window.clearInterval(id);
  }, [step, reduceMotion]);

  // Stream Lumi's reply, then release the timeline
  useEffect(() => {
    if (reduceMotion) return;
    if (step !== 7) { if (step < 7) setStreamed(''); return; }
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setStreamed(ANSWER.slice(0, i));
      if (i >= ANSWER.length) {
        window.clearInterval(id);
        setStep(8);
      }
    }, 22);
    return () => window.clearInterval(id);
  }, [step, reduceMotion]);

  const answered = step >= 1;
  const confirmed = step >= 2;
  const chatOpen = step >= 3;
  const questionSent = step >= 5;
  const thinking = step === 6;

  return (
    <section className="pd-section">
      <div className="pd-copy">
        <h2 className="pd-title">Stuck mid-lesson? Just ask.</h2>
        <p className="pd-sub">
          No other app lets you stop and ask why. Lumi answers in the exercise,
          then you carry on.
        </p>
      </div>

      <div className="pd-frame" aria-label="Demonstration of asking the Lumi tutor a question during a lesson">
        <div className="pd-topbar">
          <span className="pd-topbar-flags">🇺🇸 → 🇪🇸</span>
          <span className="pd-topbar-title">👋 Greetings</span>
          <span className="pd-topbar-streak">🔥 4</span>
        </div>

        <div className="pd-progress"><div className="pd-progress-fill" /></div>

        <div className="pd-body">
          <div className="pd-instruction">What does this Spanish word mean?</div>
          <div className="pd-prompt-card">
            <div className="pd-prompt-word">Buenas tardes</div>
            <div className="pd-speak-row">
              <span className="pd-chip">🔊 Listen</span>
              <span className="pd-chip">🎤 Speak</span>
            </div>
          </div>

          <div className="pd-options">
            {OPTIONS.map((opt, i) => {
              const picked = answered && i === CORRECT;
              return (
                <div
                  key={opt}
                  className={`pd-option${picked ? ' pd-option--picked' : ''}${
                    picked && confirmed ? ' pd-option--correct' : ''
                  }`}
                >
                  {opt}
                  {picked && confirmed && <span className="pd-tick">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat overlay */}
        <div className={`pd-chat${chatOpen ? ' pd-chat--open' : ''}`}>
          <div className="pd-chat-head">
            <span className="pd-chat-avatar">🌱</span>
            <span className="pd-chat-name">Lumi</span>
          </div>

          <div className="pd-chat-msgs">
            {questionSent && <div className="pd-msg pd-msg--user">{QUESTION}</div>}
            {thinking && (
              <div className="pd-msg pd-msg--ai pd-msg--thinking">
                <span /><span /><span />
              </div>
            )}
            {step >= 7 && <div className="pd-msg pd-msg--ai">{streamed}</div>}
          </div>

          <div className="pd-chat-input">
            <span className="pd-chat-input-text">
              {questionSent ? '' : typed}
              {!questionSent && <span className="pd-caret" />}
            </span>
            <span className="pd-chat-send">↑</span>
          </div>
        </div>

        <span className="pd-fab">💬</span>
      </div>
    </section>
  );
}
