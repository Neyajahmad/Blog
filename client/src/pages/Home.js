import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(parseInt(params.get('page') || '1', 10), 1);
  const q = (params.get('q') || '').trim();

  const [data, setData] = useState({ items: [], totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(q);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get('/posts', { params: { page, limit: 8, q: q || undefined } })
      .then((res) => {
        if (!mounted) return;
        setData(res.data);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [page, q]);

  function submitSearch(e) {
    e.preventDefault();
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (query.trim()) next.set('q', query.trim());
      else next.delete('q');
      next.set('page', '1');
      return next;
    });
  }

  return (
    <div className="grid">
      <div className="col-8">
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={submitSearch} style={{ display: 'flex', gap: 10 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts…"
              style={inputStyle}
            />
            <button className="btn primary" type="submit">
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="card">Loading…</div>
        ) : data.items.length === 0 ? (
          <div className="card">No posts found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {data.items.map((p) => (
              <article key={p._id} className="card">
                <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                  {p.author?.name || 'Unknown'} •{' '}
                  {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '—'}
                </div>
                <h2 style={{ margin: '0 0 8px' }}>{p.title}</h2>
                <p className="muted" style={{ margin: 0 }}>
                  {p.excerpt || '—'}
                </p>
                <div style={{ marginTop: 12 }}>
                  <Link className="btn secondary" to={`/post/${p.slug}`}>
                    Read
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pager page={page} totalPages={data.totalPages} q={q} setParams={setParams} />
      </div>

      <aside className="col-4">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>About</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            A simple MERN blogging platform with auth, rich text editor, comments, and image uploads.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Pager({ page, totalPages, q, setParams }) {
  if (!totalPages || totalPages <= 1) return null;

  function go(nextPage) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      if (q) next.set('q', q);
      return next;
    });
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
      <button className="btn secondary" onClick={() => go(Math.max(page - 1, 1))} disabled={page <= 1}>
        Prev
      </button>
      <div className="muted" style={{ alignSelf: 'center' }}>
        Page {page} / {totalPages}
      </div>
      <button
        className="btn secondary"
        onClick={() => go(Math.min(page + 1, totalPages))}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
}

const inputStyle = {
  flex: 1,
  background: 'rgba(231, 238, 252, 0.06)',
  border: '1px solid rgba(231, 238, 252, 0.10)',
  borderRadius: 12,
  padding: '10px 12px',
  color: '#e7eefc',
  outline: 'none',
};

