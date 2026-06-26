import { useState, useRef, useEffect } from 'react';
import { streamTutorMessage, type TutorContext } from '../lib/tutorApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  ctx: TutorContext;
  onClose: () => void;
}

export default function TutorChat({ ctx, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setStreaming(true);
    setStreamingText('');

    let accumulated = '';
    await streamTutorMessage(
      ctx,
      newMessages,
      chunk => {
        accumulated += chunk;
        setStreamingText(accumulated);
      },
      () => {
        setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
        setStreamingText('');
        setStreaming(false);
      },
      err => {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err}` }]);
        setStreamingText('');
        setStreaming(false);
      },
    );
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const suggestionsForActivity = (): string[] => {
    switch (ctx.activityType) {
      case 'vocab-intro':
        return ctx.currentWord
          ? [`How do I remember "${ctx.currentWord.word}"?`, 'Give me another example sentence', 'How is this pronounced?']
          : [];
      case 'recall':
        return ['Give me a hint', 'Explain why this word means that', 'How do I use this in a sentence?'];
      case 'story':
        return ['Explain this sentence', 'What does this word mean in context?', 'Summarize the story so far'];
      case 'comprehension':
        return ['Give me a hint', 'Explain the question', 'What should I look for?'];
      default:
        return ['Help me understand this', 'Give me a tip'];
    }
  };

  const suggestions = suggestionsForActivity();

  return (
    <div className="tutor-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tutor-panel">
        <div className="tutor-header">
          <span>✨ Lumi — AI Tutor</span>
          <button className="tutor-close" onClick={onClose}>✕</button>
        </div>

        <div className="tutor-messages">
          {messages.length === 0 && !streaming && (
            <div className="tutor-welcome">
              <p>Hi! I'm Lumi, your AI tutor. Ask me anything about this lesson — vocabulary, pronunciation, grammar, or just a hint!</p>
              {suggestions.length > 0 && (
                <div className="tutor-suggestions">
                  {suggestions.map(s => (
                    <button key={s} className="tutor-suggestion" onClick={() => setInput(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`tutor-msg tutor-msg--${m.role}`}>
              {m.role === 'assistant' && <span className="tutor-avatar">✨</span>}
              <div className="tutor-bubble">{m.content}</div>
            </div>
          ))}

          {streaming && streamingText && (
            <div className="tutor-msg tutor-msg--assistant">
              <span className="tutor-avatar">✨</span>
              <div className="tutor-bubble tutor-bubble--streaming">{streamingText}<span className="tutor-cursor" /></div>
            </div>
          )}

          {streaming && !streamingText && (
            <div className="tutor-msg tutor-msg--assistant">
              <span className="tutor-avatar">✨</span>
              <div className="tutor-bubble tutor-bubble--streaming tutor-thinking">thinking<span className="tutor-dots">...</span></div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="tutor-input-row">
          <input
            ref={inputRef}
            className="tutor-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Lumi anything…"
            disabled={streaming}
          />
          <button
            className="tutor-send"
            onClick={send}
            disabled={!input.trim() || streaming}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
