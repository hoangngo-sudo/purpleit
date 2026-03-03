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
