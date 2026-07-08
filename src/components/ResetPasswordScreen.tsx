import { useState } from 'react';

interface Props { token: string; onDone: () => void; }

export default function ResetPasswordScreen({ token, onDone }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError('');
    if (!password) { setError('Please enter a new password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
      setDone(true);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-hero">
        <span className="login-owl">🌱</span>
        <h1 className="login-title">Lumi</h1>
        <p className="login-sub">AI-powered language learning</p>
      </div>

      <div className="login-card">
        {done ? (
          <>
            <p className="login-success">✅ Password updated! You can now log in.</p>
            <button className="login-submit" onClick={onDone}>Go to log in</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>Choose a new password for your account.</p>
            <div className="login-fields">
              <input className="login-input" placeholder="New password" type="password"
                value={password} onChange={e => setPassword(e.target.value)} autoFocus />
              <input className="login-input" placeholder="Confirm password" type="password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="login-submit" onClick={submit} disabled={loading}>
              {loading ? 'Updating…' : 'Set new password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
