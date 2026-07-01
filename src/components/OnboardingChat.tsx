import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { COURSES } from '../data';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const LANG_GREETING: Record<string, string> = {
  'en-es': 'Spanish', 'en-zh': 'Chinese', 'en-fr': 'French', 'en-ja': 'Japanese',
};

export default function OnboardingChat() {
  const { selectedCourse, setCustomLessons, skipOnboarding, goBack } = useAppStore();
  const course = COURSES.find(c => c.id === selectedCourse);
  const lang = selectedCourse ? (LANG_GREETING[selectedCourse] ?? 'this language') : 'this language';

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleGenerate = async () => {
    if (!input.trim() || !selectedCourse) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/customize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse, language: lang, goal: input.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to generate lessons');
      const data = await res.json();
      if (!data.units?.length) throw new Error('No lesson plan returned');
      setCustomLessons(selectedCourse, data.units, input.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
  };

  return (
    <div className="onboard-screen">
      <div className="onboard-topbar">
        <button className="onboard-back" onClick={goBack}>←</button>
        <span className="onboard-flags">{course?.fromFlag} → {course?.toFlag}</span>
        <button className="onboard-skip" onClick={skipOnboarding}>Skip</button>
      </div>

      <div className="onboard-body">
        {/* AI bubble */}
        <div className="onboard-ai-bubble">
          <div className="onboard-ai-avatar">🌱</div>
          <div className="onboard-ai-text">
            <p>Hey! I'm Lumi, your AI language tutor. 👋</p>
            <p>Before we dive into {lang}, tell me — <strong>why are you learning it?</strong></p>
            <p>The more specific you are, the better I can tailor your lessons. For example:</p>
            <ul>
              <li><em>"Moving to Mexico to work at a hotel"</em></li>
              <li><em>"Dating someone who speaks {lang}"</em></li>
              <li><em>"Traveling through {lang.replace('English → ', '')}-speaking countries for 3 months"</em></li>
            </ul>
          </div>
        </div>

        {/* User input */}
        <div className="onboard-input-wrap">
          <textarea
            ref={inputRef}
            className="onboard-textarea"
            placeholder={`Tell Lumi why you're learning ${lang}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={loading}
          />
          {error && <div className="onboard-error">{error}</div>}
          <button
            className="onboard-btn"
            onClick={handleGenerate}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <span className="onboard-loading">
                <span className="onboard-spinner" />
                Building your lessons…
              </span>
            ) : (
              '✨ Build my lessons →'
            )}
          </button>
        </div>

        {loading && (
          <div className="onboard-generating">
            <div className="onboard-gen-icon">🧠</div>
            <p>Lumi is crafting lessons specifically for you…</p>
            <p className="onboard-gen-sub">This takes about 10–15 seconds</p>
          </div>
        )}
      </div>
    </div>
  );
}
