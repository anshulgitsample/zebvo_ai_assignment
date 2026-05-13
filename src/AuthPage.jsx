import { useAuthStore } from './store';
import { useState } from 'react';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(s => s.login);

  const handle = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill all fields'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your name'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    login(email, name || email.split('@')[0]);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">✦ BrandFlow</div>
        <p className="auth-tagline">AI-powered social media content pipeline</p>

        <div className="tabs mb-4">
          <button className={`tab${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
          <button className={`tab${mode === 'signup' ? ' active' : ''}`} onClick={() => setMode('signup')}>Create Account</button>
        </div>

        <form onSubmit={handle}>
          {mode === 'signup' && (
            <div className="field">
              <label className="label">Full Name</label>
              <input className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary w-full btn-lg" style={{ justifyContent: 'center' }}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 28, padding: '16px', background: 'var(--bg2)', borderRadius: 8, fontSize: 13, color: 'var(--text2)' }}>
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>Demo access</strong>
          Use any email + password (6+ chars) to get started immediately.
        </div>
      </div>
    </div>
  );
}
