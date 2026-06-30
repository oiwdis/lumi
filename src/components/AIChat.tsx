import { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  isLoading: boolean;
  unread: boolean;
  onSend: (text: string, isPronunciation?: boolean) => void;
  ttsLang: string;
  currentWord?: { target: string; english: string; hint?: string };
  langName: string;
}

export default function AIChat({
  isOpen, onToggle, messages, isLoading, unread,
  onSend, ttsLang, currentWord, langName,
}: Props) {
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim(), false);
    setInput('');
  };

  const handleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      onSend('__no_speech_api__', false);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = ttsLang;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e: any) => {
      // try all alternatives for best match
      const transcript = e.results[0][0].transcript;
      setListening(false);
      onSend(transcript, true);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <>
      <button
        className={`chat-fab ${isOpen ? 'chat-fab--open' : ''}`}
        onClick={onToggle}
        title="Chat with Lumi"
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && unread && <span className="chat-fab-dot" />}
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-header-title">🌱 Lumi</span>
            {currentWord && (
              <span className="chat-header-hint">
                Tap 🎤 to practice <strong>{currentWord.target}</strong>
              </span>
            )}
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                Hi! I'm Lumi. Ask me anything about {langName}, or tap 🎤 to practice your pronunciation.
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`chat-msg chat-msg--${m.role}`}>
                {m.role === 'ai' && <span className="chat-msg-icon">🌱</span>}
                <div className="chat-msg-bubble">{m.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-msg chat-msg--ai">
                <span className="chat-msg-icon">🌱</span>
                <div className="chat-msg-bubble chat-msg-bubble--loading">
                  <span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <button
              className={`chat-mic-btn ${listening ? 'chat-mic-btn--active' : ''}`}
              onClick={handleMic}
              title={listening ? 'Stop' : 'Practice pronunciation'}
            >
              {listening ? '⏹' : '🎤'}
            </button>
            <input
              className="chat-input"
              placeholder={currentWord ? `Ask about "${currentWord.english}"…` : `Ask Lumi in ${langName}…`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>↑</button>
          </div>
        </div>
      )}
    </>
  );
}
