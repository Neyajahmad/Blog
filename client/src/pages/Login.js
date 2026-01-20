import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input style={inputStyle} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          style={inputStyle}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <div style={{ color: '#ffb4b4' }}>{error}</div> : null}
        <button className="btn primary" disabled={loading} style={{ padding: '6px 10px', fontSize: '18px', display:'block' }}>
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
      <div className="muted" style={{ marginTop: 12 }}>
        No account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
}

const inputStyle = {
  background: 'rgba(231, 238, 252, 0.06)',
  border: '1px solid rgba(231, 238, 252, 0.10)',
  borderRadius: 12,
  padding: '10px 12px',
  color: '#e7eefc',
  outline: 'none',
};

