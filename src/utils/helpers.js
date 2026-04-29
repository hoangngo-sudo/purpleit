import { supabase } from './client';

/**
 * Shared utility functions for the HobbyHub app.
 */

function isRetryableError(error) {
  if (error instanceof TypeError) return true;
  if (error?.status >= 500 && error?.status < 600) return true;
  return false;
}

/**
 * Wraps a Supabase read query with retry logic for transient failures.
 * Does NOT retry mutations (insert, update, delete, RPC).
 *
 * @param {Function} queryFn - A function that returns a Supabase query promise.
 * @param {{ retries?: number, baseDelay?: number }} options
 * @returns {Promise<{ data: any, error: any, count?: number }>}
 */
export async function fetchWithRetry(queryFn, { retries = 2, baseDelay = 1000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await queryFn();
      if (result.error) throw result.error;
      return result;
    } catch (err) {
      if (attempt === retries || !isRetryableError(err)) throw err;
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
    }
  }
}

/**
 * Converts a timestamp into a human-readable relative time string.
 *
 * @param {string|number|Date} time - A value parseable by `Date.parse()`.
 * @returns {string} Relative time string, e.g. "3 hours ago" or "just now".
 */
export const formatTime = (time) => {
  const postedTime = (Date.now() - Date.parse(time)) / 1000;

  if (postedTime <= 0) return 'just now';
  if (postedTime < 60) return `${Math.floor(postedTime)} seconds ago`;
  if (postedTime < 60 * 60) return `${Math.floor(postedTime / 60)} minutes ago`;
  if (postedTime < 60 * 60 * 24) return `${Math.floor(postedTime / (60 * 60))} hours ago`;
  if (postedTime < 60 * 60 * 24 * 7) return `${Math.floor(postedTime / (60 * 60 * 24))} days ago`;
  if (postedTime < 60 * 60 * 24 * 30) return `${Math.floor(postedTime / (60 * 60 * 24 * 7))} weeks ago`;
  if (postedTime < 60 * 60 * 24 * 7 * 52) return `${Math.floor(postedTime / (60 * 60 * 24 * 30))} months ago`;
  return `${Math.floor(postedTime / (60 * 60 * 24 * 7 * 52))} years ago`;
};

/**
 * Checks whether a post has been edited after creation.
 *
 * @param {{ created_at: string, updated_at?: string }} post
 * @returns {boolean} `true` if `updated_at` exists and is later than `created_at`.
 */
export const isEdited = (post) => {
  return (
    post.updated_at &&
    new Date(post.updated_at).getTime() > new Date(post.created_at).getTime()
  );
};

/**
 * Returns true if the given user is the author of the post.
 * This is a UX convenience — RLS is the authoritative check.
 *
 * @param {{ author_id?: string }} post
 * @param {{ id: string } | null} user
 * @returns {boolean}
 */
export const isPostOwner = (post, user) =>
  !!user && !!post?.author_id && user.id === post.author_id;

/**
 * Uploads an image file to Supabase Storage (`post-images` bucket).
 *
 * @param {File} imageFile - The image File object to upload.
 * @param {{ onProgress?: (pct:number)=>void }} [options]
 * @returns {Promise<string>} The public URL of the uploaded image.
 * @throws If the upload fails.
 */
export const uploadImage = async (imageFile, { onProgress } = {}) => {
  if (!imageFile) return null;

  const fileName = `${Date.now()}-${imageFile.name}`;

  const { error } = await supabase.storage
    .from('post-images')
    .upload(fileName, imageFile, {
      upsert: false,
      ...(onProgress ? {
        onUploadProgress: (ev) => onProgress(Math.round((ev.loaded / ev.total) * 100))
      } : {})
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('post-images')
    .getPublicUrl(fileName);

  return publicUrl;
};

/**
 * Builds a nested comment tree from a flat array of comment rows.
 * Each node gets a `children` array and a `depth` number.
 * Top-level comments (parent_id === null) are returned as roots.
 * Each level is sorted by created_at ascending (chronological).
 *
 * @param {Array} flatComments - All comments for a post (flat Supabase rows).
 * @returns {Array} Root CommentNode objects with nested `children[]` and `depth`.
 */
export const buildCommentTree = (flatComments) => {
  const map = new Map();
  const roots = [];

  // First pass: index all comments with empty children arrays
  for (const c of flatComments) {
    map.set(c.id, { ...c, children: [], depth: 0 });
  }

  // Second pass: link parents and children
  for (const node of map.values()) {
    if (node.parent_id != null && map.has(node.parent_id)) {
      const parent = map.get(node.parent_id);
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else if (node.parent_id == null) {
      roots.push(node);
    }
    // else: orphan (parent not yet loaded via root pagination) — silently dropped
  }

  // Sort each level chronologically (oldest first)
  const sortByDate = (a, b) => new Date(a.created_at) - new Date(b.created_at);
  const sortTree = (nodes) => {
    nodes.sort(sortByDate);
    for (const n of nodes) sortTree(n.children);
  };
  sortTree(roots);

  return roots;
};
