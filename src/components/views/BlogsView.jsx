import React, { useCallback, useEffect, useState } from 'react';
import { getBlogPosts, deleteBlogPost } from '../../services/blogsApi.js';
import BlogFormModal from '../Cards/BlogFormModal.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import Spinner from '../ui/Spinner.jsx';
import { useToast } from '../ui/toastContext.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
];

/**
 * Same shape as the status configs in `src/data/config.js`, so the raw enum
 * (`published` / `draft`) is never rendered to an operator — every other view
 * maps its statuses to a human label, and this one used to leak the DB value.
 */
const postStatusConfig = {
  published: { label: 'Published', color: '#4CAF50', bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.2)' },
  draft: { label: 'Draft', color: '#ff9944', bg: 'rgba(255,153,68,0.1)', border: 'rgba(255,153,68,0.2)' },
  archived: { label: 'Archived', color: '#666677', bg: 'rgba(100,100,120,0.1)', border: 'rgba(100,100,120,0.2)' },
};

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
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPosts(await getBlogPosts({ status: filter }));
    } catch (err) {
      // Surface the actual reason -- the generic string alone made an expired
      // session and a server outage look identical to the operator.
      setError(err?.message ? `Failed to load posts: ${err.message}` : 'Failed to load posts.');
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

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteBlogPost(pendingDelete.id);
      toast.success(`Deleted "${pendingDelete.title}".`);
      setPendingDelete(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete post');
    } finally {
      setDeleting(false);
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
            <Button
              key={f.id}
              variant={filter === f.id ? 'primary' : 'ghost'}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
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
          <Button onClick={openNew}>+ New post</Button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchPosts} className="mb-4" />}

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
          <div className="px-5 py-10 flex items-center justify-center gap-3 text-sm text-white/40">
            <Spinner /> Loading posts…
          </div>
        )}

        {!loading && visible.length === 0 && (
          <EmptyState
            icon="📝"
            message={
              posts.length === 0
                ? 'No posts yet — create your first one.'
                : 'No posts match your search.'
            }
            actionLabel={posts.length === 0 ? '+ New post' : undefined}
            onAction={posts.length === 0 ? openNew : undefined}
          />
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
                <Badge
                  config={postStatusConfig[post.status]}
                  label={postStatusConfig[post.status] ? undefined : (post.status || '—')}
                />
              </div>
              <div className="text-sm text-white/50">
                {formatDate(post.publishedAt)}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setPendingDelete(post)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete post"
          message={`Delete "${pendingDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {modalOpen && (
        <BlogFormModal
          post={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            toast.success('Post saved.');
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}
