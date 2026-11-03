import React, { useEffect, useState } from 'react';
import RichTextEditor from '../ui/RichTextEditor.jsx';
import { createBlogPost, updateBlogPost } from '../../services/blogsApi.js';

const inputClass =
  'w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[rgba(255,61,61,0.5)] transition-all';
const labelClass = 'block text-xs font-semibold text-white/60 mb-2 ml-1';

const EMPTY = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  status: 'draft',
  coverImage: '',
};

/** Create/edit dialog. `post` null means "new post". */
export default function BlogFormModal({ post, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [coverFile, setCoverFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        category: post.category || '',
        status: post.status || 'draft',
        coverImage: post.coverImage || '',
      });
      setPreview(post.coverImage || '');
    } else {
      setForm(EMPTY);
      setPreview('');
    }
    setCoverFile(null);
    setError('');
  }, [post]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Title is required.');
    // TipTap leaves an empty paragraph behind, so a length check isn't enough.
    const textOnly = form.content.replace(/<[^>]*>/g, '').trim();
    if (!textOnly) return setError('Content is required.');

    setSaving(true);
    try {
      const payload = { ...form, coverFile };
      if (post) await updateBlogPost(post.id, payload);
      else await createBlogPost(payload);
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save the post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease_forwards]">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-white mb-6">
          {post ? 'Edit post' : 'New post'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="When should you change engine oil?"
              className={inputClass}
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <input
                type="text"
                value={form.category}
                onChange={set('category')}
                placeholder="Maintenance"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputClass}>
                <option value="draft">Draft — not visible on the site</option>
                <option value="published">Published — live on the site</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={set('excerpt')}
              rows={2}
              placeholder="One or two lines shown on the blog listing card."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>Cover image</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFile}
                className="text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20"
              />
              {preview && (
                <img
                  src={preview}
                  alt=""
                  className="h-14 w-24 rounded-lg object-cover border border-white/10"
                />
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Content *</label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-red hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving…' : post ? 'Save changes' : 'Create post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
