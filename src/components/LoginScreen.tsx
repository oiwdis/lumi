import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Props {
  onAuth: (user: User) => void;
}

// Simple client-side credential store — survives deploys since it's in localStorage
function getAccounts(): Record<string, { user: User; passwordHash: string }> {
  try { return JSON.parse(localStorage.getItem('lumi-accounts') ?? '{}'); } catch { return {}; }
}
function saveAccounts(accounts: Record<string, { user: User; passwordHash: string }>) {
  localStorage.setItem('lumi-accounts', JSON.stringify(accounts));
}
async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'lumi-salt'));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }

    setLoading(true);
    try {
      const ph = await hashPassword(password);
      const accounts = getAccounts();

      if (mode === 'signup') {
        if (accounts[email]) { setError('Email already registered'); return; }
        const user: User = { id: crypto.randomUUID(), name, email };
        accounts[email] = { user, passwordHash: ph };
        saveAccounts(accounts);
        onAuth(user);
      } else {
        const entry = accounts[email];
        if (!entry || entry.passwordHash !== ph) { setError('Invalid email or password'); return; }
        onAuth(entry.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };

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

        <button className="login-submit" onClick={submit} disabled={loading}>
          {loading ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </div>
    </div>
  );
}
