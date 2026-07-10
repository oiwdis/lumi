import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { COURSES } from '../data';
import { TOPICS, type Topic, type Word } from '../data/lessonWords';
import { LESSON_UNITS } from '../data/lessonPath';
import { getLevelForXp, xpProgressInLevel } from '../lib/levels';
import Avatar from './Avatar';
import AIChat, { type ChatMessage } from './AIChat';

// ── types ─────────────────────────────────────────────────────────────────────

const TTS_LANG: Record<string, string> = {
  'en-es': 'es-ES', 'en-zh': 'zh-CN', 'en-fr': 'fr-FR', 'en-ja': 'ja-JP', 'en-ko': 'ko-KR', 'en-de': 'de-DE',
};
const LANG_NAME: Record<string, string> = {
  'en-es': 'Spanish', 'en-zh': 'Chinese', 'en-fr': 'French', 'en-ja': 'Japanese', 'en-ko': 'Korean', 'en-de': 'German',
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
interface FlashExercise {
  kind: 'flash';
  words: Word[];
}
type Exercise = MCExercise | TypeExercise | PairsExercise | FlashExercise;

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

  // Flashcard intro — always first
  ex.push({ kind: 'flash', words });

  // Pairs exercise — second
  const pairWords = shuffle(words).slice(0, 4);
  ex.push({ kind: 'pairs', instruction: 'Tap the matching pairs', wordPairs: pairWords });

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

  // Keep flash + pairs first, shuffle the rest
  return [ex[0], ex[1], ...shuffle(ex.slice(2))];
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
  // flash state
  flashIdx: number;              // current card index in flash intro
}

function initLesson(topic: Topic, pool: Word[], langName: string): LessonState {
  const exercises = buildExercises(topic, pool, langName);
  return {
    exercises, idx: 0, hearts: 3, score: 0,
    selected: null, typed: '', checked: false, correct: null,
    pairsLeft: [], pairsRight: [], pairsSelected: null, pairsMatched: [], pairsWrong: null,
    flashIdx: 0,
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
  return { ...ls, selected: null, typed: '', checked: false, correct: null, pairsLeft, pairsRight, pairsSelected: null, pairsMatched: [], pairsWrong: null, flashIdx: 0 };
}

function buildUnitQuiz(unitWords: Word[], pool: Word[], langName: string): QuizState {
  const selected = shuffle(unitWords).slice(0, 10);
  const questions: MCExercise[] = selected.map(word => {
    const recognize = Math.random() > 0.5;
    if (recognize) {
      const opts = shuffle([word.english, ...distractors(word, pool, 'english')]);
      return { kind: 'mc' as const, instruction: `What does "${word.target}" mean?`, prompt: word.target, promptSub: word.hint, options: opts, correct: opts.indexOf(word.english), word };
    } else {
      const opts = shuffle([word.target, ...distractors(word, pool, 'target')]);
      return { kind: 'mc' as const, instruction: `How do you say "${word.english}"?`, prompt: word.english, options: opts, correct: opts.indexOf(word.target), word };
    }
  });
  return { questions, idx: 0, score: 0, selected: null, checked: false, correct: null };
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
  const { selectedCourse, currentLessonId, user, xp, streak, customLessons, wordStats, theme, addXp, recordAnswer, goBack, completeLesson, logout, toggleTheme } = useAppStore();
  const usesCharPicker = selectedCourse === 'en-zh' || selectedCourse === 'en-ja' || selectedCourse === 'en-ko';
  const showReadings = selectedCourse === 'en-zh' || selectedCourse === 'en-ja' || selectedCourse === 'en-ko';

  const course = selectedCourse ? COURSES.find(c => c.id === selectedCourse) : null;
  const ttsLang = selectedCourse ? TTS_LANG[selectedCourse] : 'es-ES';
  const langName = selectedCourse ? LANG_NAME[selectedCourse] : 'Spanish';
  const staticTopics = selectedCourse ? (TOPICS[selectedCourse] ?? []) : [];

  // Build a unified topic list: custom lessons take priority over static topics
  const customUnits = selectedCourse ? (customLessons[selectedCourse] ?? null) : null;
  const topics: Topic[] = customUnits
    ? customUnits.flatMap(u => u.lessons.map(l => ({ id: l.id, emoji: l.emoji ?? '📚', title: l.title, words: l.words })))
    : staticTopics;

  // Look up the current lesson's topic (custom lessons use their id directly, static use topicId)
  const effectiveLessonId = currentLessonId?.startsWith('custom:') ? currentLessonId.replace('custom:', '') : currentLessonId;
  const currentTopic = effectiveLessonId
    ? topics.find(t => t.id === effectiveLessonId) ?? null
    : null;

  const rawUnits = customUnits
    ? customUnits
    : (LESSON_UNITS as Array<{ id: string; lessons: Array<{ id: string }> }>);
  const currentUnit = effectiveLessonId
    ? rawUnits.find(u => u.lessons.some((l: { id: string }) => l.id === effectiveLessonId)) ?? null
    : null;
  const isLastInUnit = currentUnit != null
    && currentUnit.lessons[currentUnit.lessons.length - 1].id === effectiveLessonId;
  const unitWords: Word[] = customUnits && currentUnit
    ? (currentUnit as typeof customUnits[number]).lessons.flatMap(l => l.words ?? [])
    : (currentTopic?.words ?? []);

  const [screen, setScreen] = useState<'lesson' | 'quiz' | 'results' | 'unit-quiz' | 'unit-results'>('lesson');
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [unitQuiz, setUnitQuiz] = useState<QuizState | null>(null);
  const [unitQuizScore, setUnitQuizScore] = useState(0);
  const [mode] = useState<Mode>('silent');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [ls, setLs] = useState<LessonState | null>(null);

  // Pronunciation state
  const [pronouncing, setPronouncing] = useState(false);
  const [pronounceRating, setPronounceRating] = useState<{ label: string; color: string } | null>(null);

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

  // Sort words by SRS priority: overdue words first, then new words, then recently seen
  const sortBySrs = (words: Word[]): Word[] => {
    const now = Date.now();
    return [...words].sort((a, b) => {
      const ka = `${selectedCourse}:${a.target}`;
      const kb = `${selectedCourse}:${b.target}`;
      const sa = wordStats[ka];
      const sb = wordStats[kb];
      // Never seen = highest priority (treat as maximally overdue)
      const dueA = sa ? sa.nextDue : 0;
      const dueB = sb ? sb.nextDue : 0;
      return (dueA - now) - (dueB - now); // most overdue first
    });
  };

  // Look up pinyin/romaji for a target string (used to annotate MC options and pairs)
  const getReading = (target: string): string | undefined => {
    if (!showReadings) return undefined;
    const w = allWords.find(w => w.target === target);
    return w?.reading ?? w?.hint;
  };
  // Characters available in the picker — unique chars from all lesson target words
  const pickerChars = usesCharPicker
    ? [...new Set(allWords.flatMap(w => [...w.target]))]
    : [];

  const ex = ls ? ls.exercises[ls.idx] : null;
  const total = ls ? ls.exercises.length : 1;
  const isLastExercise = ls ? ls.idx >= ls.exercises.length - 1 : false;

  // ── start lesson ────────────────────────────────────────────────────────────
  const handleStartLesson = useCallback((t: Topic, m: Mode) => {
    const srsWords = sortBySrs(t.words);
    const state = initLesson({ ...t, words: srsWords }, allWords, langName);
    setTopic(t);
    setLs(initExercise(state));
    setChatMessages([]);
    setScreen('lesson');
  }, [allWords, langName, sortBySrs]);

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
    const xpAmt = correct ? 20 : 5;
    addXp(xpAmt);

    // Record answer for spaced repetition
    const word = (ex as MCExercise | TypeExercise).word;
    if (word && selectedCourse) recordAnswer(selectedCourse, word.target, correct);
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
    setPronounceRating(null);
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
      if (allDone) { addXp(30); }
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
    const addAiMsg = (msg: string) => {
      const id = String(++chatMsgIdRef.current);
      setChatMessages(prev => [...prev, { id, role: 'ai', text: msg }]);
    };

    if (text === '__no_speech_api__') {
      addAiMsg('Speech recognition isn\'t available in this browser. Try Chrome or Edge on desktop.');
      return;
    }
    if (text === '__mic_nomatch__') {
      addAiMsg('I couldn\'t hear anything. Make sure your microphone is allowed, then tap 🎤 and speak clearly.');
      return;
    }
    if (text.startsWith('__mic_error__:')) {
      const code = text.split(':')[1];
      if (code === 'not-allowed') {
        addAiMsg('Microphone access was blocked. Allow microphone permission in your browser settings and try again.');
      } else {
        addAiMsg(`Microphone error (${code}). Check that your mic is connected and permitted, then try again.`);
      }
      return;
    }

    const userMsgId = String(++chatMsgIdRef.current);
    const displayText = isPronunciation ? `🎤 "${text}"` : text;
    setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text: displayText }]);

    const currentWord = ex && ex.kind !== 'pairs' && ex.kind !== 'flash'
      ? { target: (ex as MCExercise | TypeExercise).word.target, english: (ex as MCExercise | TypeExercise).word.english }
      : undefined;

    // Build lesson context so the AI always knows what's being studied
    const lessonContext = topic
      ? `The student is on the "${topic.title}" lesson (${topic.emoji}), learning ${langName} vocabulary. ` +
        `The words in this lesson are: ${topic.words.map(w => `"${w.target}" (${w.english})${w.hint ? ` [${w.hint}]` : ''}`).join(', ')}. ` +
        (currentWord ? `They are currently practising the word "${currentWord.target}" (${currentWord.english}). ` : '') +
        (ex ? `Exercise type: ${ex.kind === 'mc' ? 'multiple choice' : ex.kind === 'type' ? 'type the answer' : 'match pairs'}. ` : '')
      : `The student is learning ${langName}. `;

    let prompt: string;
    let systemPrompt: string;

    if (isPronunciation && currentWord) {
      prompt = `The student tried to say "${currentWord.target}" (${currentWord.english}). Speech recognition heard: "${text}". Judge whether this sounds close to the correct ${langName} pronunciation. Give a clear verdict (correct / close / needs work) and one short tip.`;
      systemPrompt = `You are Lumi, a ${langName} tutor. ${lessonContext}Max 2 sentences. No markdown. Be warm and specific.`;
    } else if (isPronunciation) {
      prompt = `The student spoke and speech recognition heard: "${text}". Respond helpfully.`;
      systemPrompt = `You are Lumi, a ${langName} tutor. ${lessonContext}Max 2 sentences. No markdown.`;
    } else {
      prompt = text;
      systemPrompt = `You are Lumi, a friendly ${langName} tutor. ${lessonContext}Answer concisely (2-3 sentences). No markdown. Reference the current lesson words when relevant.`;
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

  // ── pronunciation tap ─────────────────────────────────────────────────────────
  const handlePronounce = useCallback((targetWord: string) => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPronounceRating({ label: 'Speech not supported in this browser', color: '#888' });
      return;
    }
    setPronouncing(true);
    setPronounceRating(null);
    // Speak the word first so user knows what to say
    speakWord(targetWord, ttsLang);
    setTimeout(() => {
      const rec = new (SpeechRecognition as new () => SpeechRecognition)();
      rec.lang = ttsLang;
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      rec.onresult = (e: SpeechRecognitionEvent) => {
        const heard = e.results[0][0].transcript.trim().toLowerCase();
        const target = targetWord.toLowerCase();
        const confidence = e.results[0][0].confidence;
        // Simple similarity: check if heard matches or is close
        const normalize = (s: string) => s.replace(/[^\w\s]/g, '').trim();
        const match = normalize(heard) === normalize(target);
        const partial = normalize(target).includes(normalize(heard)) || normalize(heard).includes(normalize(target));
        let rating: { label: string; color: string };
        if (match || (confidence > 0.85 && partial)) {
          rating = { label: '✅ Perfect!', color: 'var(--emerald, #22c55e)' };
        } else if (partial || confidence > 0.6) {
          rating = { label: '🟡 Close — keep practicing', color: '#f59e0b' };
        } else {
          rating = { label: '🔴 Try again — listen first', color: '#ef4444' };
        }
        setPronounceRating(rating);
        setPronouncing(false);
      };
      rec.onerror = () => { setPronounceRating({ label: '❌ Mic error — check permissions', color: '#888' }); setPronouncing(false); };
      rec.onnomatch = () => { setPronounceRating({ label: "Couldn't hear that — try again", color: '#888' }); setPronouncing(false); };
      rec.start();
    }, 800);
  }, [ttsLang]);

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
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
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
  if (screen === 'quiz') {
    if (!quiz || !topic) {
      // State not ready yet — snap to results rather than going blank
      return (
        <div className="conv-screen">
          <TopBar onBack={completeLesson} />
          <div className="dl-results" style={{ flex: 1 }}>
            <div className="dl-results-icon">⭐</div>
            <h2 className="dl-results-title">Lesson complete!</h2>
            <button className="dl-continue-btn" onClick={completeLesson} style={{ marginTop: 24 }}>Continue →</button>
          </div>
        </div>
      );
    }
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
            {showReadings && (qex.word?.reading || qex.word?.hint) && (
              <div className="dl-prompt-reading">{qex.word.reading ?? qex.word.hint}</div>
            )}
          </div>
          <div className="dl-options">
            {qex.options.map((opt, i) => {
              const reading = getReading(opt);
              return (
                <button
                  key={i}
                  className={`dl-option ${quiz.selected === i ? 'selected' : ''} ${quiz.checked && i === qex.correct ? 'correct' : ''} ${quiz.checked && quiz.selected === i && i !== qex.correct ? 'wrong' : ''}`}
                  onClick={() => !quiz.checked && setQuiz(prev => prev ? { ...prev, selected: i } : prev)}
                  disabled={quiz.checked}
                >
                  {opt}
                  {reading && <span className="dl-option-reading">{reading}</span>}
                </button>
              );
            })}
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

  // UNIT QUIZ
  if (screen === 'unit-quiz') {
    if (!unitQuiz) { completeLesson(); return null; }
    const qex = unitQuiz.questions[unitQuiz.idx];
    const canCheck = !unitQuiz.checked && unitQuiz.selected !== null;
    const isLastQ = unitQuiz.idx >= unitQuiz.questions.length - 1;
    return (
      <div className="conv-screen">
        <TopBar onBack={completeLesson} />
        <div className="quiz-header">
          <span className="quiz-badge" style={{ background: 'var(--amber)' }}>🏆 Unit Quiz!</span>
          <div className="dl-progress-track">
            {Array.from({ length: unitQuiz.questions.length }).map((_, i) => (
              <div key={i} className={`seg ${i < unitQuiz.idx ? 'filled' : ''}`} style={i < unitQuiz.idx ? { background: 'var(--amber)' } : undefined} />
            ))}
          </div>
          <span className="quiz-counter">{unitQuiz.idx + 1}/{unitQuiz.questions.length}</span>
        </div>
        <div className="dl-exercise-area">
          <p className="dl-instruction">{qex.instruction}</p>
          <div className="dl-prompt-card">
            <div className="dl-prompt-word">{qex.prompt}</div>
            {qex.promptSub && <div className="dl-prompt-hint">{qex.promptSub}</div>}
          </div>
          <div className="dl-options">
            {qex.options.map((opt, i) => (
              <button key={i}
                className={`dl-option ${unitQuiz.selected === i ? 'selected' : ''} ${unitQuiz.checked && i === qex.correct ? 'correct' : ''} ${unitQuiz.checked && unitQuiz.selected === i && i !== qex.correct ? 'wrong' : ''}`}
                onClick={() => !unitQuiz.checked && setUnitQuiz(prev => prev ? { ...prev, selected: i } : prev)}
                disabled={unitQuiz.checked}
              >{opt}</button>
            ))}
          </div>
        </div>
        {unitQuiz.checked && (
          <div className={`dl-feedback-banner ${unitQuiz.correct ? 'correct' : 'wrong'}`}>
            <div className="dl-feedback-inner">
              <Avatar avatarId="seedling" color={unitQuiz.correct ? '#7ecf6e' : '#FF4B4B'} size={36} />
              <span>{unitQuiz.correct ? '✓ Correct!' : `✗ The answer is "${qex.options[qex.correct]}"`}</span>
            </div>
          </div>
        )}
        <div className={`dl-footer ${unitQuiz.checked ? (unitQuiz.correct ? 'correct' : 'wrong') : ''}`}>
          {unitQuiz.checked ? (
            <button className="dl-continue-btn" onClick={() => {
              if (isLastQ) {
                setUnitQuizScore(unitQuiz.score);
                setScreen('unit-results');
              } else {
                setUnitQuiz(prev => prev ? { ...prev, idx: prev.idx + 1, selected: null, checked: false, correct: null } : prev);
              }
            }}>{isLastQ ? 'See results →' : 'Next →'}</button>
          ) : (
            <button className="dl-check-btn" onClick={() => {
              if (!unitQuiz || unitQuiz.selected === null) return;
              const correct = unitQuiz.selected === unitQuiz.questions[unitQuiz.idx].correct;
              setUnitQuiz(prev => prev ? { ...prev, checked: true, correct, score: correct ? prev.score + 1 : prev.score } : prev);
              addXp(correct ? 15 : 3);
            }} disabled={!canCheck}>Check</button>
          )}
        </div>
      </div>
    );
  }

  // UNIT RESULTS
  if (screen === 'unit-results') {
    const total = unitQuiz?.questions.length ?? 0;
    const pct = total > 0 ? Math.round((unitQuizScore / total) * 100) : 0;
    return (
      <div className="conv-screen">
        <TopBar onBack={completeLesson} />
        <div className="results-screen dl-results">
          <div className="dl-results-icon">{pct === 100 ? '🏆' : pct >= 60 ? '⭐' : '💪'}</div>
          <h2 className="dl-results-title">Unit Complete!</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 16, textAlign: 'center' }}>You scored {unitQuizScore}/{total} on the unit quiz</p>
          <div className="dl-results-stats">
            <div className="dl-stat"><span className="dl-stat-num">{unitQuizScore}/{total}</span><span className="dl-stat-lbl">Unit Quiz</span></div>
            <div className="dl-stat"><span className="dl-stat-num">{pct}%</span><span className="dl-stat-lbl">Score</span></div>
          </div>
          <button className="dl-continue-btn" style={{ marginTop: 24 }} onClick={completeLesson}>Back to lessons →</button>
        </div>
      </div>
    );
  }

  // RESULTS
  if (screen === 'results') {
    const totalEx = ls ? ls.exercises.filter(e => e.kind !== 'pairs').length : 1;
    const score = ls ? ls.score : 0;
    const hearts = ls ? ls.hearts : 0;
    const pct100 = Math.round((score / totalEx) * 100);
    return (
      <div className="conv-screen">
        <TopBar onBack={completeLesson} />
        <div className="results-screen dl-results">
          <div className="dl-results-icon">{pct100 === 100 ? '🏆' : pct100 >= 60 ? '⭐' : '💪'}</div>
          <h2 className="dl-results-title">Lesson complete!</h2>
          <div className="dl-results-stats">
            <div className="dl-stat"><span className="dl-stat-num">{score}/{totalEx}</span><span className="dl-stat-lbl">Lesson</span></div>
            <div className="dl-stat"><span className="dl-stat-num">{quizScore}/5</span><span className="dl-stat-lbl">🎯 Quiz</span></div>
            <div className="dl-stat"><span className="dl-stat-num">{hearts}⚡</span><span className="dl-stat-lbl">Energy</span></div>
          </div>
          {topic && (
            <div className="dl-words-review">
              {topic.words.map((w, i) => (
                <div key={i} className="dl-word-row">
                  <span className="dl-word-target">{w.target}</span>
                  {w.hint && <span className="dl-word-hint">{w.hint}</span>}
                  <span className="dl-word-en">= {w.english}</span>
                </div>
              ))}
            </div>
          )}
          <button className="dl-continue-btn" onClick={() => {
            if (isLastInUnit && unitWords.length >= 4) {
              const q = buildUnitQuiz(unitWords, allWords, langName);
              setUnitQuiz(q);
              setUnitQuizScore(0);
              setScreen('unit-quiz');
            } else {
              completeLesson();
            }
          }}>
            {isLastInUnit && unitWords.length >= 4 ? 'Unit Quiz →' : (pct100 >= 60 ? 'Continue →' : 'Back to path →')}
          </button>
          {topic && ls && (
            <button className="conv-back-link" onClick={() => handleStartLesson(topic, mode)}>Practice again</button>
          )}
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
          <span className="dl-progress-count">{ls.idx + 1}/{total}</span>
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
                {showReadings && (ex.word?.reading || ex.word?.hint) && (
                  <div className="dl-prompt-reading">{ex.word.reading ?? ex.word.hint}</div>
                )}
                <button
                  className={`dl-speak-btn ${pronouncing ? 'dl-speak-btn--active' : ''}`}
                  onClick={() => handlePronounce(ex.word?.target ?? ex.prompt)}
                  title="Tap to practice pronunciation"
                >
                  {pronouncing ? '🎙️ Listening…' : '🎤 Speak'}
                </button>
                {pronounceRating && (
                  <div className="dl-pronounce-rating" style={{ color: pronounceRating.color }}>
                    {pronounceRating.label}
                  </div>
                )}
              </div>
              <div className="dl-options">
                {ex.options.map((opt, i) => {
                  const reading = getReading(opt);
                  return (
                    <button
                      key={i}
                      className={`dl-option ${ls.selected === i ? 'selected' : ''} ${ls.checked && i === ex.correct ? 'correct' : ''} ${ls.checked && ls.selected === i && i !== ex.correct ? 'wrong' : ''}`}
                      onClick={() => !ls.checked && setLs(prev => prev ? { ...prev, selected: i } : prev)}
                      disabled={ls.checked}
                    >
                      {opt}
                      {reading && <span className="dl-option-reading">{reading}</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── TYPE IT ── */}
          {ex.kind === 'type' && (
            <>
              <div className="dl-prompt-card">
                <div className="dl-prompt-word">{ex.prompt}</div>
                {showReadings && (ex.word?.reading || ex.word?.hint) && (
                  <div className="dl-prompt-reading">{ex.word.reading ?? ex.word.hint}</div>
                )}
              </div>
              <div className="dl-type-area">
                <input
                  ref={inputRef}
                  className={`dl-type-input ${ls.checked ? (ls.correct ? 'correct' : 'wrong') : ''}`}
                  placeholder={usesCharPicker ? `Tap characters below…` : `Type in ${langName}…`}
                  value={ls.typed}
                  onChange={e => !ls.checked && setLs(prev => prev ? { ...prev, typed: e.target.value } : prev)}
                  onKeyDown={e => e.key === 'Enter' && !ls.checked && ls.typed.trim() && handleCheck()}
                  disabled={ls.checked}
                  autoFocus={!usesCharPicker}
                  readOnly={usesCharPicker}
                />
                {ls.checked && !ls.correct && (
                  <div className="dl-correct-answer">
                    Correct: <strong>{ex.answer}</strong>
                    {showReadings && (ex.word?.reading || ex.word?.hint)
                      ? <span className="dl-correct-reading"> {ex.word.reading ?? ex.word.hint}</span>
                      : ex.hint ? ` (${ex.hint})` : ''}
                  </div>
                )}
              </div>
              {usesCharPicker && !ls.checked && (
                <div className="char-picker">
                  <div className="char-picker-grid">
                    {pickerChars.map((ch, i) => (
                      <button
                        key={i}
                        className="char-picker-btn"
                        onClick={() => setLs(prev => prev ? { ...prev, typed: prev.typed + ch } : prev)}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                  <button
                    className="char-picker-back"
                    onClick={() => setLs(prev => prev ? { ...prev, typed: prev.typed.slice(0, -1) } : prev)}
                  >
                    ⌫
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── FLASH CARDS ── */}
          {ex.kind === 'flash' && (() => {
            const card = ex.words[ls.flashIdx];
            const reading = showReadings ? (card.reading ?? card.hint) : undefined;
            const isLast = ls.flashIdx >= ex.words.length - 1;
            return (
              <div className="flash-wrap">
                <div className="flash-dots">
                  {ex.words.map((_, i) => (
                    <span key={i} className={`flash-dot ${i === ls.flashIdx ? 'flash-dot--active' : i < ls.flashIdx ? 'flash-dot--done' : ''}`} />
                  ))}
                </div>
                <div className="flash-card">
                  <div className="flash-target">{card.target}</div>
                  {reading && <div className="flash-reading">{reading}</div>}
                  <div className="flash-divider" />
                  <div className="flash-english">{card.english}</div>
                  <button className="flash-speak-btn" onClick={() => speakWord(card.target, ttsLang)} title="Hear pronunciation">
                    🔊
                  </button>
                </div>
                <button
                  className="dl-continue-btn"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    if (isLast) {
                      handleContinue();
                    } else {
                      setLs(prev => prev ? { ...prev, flashIdx: prev.flashIdx + 1 } : prev);
                    }
                  }}
                >
                  {isLast ? 'Start lesson →' : 'Next →'}
                </button>
              </div>
            );
          })()}

          {/* ── PAIRS ── */}
          {ex.kind === 'pairs' && (
            <div className="dl-pairs">
              <div className="dl-pairs-col">
                {ls.pairsLeft.map((left, i) => {
                  const matched = ls.pairsMatched.includes(left);
                  const sel = ls.pairsSelected?.side === 'left' && ls.pairsSelected.value === left;
                  const wrong = ls.pairsWrong === left;
                  const reading = getReading(left);
                  return (
                    <button key={i} className={`dl-pair-btn ${matched ? 'matched' : ''} ${sel ? 'selected' : ''} ${wrong ? 'wrong' : ''}`}
                      onClick={() => !matched && handlePairsTap('left', left)} disabled={matched}>
                      {left}
                      {reading && <span className="dl-pair-reading">{reading}</span>}
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

        {/* Footer button — hidden during flash (it has its own inline button) */}
        <div className="dl-footer">
          {ex.kind === 'flash' ? null : ls.checked ? (
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
          currentWord={ex && ex.kind !== 'pairs' && ex.kind !== 'flash' ? { target: (ex as MCExercise | TypeExercise).word.target, english: (ex as MCExercise | TypeExercise).word.english } : undefined}
          langName={langName}
        />
      </div>
    );
  }

  // Catch-all — should never reach here, but prevents blank screen
  return (
    <div className="conv-screen">
      <TopBar onBack={goBack} />
      <div className="dl-results" style={{ flex: 1 }}>
        <div className="dl-results-icon">🌱</div>
        <h2 className="dl-results-title">Something went wrong</h2>
        <button className="dl-continue-btn" onClick={goBack} style={{ marginTop: 24 }}>← Back to lessons</button>
      </div>
    </div>
  );
}
