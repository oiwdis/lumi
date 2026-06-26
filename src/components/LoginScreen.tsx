import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Props {
  onAuth: (user: User) => void;
}

export default function LoginScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your name'); return; }

    setLoading(true);
    try {
      const body = mode === 'signup'
        ? { name, email, password }
        : { email, password };

      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }

      localStorage.setItem('lumi-token', data.token);
      localStorage.setItem('lumi-user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="login-screen">
      <div className="login-hero">
        <div className="login-logo">🌱</div>
        <h1 className="login-title">Lumi</h1>
        <p className="login-tagline">Your AI language tutor</p>
      </div>

      <div className="login-card">
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'login-tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Log in
          </button>
          <button
            className={`login-tab ${mode === 'signup' ? 'login-tab--active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign up
          </button>
        </div>

        <div className="login-fields">
          {mode === 'signup' && (
            <input
              className="login-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
            />
          )}
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
            autoFocus={mode === 'login'}
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button
          className="login-submit"
          onClick={submit}
          disabled={loading}
        >
          {loading ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </div>
    </div>
  );
}
