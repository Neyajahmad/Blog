import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState({ items: [] });
  const [err, setErr] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) return nav('/login');
    if (user.role !== 'author') return nav('/');

    api
      .get('/posts/mine', { params: { limit: 20 } })
      .then((res) => setData(res.data))
      .catch((e) => setErr(e?.response?.data?.message || 'Failed to load'));
  }, [user, loading, nav]);

  async function publish(id) {
    await api.post(`/posts/${id}/publish`);
    const res = await api.get('/posts/mine', { params: { limit: 20 } });
    setData(res.data);
  }

  async function unpublish(id) {
    await api.post(`/posts/${id}/unpublish`);
    const res = await api.get('/posts/mine', { params: { limit: 20 } });
    setData(res.data);
  }

  async function remove(id) {
    if (!window.confirm('Delete this post?')) return;
    await api.delete(`/posts/${id}`);
    const res = await api.get('/posts/mine', { params: { limit: 20 } });
    setData(res.data);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Author Dashboard</h2>
          <div className="muted" style={{ marginTop: 6 }}>
            Create, edit, publish and delete your posts.
          </div>
        </div>
        <Link to="/editor/new" className="btn primary">
          New post
        </Link>
      </div>

      {err ? <div className="card">Error: {err}</div> : null}

      {data.items?.length ? (
        data.items.map((p) => (
          <div key={p._id} className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 800 }}>{p.title}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  Status: {p.status} • Updated {new Date(p.updatedAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="btn secondary" to={`/editor/${p._id}`}>
                  Edit
                </Link>
                {p.status === 'published' ? (
                  <button className="btn secondary" onClick={() => unpublish(p._id)}>
                    Unpublish
                  </button>
                ) : (
                  <button className="btn secondary" onClick={() => publish(p._id)}>
                    Publish
                  </button>
                )}
                <button className="btn secondary" onClick={() => remove(p._id)}>
                  Delete
                </button>
              </div>
            </div>
            <div className="muted">{p.excerpt || '—'}</div>
          </div>
        ))
      ) : (
        <div className="card">No posts yet.</div>
      )}
    </div>
  );
}

