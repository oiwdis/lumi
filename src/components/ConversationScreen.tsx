import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { COURSES } from '../data';
import { TOPICS, type Topic, type Word } from '../data/lessonWords';
import { getLevelForXp, xpProgressInLevel } from '../lib/levels';
import Avatar from './Avatar';
import AIChat, { type ChatMessage } from './AIChat';

// ── types ─────────────────────────────────────────────────────────────────────

const TTS_LANG: Record<string, string> = {
  'en-es': 'es-ES', 'en-zh': 'zh-CN', 'en-fr': 'fr-FR', 'en-ja': 'ja-JP',
};
const LANG_NAME: Record<string, string> = {
  'en-es': 'Spanish', 'en-zh': 'Chinese', 'en-fr': 'French', 'en-ja': 'Japanese',
};

type Mode = 'voice' | 'silent';

interface MCExercise {
  kind: 'mc';
  instruction: string;
  prompt: string;
  promptSub?: string;   // pronunciation hint
  options: string[];
  correct: number;
  word: Word;
}
interface TypeExercise {
  kind: 'type';
  instruction: string;
  prompt: string;
  answer: string;
  hint?: string;
  word: Word;
}
interface PairsExercise {
  kind: 'pairs';
  instruction: string;
  wordPairs: Array<{ target: string; english: string }>;
}
type Exercise = MCExercise | TypeExercise | PairsExercise;

// ── exercise generator ────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function distractors(word: Word, pool: Word[], field: 'target' | 'english', count = 3): string[] {
  return shuffle(pool.filter(w => w[field] !== word[field])).slice(0, count).map(w => w[field]);
}

function buildExercises(topic: Topic, pool: Word[], langName: string): Exercise[] {
  const words = topic.words;
  const ex: Exercise[] = [];

  // Pairs exercise (intro — always first)
  const pairWords = shuffle(words).slice(0, 4);
  ex.push({
    kind: 'pairs',
    instruction: 'Tap the matching pairs',
    wordPairs: pairWords,
  });

  // Multiple choice: recognize (target → English)
  for (const word of shuffle(words)) {
    const opts = shuffle([word.english, ...distractors(word, pool, 'english')]);
    ex.push({
      kind: 'mc',
      instruction: `What does this ${langName} word mean?`,
      prompt: word.target,
      promptSub: word.hint,
      options: opts,
      correct: opts.indexOf(word.english),
      word,
    });
  }

  // Multiple choice: produce (English → target)
  for (const word of shuffle(words)) {
    const opts = shuffle([word.target, ...distractors(word, pool, 'target')]);
    ex.push({
      kind: 'mc',
      instruction: `How do you say this in ${langName}?`,
      prompt: word.english,
      options: opts,
      correct: opts.indexOf(word.target),
      word,
    });
  }

  // Type it: translate to target
  for (const word of shuffle(words).slice(0, 3)) {
    ex.push({
      kind: 'type',
      instruction: `Type "${word.english}" in ${langName}`,
      prompt: word.english,
      answer: word.target,
      hint: word.hint,
      word,
    });
  }

  // Shuffle everything except first pairs exercise
  return [ex[0], ...shuffle(ex.slice(1))];
}

// ── answer normalization ──────────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.!?,;]/g, '');
}

function checkType(input: string, ex: TypeExercise): boolean {
  const a = norm(input), b = norm(ex.answer);
  if (a === b) return true;
  if (ex.hint && norm(input) === norm(ex.hint)) return true;
  if (a.includes(b) && b.length > 1) return true;
  return false;
}

// ── TTS ───────────────────────────────────────────────────────────────────────

function speakWord(text: string, lang: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.volume = 1; u.rate = 0.8;
  window.speechSynthesis.speak(u);
}

// ── lesson state ──────────────────────────────────────────────────────────────

interface LessonState {
  exercises: Exercise[];
  idx: number;
  hearts: number;
  score: number;
  // per-exercise interaction state
  selected: number | null;       // MC selected index
  typed: string;                 // type exercise input
  checked: boolean;              // has user checked answer
  correct: boolean | null;       // result after check
  // pairs state
  pairsLeft: string[];           // shuffled lefts
  pairsRight: string[];          // shuffled rights
  pairsSelected: { side: 'left' | 'right'; value: string } | null;
  pairsMatched: string[];        // matched left values
  pairsWrong: string | null;     // briefly highlight wrong pair
}

function initLesson(topic: Topic, pool: Word[], langName: string): LessonState {
  const exercises = buildExercises(topic, pool, langName);
  return {
    exercises, idx: 0, hearts: 3, score: 0,
    selected: null, typed: '', checked: false, correct: null,
    pairsLeft: [], pairsRight: [], pairsSelected: null, pairsMatched: [], pairsWrong: null,
  };
}

interface QuizState {
  questions: MCExercise[];
  idx: number;
  score: number;
  selected: number | null;
  checked: boolean;
  correct: boolean | null;
}

function initExercise(ls: LessonState): LessonState {
  const ex = ls.exercises[ls.idx];
  let pairsLeft: string[] = [], pairsRight: string[] = [];
  if (ex.kind === 'pairs') {
    pairsLeft = shuffle(ex.wordPairs.map(w => w.target));
    pairsRight = shuffle(ex.wordPairs.map(w => w.english));
  }
  return { ...ls, selected: null, typed: '', checked: false, correct: null, pairsLeft, pairsRight, pairsSelected: null, pairsMatched: [], pairsWrong: null };
}

function buildQuiz(topic: Topic, pool: Word[], langName: string): QuizState {
  const words = topic.words;
  const questions: MCExercise[] = [];
  for (const word of shuffle(words)) {
    const recognize = Math.random() > 0.5;
    if (recognize) {
      const opts = shuffle([word.english, ...distractors(word, pool, 'english')]);
      questions.push({ kind: 'mc', instruction: `What does "${word.target}" mean?`, prompt: word.target, promptSub: word.hint, options: opts, correct: opts.indexOf(word.english), word });
    } else {
      const opts = shuffle([word.target, ...distractors(word, pool, 'target')]);
      questions.push({ kind: 'mc', instruction: `How do you say "${word.english}"?`, prompt: word.english, options: opts, correct: opts.indexOf(word.target), word });
    }
  }
  return { questions, idx: 0, score: 0, selected: null, checked: false, correct: null };
}

// ── AI streaming helper ───────────────────────────────────────────────────────

async function fetchAIResponse(
  prompt: string, systemPrompt: string,
  onChunk: (t: string) => void
): Promise<void> {
  try {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], systemPrompt }),
    });
    if (!res.ok) return;
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') break;
        try { const { text } = JSON.parse(raw); if (text) onChunk(text); } catch { /* skip */ }
      }
    }
  } catch { /* ignore — AI feedback is optional */ }
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function ConversationScreen() {
  const { selectedCourse, currentLessonId, user, xp, streak, addXp, goBack, completeLesson, logout } = useAppStore();
  const course = selectedCourse ? COURSES.find(c => c.id === selectedCourse) : null;
  const ttsLang = selectedCourse ? TTS_LANG[selectedCourse] : 'es-ES';
  const langName = selectedCourse ? LANG_NAME[selectedCourse] : 'Spanish';
  const topics = selectedCourse ? (TOPICS[selectedCourse] ?? []) : [];

  // Look up the current lesson's topic
  const currentTopic = currentLessonId
    ? topics.find(t => t.id === currentLessonId) ?? null
    : null;

  const [screen, setScreen] = useState<'lesson' | 'quiz' | 'results'>('lesson');
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [mode] = useState<Mode>('silent');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [ls, setLs] = useState<LessonState | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUnread, setChatUnread] = useState(false);
  const chatMsgIdRef = useRef(0);

  const level = getLevelForXp(xp);
  const { pct } = xpProgressInLevel(xp);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pool of all words for this language (for distractors)
  const allWords = topics.flatMap(t => t.words);

  const ex = ls ? ls.exercises[ls.idx] : null;
  const total = ls ? ls.exercises.length : 1;
  const isLastExercise = ls ? ls.idx >= ls.exercises.length - 1 : false;

  // ── start lesson ────────────────────────────────────────────────────────────
  const handleStartLesson = useCallback((t: Topic, m: Mode) => {
    const state = initLesson(t, allWords, langName);
    setTopic(t);
    setLs(initExercise(state));
    setChatMessages([]);
    setScreen('lesson');
  }, [allWords, langName]);

  // Auto-start lesson from the path immediately on mount
  useEffect(() => {
    if (currentTopic && !ls) {
      handleStartLesson(currentTopic, 'silent');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ── check answer ─────────────────────────────────────────────────────────────
  const handleCheck = useCallback(() => {
    if (!ls || !ex) return;
    let correct = false;

    if (ex.kind === 'mc') {
      correct = ls.selected === ex.correct;
    } else if (ex.kind === 'type') {
      correct = checkType(ls.typed, ex);
    }

    const newHearts = correct ? ls.hearts : Math.max(0, ls.hearts - 1);
    const newScore = correct ? ls.score + 1 : ls.score;
    setLs(prev => prev ? { ...prev, checked: true, correct, hearts: newHearts, score: newScore } : prev);
    addXp(correct ? 20 : 5);

    // Push AI feedback into chat
    const word = (ex as MCExercise | TypeExercise).word;
    if (word) {
      const prompt = correct
        ? `Student correctly answered "${word.target}" (${word.english}) in ${langName}. Give ONE short encouraging sentence (max 12 words). No markdown.`
        : `Student got "${word.target}" (${word.english}) wrong in ${langName}. Give ONE helpful tip (max 15 words). No markdown. Be kind.`;
      const systemPrompt = `You are Lumi, an encouraging ${langName} tutor. Very short, punchy responses. No markdown.`;
      const msgId = String(++chatMsgIdRef.current);
      setChatMessages(prev => [...prev, { id: msgId, role: 'ai', text: '' }]);
      setChatLoading(true);
      if (!chatOpen) setChatUnread(true);
      let accumulated = '';
      fetchAIResponse(prompt, systemPrompt, chunk => {
        accumulated += chunk;
        setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: accumulated } : m));
      }).finally(() => setChatLoading(false));
    }
  }, [ls, ex, langName, chatOpen, addXp]);

  // ── continue to next ─────────────────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    if (!ls) return;
    if (isLastExercise || ls.hearts === 0) {
      if (topic) {
        const q = buildQuiz(topic, allWords, langName);
        setQuiz(q);
        setQuizScore(0);
        setScreen('quiz');
      } else {
        setScreen('results');
      }
      return;
    }
    const next = initExercise({ ...ls, idx: ls.idx + 1 });
    setLs(next);
    // Auto-focus input for type exercises
    if (ls.exercises[ls.idx + 1]?.kind === 'type') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [ls, isLastExercise, topic, allWords, langName]);

  // ── pairs tap ────────────────────────────────────────────────────────────────
  const handlePairsTap = useCallback((side: 'left' | 'right', value: string) => {
    if (!ls || !ex || ex.kind !== 'pairs') return;
    if (ls.pairsMatched.includes(value)) return;

    const sel = ls.pairsSelected;
    if (!sel) {
      setLs(prev => prev ? { ...prev, pairsSelected: { side, value } } : prev);
      return;
    }
    if (sel.side === side) {
      // Same side — just switch selection
      setLs(prev => prev ? { ...prev, pairsSelected: { side, value } } : prev);
      return;
    }

    // Check if this pair matches (target → english)
    const leftVal = side === 'left' ? value : sel.value;
    const rightVal = side === 'right' ? value : sel.value;
    const matched = ex.wordPairs.find(p => p.target === leftVal && p.english === rightVal);

    if (matched) {
      const newMatched = [...ls.pairsMatched, leftVal, rightVal];
      const allDone = newMatched.length === ex.wordPairs.length * 2;
      if (allDone) addXp(30);
      setLs(prev => prev ? {
        ...prev,
        pairsMatched: newMatched,
        pairsSelected: null,
        checked: allDone,
        correct: allDone ? true : null,
      } : prev);
    } else {
      setLs(prev => prev ? { ...prev, pairsSelected: null, pairsWrong: leftVal, hearts: Math.max(0, (prev.hearts - 1)) } : prev);
      setTimeout(() => setLs(prev => prev ? { ...prev, pairsWrong: null } : prev), 600);
    }
  }, [ls, ex, addXp]);

  const handleQuizCheck = useCallback(() => {
    if (!quiz) return;
    const q = quiz.questions[quiz.idx];
    const correct = quiz.selected === q.correct;
    const newScore = correct ? quiz.score + 1 : quiz.score;
    addXp(correct ? 15 : 0);
    setQuiz(prev => prev ? { ...prev, checked: true, correct, score: newScore } : prev);
  }, [quiz, addXp]);

  const handleQuizContinue = useCallback(() => {
    if (!quiz) return;
    const isLast = quiz.idx >= quiz.questions.length - 1;
    if (isLast) {
      setQuizScore(quiz.score);
      setScreen('results');
      return;
    }
    setQuiz(prev => prev ? { ...prev, idx: prev.idx + 1, selected: null, checked: false, correct: null } : prev);
  }, [quiz]);

  // ── chat send (text or pronunciation) ────────────────────────────────────────
  const handleChatSend = useCallback(async (text: string, isPronunciation: boolean) => {
    if (text === '__no_speech_api__') {
      const id = String(++chatMsgIdRef.current);
      setChatMessages(prev => [...prev, { id, role: 'ai', text: 'Speech recognition is not supported in this browser. Try Chrome or Edge.' }]);
      return;
    }

    const userMsgId = String(++chatMsgIdRef.current);
    const displayText = isPronunciation ? `🎤 "${text}"` : text;
    setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text: displayText }]);

    const currentWord = ex && ex.kind !== 'pairs'
      ? { target: (ex as MCExercise | TypeExercise).word.target, english: (ex as MCExercise | TypeExercise).word.english }
      : undefined;

    let prompt: string;
    let systemPrompt: string;

    if (isPronunciation && currentWord) {
      prompt = `The student tried to say "${currentWord.target}" (${currentWord.english}) in ${langName}. Speech recognition heard: "${text}". Was their pronunciation correct? Give a brief verdict and one tip if needed.`;
      systemPrompt = `You are Lumi, a ${langName} pronunciation coach. Be encouraging. Max 2 sentences. No markdown.`;
    } else if (isPronunciation) {
      prompt = `The student said: "${text}" in ${langName}. Comment on this in the context of the lesson.`;
      systemPrompt = `You are Lumi, a friendly ${langName} tutor. Max 2 sentences. No markdown.`;
    } else {
      prompt = text;
      systemPrompt = `You are Lumi, a friendly ${langName} tutor. Answer concisely (2-3 sentences max). No markdown. If asked about a word or phrase, give the ${langName} translation and a usage tip.`;
    }

    const aiMsgId = String(++chatMsgIdRef.current);
    setChatMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '' }]);
    setChatLoading(true);
    let accumulated = '';
    await fetchAIResponse(prompt, systemPrompt, chunk => {
      accumulated += chunk;
      setChatMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: accumulated } : m));
    });
    setChatLoading(false);
  }, [ex, langName]);

  // ── keyboard shortcut ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!ls || !ex) return;
      if (e.key === 'Enter') {
        if (ls.checked) handleContinue();
        else if (ex.kind === 'mc' && ls.selected !== null) handleCheck();
        else if (ex.kind === 'type' && ls.typed.trim()) handleCheck();
      }
      if (ex.kind === 'mc' && !ls.checked) {
        const n = parseInt(e.key);
        if (n >= 1 && n <= ex.options.length) setLs(prev => prev ? { ...prev, selected: n - 1 } : prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ls, ex, handleCheck, handleContinue]);

  // ── TopBar ─────────────────────────────────────────────────────────────────
  const TopBar = ({ onBack }: { onBack: () => void }) => (
    <div className="conv-topbar">
      <button className="conv-back-btn" onClick={onBack}>←</button>
      <div className="conv-course-info">
        <span>{course?.fromFlag} → {course?.toFlag}</span>
        <span className="conv-course-name">{topic ? `${topic.emoji} ${topic.title}` : `${langName} · Lumi`}</span>
      </div>
      <div className="conv-topbar-right">
        {user && (
          <div className="conv-level-chip" title={`${xp} XP`}>
            <Avatar avatarId={level.avatarId} color={level.color} size={26} />
            <div className="conv-level-bar-wrap">
              <div className="conv-level-bar-fill" style={{ width: `${pct}%`, background: level.color }} />
            </div>
          </div>
        )}
        <span className="conv-streak">🔥{streak}</span>
        <button className="conv-logout-btn" onClick={() => { window.speechSynthesis?.cancel(); logout(); }}>Logout</button>
      </div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // SCREENS
  // ═════════════════════════════════════════════════════════════════════════════

  // Loading state while auto-start kicks in
  if (screen === 'lesson' && !ls) return (
    <div className="conv-screen">
      <TopBar onBack={goBack} />
      <div className="conv-start-screen">
        <div className="conv-start-avatar"><Avatar avatarId="seedling" color="#7ecf6e" size={72} /></div>
        <p className="conv-start-desc">Loading lesson…</p>
      </div>
    </div>
  );

  // QUIZ
  if (screen === 'quiz' && quiz && topic) {
    const qex = quiz.questions[quiz.idx];
    const qProgress = quiz.idx / quiz.questions.length;
    const canCheck = !quiz.checked && quiz.selected !== null;
    const isLastQ = quiz.idx >= quiz.questions.length - 1;

    return (
      <div className="conv-screen">
        <TopBar onBack={() => setScreen('results')} />

        {/* Quiz header */}
        <div className="quiz-header">
          <span className="quiz-badge">🎯 Quiz Time!</span>
          <div className="dl-progress-track" style={{ flex: 1 }}>
            {Array.from({ length: quiz.questions.length }).map((_, i) => (
              <div key={i} className={`seg ${i < quiz.idx ? 'filled' : ''}`} style={i < quiz.idx ? { background: 'var(--amber)' } : undefined} />
            ))}
          </div>
          <span className="quiz-counter">{quiz.idx + 1}/{quiz.questions.length}</span>
        </div>

        <div className="dl-exercise-area">
          <p className="dl-instruction">{qex.instruction}</p>
          <div className="dl-prompt-card">
            <div className="dl-prompt-word">{qex.prompt}</div>
            {qex.promptSub && <div className="dl-prompt-hint">{qex.promptSub}</div>}
          </div>
          <div className="dl-options">
            {qex.options.map((opt, i) => (
              <button
                key={i}
                className={`dl-option ${quiz.selected === i ? 'selected' : ''} ${quiz.checked && i === qex.correct ? 'correct' : ''} ${quiz.checked && quiz.selected === i && i !== qex.correct ? 'wrong' : ''}`}
                onClick={() => !quiz.checked && setQuiz(prev => prev ? { ...prev, selected: i } : prev)}
                disabled={quiz.checked}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {quiz.checked && (
          <div className={`dl-feedback-banner ${quiz.correct ? 'correct' : 'wrong'}`}>
            <div className="dl-feedback-inner">
              <Avatar avatarId="seedling" color={quiz.correct ? '#7ecf6e' : '#FF4B4B'} size={36} />
              <div className="dl-feedback-text">
                {quiz.correct ? '✓ Correct!' : `✗ The answer is "${qex.options[qex.correct]}"`}
              </div>
            </div>
          </div>
        )}

        <div className={`dl-footer ${quiz.checked ? (quiz.correct ? 'correct' : 'wrong') : ''}`}>
          {quiz.checked ? (
            <button className="dl-continue-btn" onClick={handleQuizContinue}>
              {isLastQ ? 'See results →' : 'Next →'}
            </button>
          ) : (
            <button className="dl-check-btn" onClick={handleQuizCheck} disabled={!canCheck}>
              Check
            </button>
          )}
        </div>
      </div>
    );
  }

  // RESULTS
  if (screen === 'results' && ls && topic) {
    const totalEx = ls.exercises.filter(e => e.kind !== 'pairs').length;
    const pct100 = Math.round((ls.score / totalEx) * 100);
    return (
      <div className="conv-screen">
        <TopBar onBack={completeLesson} />
        <div className="results-screen dl-results">
          <div className="dl-results-icon">{pct100 === 100 ? '🏆' : pct100 >= 60 ? '⭐' : '💪'}</div>
          <h2 className="dl-results-title">Lesson complete!</h2>
          <div className="dl-results-stats">
            <div className="dl-stat"><span className="dl-stat-num">{ls.score}/{totalEx}</span><span className="dl-stat-lbl">Lesson</span></div>
            <div className="dl-stat"><span className="dl-stat-num">{quizScore}/5</span><span className="dl-stat-lbl">🎯 Quiz</span></div>
            <div className="dl-stat"><span className="dl-stat-num">{ls.hearts}⚡</span><span className="dl-stat-lbl">Energy</span></div>
          </div>
          <div className="dl-words-review">
            {topic.words.map((w, i) => (
              <div key={i} className="dl-word-row">
                {voiceOn && <button className="dl-word-play" onClick={() => speakWord(w.target, ttsLang)}>🔊</button>}
                <span className="dl-word-target">{w.target}</span>
                {w.hint && <span className="dl-word-hint">{w.hint}</span>}
                <span className="dl-word-en">= {w.english}</span>
              </div>
            ))}
          </div>
          <button className="dl-continue-btn" onClick={completeLesson}>
            {pct100 >= 60 ? 'Continue →' : 'Back to path →'}
          </button>
          <button className="conv-back-link" onClick={() => handleStartLesson(topic, mode)}>Practice again</button>
        </div>
      </div>
    );
  }

  // LESSON
  if (screen === 'lesson' && ls && ex) {
    const progress = ls.idx / total;
    const canCheck = !ls.checked && (
      (ex.kind === 'mc' && ls.selected !== null) ||
      (ex.kind === 'type' && ls.typed.trim().length > 0) ||
      (ex.kind === 'pairs' && ls.checked)
    );

    return (
      <div className="conv-screen">
        <TopBar onBack={goBack} />

        {/* Progress + energy */}
        <div className="dl-lesson-header">
          <div className="dl-progress-track">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={`seg ${i < ls.idx ? 'filled' : ''}`} />
            ))}
          </div>
          <div className="dl-hearts">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < ls.hearts ? 'heart-full' : 'heart-empty'}>⚡</span>
            ))}
          </div>
        </div>

        {/* Exercise card */}
        <div className="dl-exercise-area">
          <p className="dl-instruction">{ex.instruction}</p>

          {/* ── MULTIPLE CHOICE ── */}
          {ex.kind === 'mc' && (
            <>
              <div className="dl-prompt-card">
                <div className="dl-prompt-word">{ex.prompt}</div>
                {ex.promptSub && <div className="dl-prompt-hint">{ex.promptSub}</div>}
              </div>
              <div className="dl-options">
                {ex.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`dl-option ${ls.selected === i ? 'selected' : ''} ${ls.checked && i === ex.correct ? 'correct' : ''} ${ls.checked && ls.selected === i && i !== ex.correct ? 'wrong' : ''}`}
                    onClick={() => !ls.checked && setLs(prev => prev ? { ...prev, selected: i } : prev)}
                    disabled={ls.checked}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── TYPE IT ── */}
          {ex.kind === 'type' && (
            <>
              <div className="dl-prompt-card">
                <div className="dl-prompt-word">{ex.prompt}</div>
              </div>
              <div className="dl-type-area">
                <input
                  ref={inputRef}
                  className={`dl-type-input ${ls.checked ? (ls.correct ? 'correct' : 'wrong') : ''}`}
                  placeholder={`Type in ${langName}…`}
                  value={ls.typed}
                  onChange={e => !ls.checked && setLs(prev => prev ? { ...prev, typed: e.target.value } : prev)}
                  onKeyDown={e => e.key === 'Enter' && !ls.checked && ls.typed.trim() && handleCheck()}
                  disabled={ls.checked}
                  autoFocus
                />
                {ls.checked && !ls.correct && (
                  <div className="dl-correct-answer">Correct answer: <strong>{ex.answer}</strong>{ex.hint ? ` (${ex.hint})` : ''}</div>
                )}
              </div>
            </>
          )}

          {/* ── PAIRS ── */}
          {ex.kind === 'pairs' && (
            <div className="dl-pairs">
              <div className="dl-pairs-col">
                {ls.pairsLeft.map((left, i) => {
                  const matched = ls.pairsMatched.includes(left);
                  const sel = ls.pairsSelected?.side === 'left' && ls.pairsSelected.value === left;
                  const wrong = ls.pairsWrong === left;
                  return (
                    <button key={i} className={`dl-pair-btn ${matched ? 'matched' : ''} ${sel ? 'selected' : ''} ${wrong ? 'wrong' : ''}`}
                      onClick={() => !matched && handlePairsTap('left', left)} disabled={matched}>
                      {left}
                    </button>
                  );
                })}
              </div>
              <div className="dl-pairs-col">
                {ls.pairsRight.map((right, i) => {
                  const matched = ls.pairsMatched.includes(right);
                  const sel = ls.pairsSelected?.side === 'right' && ls.pairsSelected.value === right;
                  return (
                    <button key={i} className={`dl-pair-btn ${matched ? 'matched' : ''} ${sel ? 'selected' : ''}`}
                      onClick={() => !matched && handlePairsTap('right', right)} disabled={matched}>
                      {right}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer button */}
        <div className="dl-footer">
          {ls.checked ? (
            <button className="dl-continue-btn" onClick={handleContinue}>
              {isLastExercise || ls.hearts === 0 ? 'See results →' : 'Continue →'}
            </button>
          ) : (
            <button className="dl-check-btn" onClick={ex.kind === 'pairs' ? undefined : handleCheck}
              disabled={!canCheck || ex.kind === 'pairs'}>
              Check
            </button>
          )}
        </div>

        {/* Floating AI chat */}
        <AIChat
          isOpen={chatOpen}
          onToggle={() => { setChatOpen(o => !o); setChatUnread(false); }}
          messages={chatMessages}
          isLoading={chatLoading}
          unread={chatUnread}
          onSend={handleChatSend}
          ttsLang={ttsLang}
          currentWord={ex && ex.kind !== 'pairs' ? { target: (ex as MCExercise | TypeExercise).word.target, english: (ex as MCExercise | TypeExercise).word.english } : undefined}
          langName={langName}
        />
      </div>
    );
  }

  return null;
}
