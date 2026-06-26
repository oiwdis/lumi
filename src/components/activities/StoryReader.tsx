import { useState } from 'react';
import type { Story, StorySegment } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  story: Story;
  courseId: string;
  onComplete: (xp: number, words: number) => void;
}

export default function StoryReader({ story, courseId, onComplete }: Props) {
  const { seeWord } = useAppStore();
  const [tooltip, setTooltip] = useState<{ seg: StorySegment; x: number; y: number } | null>(null);
  const [tappedWords, setTappedWords] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const handleTap = (seg: StorySegment, e: React.MouseEvent) => {
    if (!seg.translation || !seg.wordId) return;
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({ seg, x: rect.left + rect.width / 2, y: rect.top });
    if (!tappedWords.has(seg.wordId)) {
      setTappedWords(prev => new Set([...prev, seg.wordId!]));
      const vocabEntry = story.vocab[seg.wordId];
      seeWord(
        courseId as never,
        seg.wordId,
        seg.text,
        seg.translation,
        vocabEntry?.example ?? seg.text,
      );
    }
  };

  const handleFinish = () => {
    const xp = Math.max(10, 20 - tappedWords.size); // more XP for fewer lookups
    onComplete(xp, tappedWords.size);
  };

  return (
    <div className="story-reader" onClick={() => setTooltip(null)}>
      <div className="story-header">
        <div className="story-meta">
          <span className="story-emoji">{story.emoji}</span>
          <div>
            <h2 className="story-title">{story.title}</h2>
            <p className="story-title-trans">{story.titleTranslation}</p>
          </div>
          <span className="story-level">Lv {story.level}</span>
        </div>
        <p className="story-context">{story.context}</p>
        <div className="story-hint">
          <span>💡</span> Tap any highlighted word to see its meaning
        </div>
      </div>

      <div className="story-body">
        {story.paragraphs.map((para, pi) => (
          <p key={pi} className="story-para">
            {para.map((seg, si) => {
              if (!seg.translation) {
                return <span key={si}>{seg.text}</span>;
              }
              const isTapped = seg.wordId ? tappedWords.has(seg.wordId) : false;
              return (
                <span
                  key={si}
                  className={`story-word ${isTapped ? 'tapped' : 'tappable'}`}
                  onClick={e => handleTap(seg, e)}
                >
                  {seg.text}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      {/* Vocab tapped summary */}
      {tappedWords.size > 0 && (
        <div className="tapped-summary">
          <span className="tapped-count">📖 {tappedWords.size} word{tappedWords.size !== 1 ? 's' : ''} looked up</span>
        </div>
      )}

      {!finished ? (
        <button className="primary-btn" onClick={() => setFinished(true)}>
          I've finished reading →
        </button>
      ) : (
        <div className="story-reflection">
          <p className="reflection-q">How much did you understand?</p>
          <div className="reflection-opts">
            {[
              { label: 'Most of it', sub: '90%+', xp: 20, q: 5 },
              { label: 'About half', sub: '~50%', xp: 15, q: 3 },
              { label: 'Very little', sub: '<30%', xp: 10, q: 1 },
            ].map(opt => (
              <button key={opt.label} className="reflection-btn" onClick={() => handleFinish()}>
                <span className="refl-label">{opt.label}</span>
                <span className="refl-sub">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Word tooltip */}
      {tooltip && (
        <div
          className="word-tooltip"
          style={{ left: Math.min(tooltip.x, window.innerWidth - 200), top: Math.max(tooltip.y - 80, 10) }}
          onClick={e => e.stopPropagation()}
        >
          <div className="tooltip-word">{tooltip.seg.text}</div>
          <div className="tooltip-translation">{tooltip.seg.translation}</div>
          {tooltip.seg.wordId && story.vocab[tooltip.seg.wordId] && (
            <div className="tooltip-example">{story.vocab[tooltip.seg.wordId].example}</div>
          )}
        </div>
      )}
    </div>
  );
}
