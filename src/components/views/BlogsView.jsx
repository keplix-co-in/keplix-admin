import React, { useCallback, useEffect, useState } from 'react';
import { getBlogPosts, deleteBlogPost } from '../../services/blogsApi.js';
import BlogFormModal from '../Cards/BlogFormModal.jsx';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
];

const GRID = 'grid-cols-[1.8fr_1fr_110px_150px_140px]';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export default function BlogsView() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPosts(await getBlogPosts({ status: filter }));
    } catch (err) {
      setError('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const visible = posts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await deleteBlogPost(post.id);
      fetchPosts();
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setEditing(post);
    setModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === f.id
                  ? 'bg-brand-red text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[rgba(255,61,61,0.5)]"
          />
          <button
            onClick={openNew}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-red hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + New post
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div
          className={`grid ${GRID} gap-4 px-5 py-3 bg-white/[0.03] text-xs font-semibold uppercase tracking-wide text-white/40`}
        >
          <div>Title</div>
          <div>Category</div>
          <div>Status</div>
          <div>Published</div>
          <div className="text-right">Actions</div>
        </div>

        {loading && (
          <div className="px-5 py-10 text-center text-sm text-white/40">
            Loading posts…
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-white/40">
            {posts.length === 0
              ? 'No posts yet — create your first one.'
              : 'No posts match your search.'}
          </div>
        )}

        {!loading &&
          visible.map((post) => (
            <div
              key={post.id}
              className={`grid ${GRID} gap-4 items-center px-5 py-4 border-t border-white/5 hover:bg-white/[0.02] transition-colors`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {post.title}
                </p>
                <p className="truncate text-xs text-white/40">/{post.slug}</p>
              </div>
              <div className="text-sm text-white/60 truncate">{post.category}</div>
              <div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    post.status === 'published'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {post.status}
                </span>
              </div>
              <div className="text-sm text-white/50">
                {formatDate(post.publishedAt)}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => openEdit(post)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {modalOpen && (
        <BlogFormModal
          post={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}
