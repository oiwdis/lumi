import { useState } from 'react';

interface User { id: string; name: string; email: string; }
interface Props { onAuth: (user: User, token: string) => void; }

type View = 'auth' | 'forgot' | 'forgot-sent';

export default function LoginScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [view, setView] = useState<View>('auth');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your name'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }

    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = mode === 'signup' ? { name, email, password } : { email, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
      localStorage.setItem('lumi-token', data.token);
      onAuth(data.user, data.token);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendReset = async () => {
    setError('');
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
      setView('forgot-sent');
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') view === 'forgot' ? sendReset() : submit();
  };

  if (view === 'forgot' || view === 'forgot-sent') {
    return (
      <div className="login-screen">
        <div className="login-hero">
          <span className="login-owl">🌱</span>
          <h1 className="login-title">Lumi</h1>
          <p className="login-sub">AI-powered language learning</p>
        </div>
        <div className="login-card">
          {view === 'forgot-sent' ? (
            <>
              <p className="login-success">✅ Check your email — we sent a reset link to <strong>{email}</strong></p>
              <button className="login-submit" onClick={() => { setView('auth'); setError(''); }}>Back to log in</button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>Enter your email and we'll send you a link to reset your password.</p>
              <div className="login-fields">
                <input className="login-input" placeholder="Email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} autoFocus />
              </div>
              {error && <div className="login-error">{error}</div>}
              <button className="login-submit" onClick={sendReset} disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <button className="login-forgot" onClick={() => { setView('auth'); setError(''); }}>← Back to log in</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-hero">
        <span className="login-owl">🌱</span>
        <h1 className="login-title">Lumi</h1>
        <p className="login-sub">AI-powered language learning</p>
      </div>

      <div className="login-card">
        <div className="login-tabs">
          <button className={`login-tab ${mode === 'login' ? 'login-tab--active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Log in</button>
          <button className={`login-tab ${mode === 'signup' ? 'login-tab--active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>Sign up</button>
        </div>

        <div className="login-fields">
          {mode === 'signup' && (
            <input className="login-input" placeholder="Your name" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={handleKey} autoFocus />
          )}
          <input className="login-input" placeholder="Email" type="email" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} autoFocus={mode === 'login'} />
          <input className="login-input" placeholder="Password" type="password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-submit" onClick={submit} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>

        {mode === 'login' && (
          <button className="login-forgot" onClick={() => { setView('forgot'); setError(''); }}>
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}
