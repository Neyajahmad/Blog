import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';

export default function Editor() {
  const { id } = useParams(); // "new" or Mongo id
  const isNew = id === 'new';
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [postId, setPostId] = useState(null);

  const quillRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return nav('/login');
    if (user.role !== 'author') return nav('/');
  }, [user, loading, nav]);

  useEffect(() => {
    if (isNew) return;
    let mounted = true;
    setError('');
    api
      .get(`/posts/mine`, { params: { limit: 50 } })
      .then((res) => {
        const found = res.data.items.find((p) => p._id === id);
        if (!found) throw new Error('Not found');
        if (!mounted) return;
        setPostId(found._id);
        setTitle(found.title || '');
        setExcerpt(found.excerpt || '');
        setContent(found.content || '');
      })
      .catch((e) => mounted && setError(e?.response?.data?.message || 'Failed to load post'))
      .finally(() => {});

    return () => {
      mounted = false;
    };
  }, [id, isNew]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: () => pickAndUploadImage(quillRef),
        },
      },
    }),
    []
  );

  async function saveDraft() {
    setSaving(true);
    setError('');
    try {
      if (!title.trim() || !content.trim()) throw new Error('Title and content are required');

      if (isNew) {
        const res = await api.post('/posts', {
          title,
          excerpt,
          contentType: 'html',
          content,
        });
        setPostId(res.data.post._id);
        nav(`/editor/${res.data.post._id}`, { replace: true });
      } else {
        await api.put(`/posts/${postId || id}`, {
          title,
          excerpt,
          contentType: 'html',
          content,
        });
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>{isNew ? 'New Post' : 'Edit Post'}</h2>
          <div className="muted" style={{ marginTop: 6 }}>
            Draft saves to MongoDB. Use Dashboard to publish.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn secondary" onClick={() => nav('/dashboard')}>
            Back
          </button>
          <button className="btn primary" onClick={saveDraft} disabled={saving}>
            {saving ? 'Saving…' : 'Save draft'}
          </button>
        </div>
      </div>

      {error ? <div style={{ color: '#ffb4b4' }}>{error}</div> : null}

      <input style={inputStyle} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        style={textareaStyle}
        placeholder="Short excerpt (optional)"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        rows={2}
      />

      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
        <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} />
      </div>

      <div className="muted" style={{ fontSize: 13 }}>
        Tip: Click the image button in the toolbar to upload to Cloudinary (requires server Cloudinary env vars).
      </div>
    </div>
  );
}

async function pickAndUploadImage(quillRef) {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const form = new FormData();
      form.append('image', file);

      // Don't set Content-Type header - axios sets it automatically with boundary for FormData
      const res = await api.post('/uploads/image', form);

      const editor = quillRef.current?.getEditor();
      const range = editor?.getSelection(true);
      if (!editor || !range) {
        alert('Editor not ready. Please try again.');
        return;
      }
      editor.insertEmbed(range.index, 'image', res.data.url);
      editor.setSelection(range.index + 1);
    } catch (error) {
      console.error('Image upload error:', error);
      const message = error?.response?.data?.message || error.message || 'Failed to upload image';
      alert(`Upload failed: ${message}`);
    }
  };
}

const inputStyle = {
  background: 'rgba(231, 238, 252, 0.06)',
  border: '1px solid rgba(231, 238, 252, 0.10)',
  borderRadius: 12,
  padding: '10px 12px',
  color: '#e7eefc',
  outline: 'none',
};

const textareaStyle = {
  background: 'rgba(231, 238, 252, 0.06)',
  border: '1px solid rgba(231, 238, 252, 0.10)',
  borderRadius: 12,
  padding: '10px 12px',
  color: '#e7eefc',
  outline: 'none',
  resize: 'vertical',
};

