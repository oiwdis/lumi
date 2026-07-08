import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { COURSES } from '../data';

const LANG_GREETING: Record<string, string> = {
  'en-es': 'Spanish', 'en-zh': 'Chinese', 'en-fr': 'French', 'en-ja': 'Japanese', 'en-ko': 'Korean', 'en-de': 'German',
};

// ── Mini-game word bank ───────────────────────────────────────────────────────
const WORD_BANK: { en: string; es: string; fr: string; de: string; zh: string; zhR: string; ja: string; jaR: string; ko: string; koR: string }[] = [
  { en: 'Hello',     es: 'Hola',        fr: 'Bonjour',    de: 'Hallo',       zh: '你好',  zhR: 'nǐ hǎo',    ja: 'こんにちは', jaR: 'konnichiwa',  ko: '안녕하세요', koR: 'annyeonghaseyo' },
  { en: 'Thank you', es: 'Gracias',     fr: 'Merci',      de: 'Danke',       zh: '谢谢',  zhR: 'xiè xie',   ja: 'ありがとう', jaR: 'arigatou',    ko: '감사합니다', koR: 'gamsahamnida' },
  { en: 'Yes',       es: 'Sí',          fr: 'Oui',        de: 'Ja',          zh: '是',    zhR: 'shì',        ja: 'はい',      jaR: 'hai',         ko: '네',        koR: 'ne' },
  { en: 'No',        es: 'No',          fr: 'Non',        de: 'Nein',        zh: '不',    zhR: 'bù',         ja: 'いいえ',    jaR: 'iie',         ko: '아니요',    koR: 'aniyo' },
  { en: 'Water',     es: 'Agua',        fr: 'Eau',        de: 'Wasser',      zh: '水',    zhR: 'shuǐ',       ja: '水',        jaR: 'mizu',        ko: '물',        koR: 'mul' },
  { en: 'Food',      es: 'Comida',      fr: 'Nourriture', de: 'Essen',       zh: '食物',  zhR: 'shí wù',     ja: '食べ物',    jaR: 'tabemono',    ko: '음식',      koR: 'eumsik' },
  { en: 'Friend',    es: 'Amigo',       fr: 'Ami',        de: 'Freund',      zh: '朋友',  zhR: 'péngyǒu',   ja: '友達',      jaR: 'tomodachi',   ko: '친구',      koR: 'chingu' },
  { en: 'Good',      es: 'Bueno',       fr: 'Bon',        de: 'Gut',         zh: '好',    zhR: 'hǎo',        ja: 'いい',      jaR: 'ii',          ko: '좋아요',    koR: 'joayo' },
  { en: 'Day',       es: 'Día',         fr: 'Jour',       de: 'Tag',         zh: '天',    zhR: 'tiān',       ja: '日',        jaR: 'hi',          ko: '날',        koR: 'nal' },
  { en: 'House',     es: 'Casa',        fr: 'Maison',     de: 'Haus',        zh: '房子',  zhR: 'fángzi',     ja: '家',        jaR: 'ie',          ko: '집',        koR: 'jip' },
  { en: 'Love',      es: 'Amor',        fr: 'Amour',      de: 'Liebe',       zh: '爱',    zhR: 'ài',         ja: '愛',        jaR: 'ai',          ko: '사랑',      koR: 'sarang' },
  { en: 'Beautiful', es: 'Bonito',      fr: 'Beau',       de: 'Schön',       zh: '漂亮',  zhR: 'piàoliang',  ja: '綺麗',      jaR: 'kirei',       ko: '예뻐요',    koR: 'yeppeoyo' },
  { en: 'Cat',       es: 'Gato',        fr: 'Chat',       de: 'Katze',       zh: '猫',    zhR: 'māo',        ja: '猫',        jaR: 'neko',        ko: '고양이',    koR: 'goyangi' },
  { en: 'Dog',       es: 'Perro',       fr: 'Chien',      de: 'Hund',        zh: '狗',    zhR: 'gǒu',        ja: '犬',        jaR: 'inu',         ko: '강아지',    koR: 'gangaji' },
  { en: 'Sun',       es: 'Sol',         fr: 'Soleil',     de: 'Sonne',       zh: '太阳',  zhR: 'tài yáng',   ja: '太陽',      jaR: 'taiyou',      ko: '태양',      koR: 'taeyang' },
];

type LangKey = 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko';

function getTranslation(word: (typeof WORD_BANK)[0], lang: LangKey): string {
  if (lang === 'zh') return `${word.zh}  ${word.zhR}`;
  if (lang === 'ja') return `${word.ja}  ${word.jaR}`;
  if (lang === 'ko') return `${word.ko}  ${word.koR}`;
  return word[lang];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── LoadingGame component ─────────────────────────────────────────────────────

function LoadingGame({ lang }: { lang: string }) {
  const langKey: LangKey =
    lang === 'Spanish' ? 'es' :
    lang === 'French'  ? 'fr' :
    lang === 'Chinese' ? 'zh' :
    lang === 'Korean'  ? 'ko' :
    lang === 'German'  ? 'de' : 'ja';

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(3);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answered, setAnswered] = useState(false);

  // Build shuffled question deck once using useMemo so it's available on first render
  const deck = useMemo(() => {
    const shuffled = shuffle(WORD_BANK);
    return shuffled.map((word) => {
      const distractors = shuffle(WORD_BANK.filter(w => w !== word)).slice(0, 2);
      return { correct: word, options: shuffle([word, ...distractors]) };
    });
  }, []);

  const q = deck[questionIdx % deck.length];

  const advance = useCallback(() => {
    setAnswered(false);
    setFlash(null);
    setTimeLeft(3);
    setQuestionIdx(i => i + 1);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (answered || !q) return;
    if (timeLeft <= 0) {
      setFlash('wrong');
      setStreak(0);
      setTimeout(advance, 700);
      return;
    }
    const t = setTimeout(() => setTimeLeft(n => n - 0.05), 50);
    return () => clearTimeout(t);
  }, [timeLeft, answered, q, advance]);

  const handlePick = (word: (typeof WORD_BANK)[0]) => {
    if (answered || !q) return;
    setAnswered(true);
    const correct = word === q.correct;
    setFlash(correct ? 'correct' : 'wrong');
    if (correct) {
      setScore(s => s + 1 + streak);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
    setTimeout(advance, 700);
  };

  if (!q) return null;

  const timerPct = (timeLeft / 3) * 100;

  return (
    <div className="wg-wrap">
      <div className="wg-header">
        <span className="wg-title">While you wait… 🎮</span>
        <span className="wg-score">⭐ {score}</span>
      </div>

      {/* Timer bar */}
      <div className="wg-timer-track">
        <div
          className={`wg-timer-fill ${timerPct < 40 ? 'wg-timer-fill--low' : ''}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="wg-prompt">
        <span className="wg-prompt-label">How do you say this in {lang}?</span>
        <span className="wg-prompt-word">{q.correct.en}</span>
        {streak >= 2 && <span className="wg-streak">🔥 {streak}×</span>}
      </div>

      <div className={`wg-options ${flash ? `wg-options--${flash}` : ''}`}>
        {q.options.map((opt, i) => {
          const isCorrect = opt === q.correct;
          const cls = flash
            ? isCorrect ? 'wg-opt wg-opt--correct' : 'wg-opt wg-opt--wrong'
            : 'wg-opt';
          return (
            <button key={i} className={cls} onClick={() => handlePick(opt)} disabled={!!flash}>
              {getTranslation(opt, langKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Level = 'beginner' | 'intermediate' | 'advanced';

const LEVELS: { id: Level; label: string; emoji: string; desc: string }[] = [
  { id: 'beginner',     label: 'Beginner',     emoji: '🌱', desc: 'Little to no experience' },
  { id: 'intermediate', label: 'Intermediate', emoji: '🌿', desc: 'Know some basics already' },
  { id: 'advanced',     label: 'Advanced',     emoji: '🌳', desc: 'Conversational or higher' },
];

export default function OnboardingChat() {
  const { selectedCourse, setCustomLessons, skipOnboarding, goBack } = useAppStore();
  const course = COURSES.find(c => c.id === selectedCourse);
  const lang = selectedCourse ? (LANG_GREETING[selectedCourse] ?? 'this language') : 'this language';

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleGenerate = async (chosenLevel: Level) => {
    if (!input.trim() || !selectedCourse) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse, language: lang, goal: input.trim(), level: chosenLevel }),
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

  return (
    <div className="onboard-screen">
      <div className="onboard-topbar">
        <button className="onboard-back" onClick={goBack}>←</button>
        <span className="onboard-flags">{course?.fromFlag} → {course?.toFlag}</span>
        <button className="onboard-skip" onClick={skipOnboarding}>Skip</button>
      </div>

      <div className="onboard-body">
        {loading ? (
          /* ── Loading state: show game ── */
          <>
            <div className="onboard-generating">
              <div className="onboard-gen-icon">🧠</div>
              <p>Lumi is building your personal lesson plan…</p>
              <p className="onboard-gen-sub">~15 seconds · play while you wait!</p>
            </div>
            <LoadingGame lang={lang} />
          </>
        ) : (
          /* ── Single step: goal + level ── */
          <>
            <div className="onboard-ai-bubble">
              <div className="onboard-ai-avatar">🌱</div>
              <div className="onboard-ai-text">
                <p>Hey! I'm Lumi, your AI language tutor. 👋</p>
                <p>Two quick questions and I'll build your personal {lang} curriculum:</p>
              </div>
            </div>

            <div className="onboard-input-wrap">
              <label className="onboard-field-label">Why are you learning {lang}?</label>
              <textarea
                ref={inputRef}
                className="onboard-textarea"
                placeholder={`e.g. "Moving to Mexico for work", "Dating someone who speaks ${lang}"…`}
                value={input}
                onChange={e => setInput(e.target.value)}
                rows={3}
                disabled={loading}
              />

              <label className="onboard-field-label" style={{ marginTop: 16 }}>What's your current level?</label>
              <div className="onboard-level-grid">
                {LEVELS.map(lv => (
                  <button
                    key={lv.id}
                    className={`onboard-level-btn ${!input.trim() ? 'onboard-level-btn--disabled' : ''}`}
                    disabled={!input.trim()}
                    onClick={() => handleGenerate(lv.id)}
                  >
                    <span className="onboard-level-emoji">{lv.emoji}</span>
                    <span className="onboard-level-label">{lv.label}</span>
                    <span className="onboard-level-desc">{lv.desc}</span>
                  </button>
                ))}
              </div>

              {error && <div className="onboard-error">{error}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
