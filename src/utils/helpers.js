import { supabase } from './client';

/**
 * Shared utility functions for the HobbyHub app.
 */

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
 * @returns {Promise<string>} The public URL of the uploaded image.
 * @throws If the upload fails.
 */
export const uploadImage = async (imageFile) => {
  if (!imageFile) return null;

  const fileName = `${Date.now()}-${imageFile.name}`;

  const { error } = await supabase.storage
    .from('post-images')
    .upload(fileName, imageFile);

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
    } else {
      roots.push(node);
    }
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
