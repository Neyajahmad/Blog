import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reader');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, role });
      nav('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Register</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input style={inputStyle} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={inputStyle} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          style={inputStyle}
          placeholder="Password (min 6 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="muted" style={{ display: 'grid', gap: 8 }}>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)} style={selectStyle}>
            <option value="reader">Reader</option>
            <option value="author">Author</option>
          </select>
        </label>

        {error ? <div style={{ color: '#ffb4b4' }}>{error}</div> : null}
        <button className="btn primary" disabled={loading} style={{ padding: '6px 10px', fontSize: '16px' , display:'block'}}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <div className="muted" style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
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

const selectStyle = {
  background: 'rgba(231, 238, 252, 0.06)',
  border: '1px solid rgba(231, 238, 252, 0.10)',
  borderRadius: 12,
  padding: '10px 12px',
  color: '#e7eefc',
  outline: 'none',
};

