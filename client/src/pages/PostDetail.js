import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';

export default function PostDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get(`/posts/${slug}`)
      .then((res) => mounted && setData(res.data))
      .catch((err) => mounted && setError(err?.response?.data?.message || 'Failed to load'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [slug]);

  const html = useMemo(() => {
    if (!data?.post) return '';
    const p = data.post;
    const raw = p.contentType === 'markdown' ? marked.parse(p.content || '') : p.content || '';
    return DOMPurify.sanitize(raw);
  }, [data]);

  async function submitComment(e) {
    e.preventDefault();
    if (!data?.post?._id) return;
    setError('');
    try {
      const res = await api.post(`/comments/${data.post._id}`, { content: comment });
      setData((prev) => ({ ...prev, comments: [res.data.comment, ...(prev?.comments || [])] }));
      setComment('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to comment');
    }
  }

  async function deleteComment(id) {
    try {
      await api.delete(`/comments/${id}`);
      setData((prev) => ({ ...prev, comments: (prev?.comments || []).filter((c) => c._id !== id) }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete comment');
    }
  }

  if (loading) return <div className="card">Loading…</div>;
  if (error) return <div className="card">Error: {error}</div>;
  if (!data?.post) return <div className="card">Not found.</div>;

  const p = data.post;

  return (
    <div className="grid">
      <div className="col-8">
        <article className="card">
          <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
            <Link to="/" className="muted">
              ← Back
            </Link>
            <span style={{ margin: '0 8px' }}>•</span>
            {p.author?.name || 'Unknown'} • {p.publishedAt ? new Date(p.publishedAt).toLocaleString() : '—'}
          </div>
          <h1 style={{ marginTop: 0 }}>{p.title}</h1>
          {p.excerpt ? (
            <p className="muted" style={{ marginTop: 0 }}>
              {p.excerpt}
            </p>
          ) : null}
          <div
            className="postBody"
            style={{ marginTop: 18, lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <section className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Comments</h3>

          {user ? (
            <form onSubmit={submitComment} style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
                rows={3}
                style={textareaStyle}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn primary" disabled={!comment.trim()}>
                  Post comment
                </button>
                {error ? <div style={{ color: '#ffb4b4', alignSelf: 'center' }}>{error}</div> : null}
              </div>
            </form>
          ) : (
            <div className="muted" style={{ marginBottom: 14 }}>
              <Link to="/login">Login</Link> to comment.
            </div>
          )}

          {data.comments?.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {data.comments.map((c) => {
                const canDelete =
                  user && (String(c.author?._id) === String(user._id) || user.role === 'author');
                return (
                  <div key={c._id} className="card" style={{ padding: 12 }}>
                    <div className="muted" style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {c.author?.name || 'User'} • {new Date(c.createdAt).toLocaleString()}
                      </span>
                      {canDelete ? (
                        <button className="btn secondary" type="button" onClick={() => deleteComment(c._id)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="muted">No comments yet.</div>
          )}
        </section>
      </div>

      <aside className="col-4">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Tags</h3>
          {p.tags?.length ? <div className="muted">{p.tags.join(', ')}</div> : <div className="muted">—</div>}
        </div>
      </aside>
    </div>
  );
}

const textareaStyle = {
  background: 'rgba(231, 238, 252, 0.06)',
  border: '1px solid rgba(231, 238, 252, 0.10)',
  borderRadius: 12,
  padding: '10px 12px',
  color: '#e7eefc',
  outline: 'none',
  resize: 'vertical',
};

