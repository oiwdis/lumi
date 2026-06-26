import { useState } from 'react';

interface Props {
  onSave: (key: string) => void;
  onCancel: () => void;
}

export default function ApiKeyGate({ onSave, onCancel }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const key = value.trim();
    if (!key.startsWith('sk-ant-')) {
      setError('API key should start with sk-ant-');
      return;
    }
    localStorage.setItem('linguo-anthropic-key', key);
    onSave(key);
  };

  return (
    <div className="tutor-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="api-key-panel">
        <div className="tutor-header">
          <span>✨ Enable AI Tutor</span>
          <button className="tutor-close" onClick={onCancel}>✕</button>
        </div>
        <div className="api-key-body">
          <p>Enter your Anthropic API key to activate Lumi, your personal AI tutor.</p>
          <p className="api-key-note">Your key is stored only in your browser and never sent anywhere except directly to Anthropic.</p>
          <input
            className="api-key-input"
            type="password"
            placeholder="sk-ant-..."
            value={value}
            onChange={e => { setValue(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          {error && <p className="api-key-error">{error}</p>}
          <div className="api-key-actions">
            <button className="api-key-cancel" onClick={onCancel}>Cancel</button>
            <button className="api-key-save" onClick={handleSave} disabled={!value.trim()}>
              Save & open tutor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
