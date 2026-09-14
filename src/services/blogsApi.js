/**
 * Blogs API Service
 * Admin CRUD for marketing-site blog posts.
 */

import { API_URL } from './apiConfig.js';
import { authFetch, authFetchRaw } from './authApi.js';

// createBlogPost and updateBlogPost send FormData (so a cover image file can
// ride along) and MUST NOT have a Content-Type header — the browser sets its
// own multipart boundary. They use authFetchRaw, which skips the JSON
// Content-Type authFetch normally forces but still gets the same
// refresh-on-401 retry.

/**
 * Posts are sent as multipart/form-data so a cover image file can ride along.
 * Note we deliberately do NOT set Content-Type — the browser must set it
 * itself so the multipart boundary is included.
 */
const toFormData = (post) => {
  const fd = new FormData();
  ['title', 'excerpt', 'content', 'category', 'status'].forEach((k) => {
    if (post[k] !== undefined && post[k] !== null) fd.append(k, post[k]);
  });
  if (post.coverFile) fd.append('coverImage', post.coverFile);
  else if (post.coverImage) fd.append('coverImage', post.coverImage);
  return fd;
};

/** List posts. Follows house convention: swallow errors, return []. */
export const getBlogPosts = async ({ status = 'all', page = 1, limit = 50, search = '' } = {}) => {
  try {
    const qs = new URLSearchParams({ status, page, limit, search });
    const response = await authFetch(`${API_URL}/admin/blogs?${qs}`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error(`Blogs API error: ${response.status}`);
      return [];
    }

    const json = await response.json();
    return json.data ?? [];
  } catch (error) {
    if (error.code === 'SESSION_EXPIRED') throw error;
    console.error('Failed to fetch blog posts:', error);
    return [];
  }
};

/** Mutations throw so the caller can surface the failure. */
export const createBlogPost = async (post) => {
  const response = await authFetchRaw(`${API_URL}/admin/blogs`, {
    method: 'POST',
    body: toFormData(post),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create post');
  }
  return response.json();
};

export const updateBlogPost = async (id, post) => {
  const response = await authFetchRaw(`${API_URL}/admin/blogs/${id}`, {
    method: 'PUT',
    body: toFormData(post),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update post');
  }
  return response.json();
};

export const deleteBlogPost = async (id) => {
  const response = await authFetch(`${API_URL}/admin/blogs/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete post');
  }
  return response.json();
};

export default { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost };
