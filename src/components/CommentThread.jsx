import { useState, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/client';
import RelativeTime from './RelativeTime';

const MAX_DEPTH = 5;
const GUTTER_WIDTH = 32; // avatar (24px) + gap (8px)

const CommentThread = ({ comment, depth = 0, postId, postAuthorId, onCommentAdded, user, profile, showToast }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const gutterRef = useRef(null);
  const childrenRef = useRef(null);
  const [threadLineBottom, setThreadLineBottom] = useState(0);

  const hasChildren = comment.children && comment.children.length > 0;

  const handleReplyClick = () => {
    if (!user) {
      showToast({ message: 'Log in to reply to comments.', type: 'warning' });
      return;
    }
    setShowReplyForm((prev) => !prev);
  };

  const submitReply = async () => {
    if (!user) {
      showToast({ message: 'Log in to reply to comments.', type: 'warning' });
      return;
    }
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          comment: replyText.trim(),
          author_id: user.id,
          parent_id: comment.id,
        })
        .select();

      if (error) throw error;

      const newComment = {
        ...data[0],
        profiles: profile
          ? { id: profile.id, username: profile.username, avatar_url: profile.avatar_url }
          : null,
      };
      onCommentAdded(newComment);
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error posting reply:', error);
      showToast({ message: 'Error posting reply. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Measure where the last child's branch connector is so the
  // parent vertical line stops exactly there (no trailing tail).
  // ResizeObserver re-measures whenever any child grows (e.g. reply form opens).
  useLayoutEffect(() => {
    if (!hasChildren || isCollapsed || !childrenRef.current || !gutterRef.current) {
      setThreadLineBottom(0);
      return;
    }

    const measure = () => {
      const lastChild = childrenRef.current?.lastElementChild;
      if (!lastChild || !gutterRef.current) return;
      const gutterBottom = gutterRef.current.getBoundingClientRect().bottom;
      const lastChildTop = lastChild.getBoundingClientRect().top;
      setThreadLineBottom(Math.max(0, gutterBottom - lastChildTop));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(childrenRef.current);
    return () => observer.disconnect();
  }, [hasChildren, isCollapsed, comment.children?.length]);

  // Avatar element (shared between deleted, profile, and anonymous states)
  const renderAvatar = () => {
    if (comment.is_deleted) {
      return <i className="bi bi-person-circle text-muted" style={{ fontSize: '24px', lineHeight: 1 }}></i>;
    }
    if (comment.profiles?.avatar_url) {
      return (
        <img
          src={comment.profiles.avatar_url}
          alt={comment.profiles.username || 'User'}
          className="rounded-circle"
          style={{ width: 24, height: 24, objectFit: 'cover' }}
          referrerPolicy="no-referrer"
        />
      );
    }
    return <i className="bi bi-person-circle text-muted" style={{ fontSize: '24px', lineHeight: 1 }}></i>;
  };

  return (
    <div className={`comment-thread${depth > 0 ? ' comment-thread-child' : ''}`} style={{ display: 'flex', alignItems: 'stretch' }}>
      {/* ── Gutter column: avatar + thread line ── */}
      <div
        className="comment-gutter"
        ref={gutterRef}
        style={{
          width: GUTTER_WIDTH,
          minWidth: GUTTER_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Avatar */}
        {comment.is_deleted ? (
          <div style={{ width: 24, height: 24 }}>{renderAvatar()}</div>
        ) : comment.profiles ? (
          <Link to={`/purpleit/profile/${comment.profiles.id}`}>
            {renderAvatar()}
          </Link>
        ) : (
          <div style={{ width: 24, height: 24 }}>{renderAvatar()}</div>
        )}

        {/* Clickable thread line — only visible when expanded with children */}
        {hasChildren && !isCollapsed && (
          <button
            className="comment-thread-line-btn"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand replies' : 'Collapse replies'}
            style={{
              position: 'absolute',
              top: 28,    /* just below the 24px avatar + 4px gap */
              bottom: threadLineBottom,
              left: 0,
              right: 0,   /* fill gutter width — centers the 1px line on a pixel boundary */
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              zIndex: 1,
            }}
          >
            {/* The visible line (1px border, matches connector) */}
            <span
              className="comment-thread-line"
              style={{
                display: 'block',
                width: 0,
                height: '100%',
                marginLeft: '50%',
                borderLeft: '1px solid #dee2e6',
              }}
            />
          </button>
        )}
      </div>

      {/* ── Content column ── */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: depth === 0 ? 8 : 4 }}>
        {/* Author name + timestamp row */}
        <div className="d-flex align-items-center mb-1" style={{ minHeight: 24 }}>
          {comment.is_deleted ? (
            <small className="text-muted fst-italic">[deleted]</small>
          ) : comment.profiles ? (
            <Link
              to={`/purpleit/profile/${comment.profiles.id}`}
              className="text-decoration-none d-flex align-items-center gap-1"
            >
              <small className="fw-semibold text-muted">{comment.profiles.username || 'User'}</small>
              {postAuthorId && comment.profiles.id === postAuthorId && (
                <small className="fw-semibold" style={{ color: '#495BCA' }}>OP</small>
              )}
            </Link>
          ) : (
            <small className="text-muted">Anonymous</small>
          )}
          <small className="text-muted ms-2">
            {comment.created_at && <RelativeTime time={comment.created_at} />}
          </small>
        </div>

        {/* Comment text */}
        {comment.is_deleted ? (
          <p className="mb-1 text-muted fst-italic">[Comment Deleted]</p>
        ) : (
          <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{comment.comment}</p>
        )}

        {/* Action buttons */}
        <div className="d-flex align-items-center gap-2 mb-2">
          {/* Reply button */}
          {!comment.is_deleted && depth < MAX_DEPTH && (
            <button
              className="btn btn-sm btn-link text-muted text-decoration-none p-0"
              onClick={handleReplyClick}
            >
              <i className="bi bi-reply me-1"></i>
              <small>Reply</small>
            </button>
          )}

          {/* Collapse toggle (text fallback — thread line is the primary toggle) */}
          {hasChildren && (
            <button
              className="btn btn-sm btn-link text-muted text-decoration-none p-0"
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-expanded={!isCollapsed}
            >
              <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-down'} me-1`}></i>
              <small>
                {isCollapsed
                  ? `${comment.children.length} ${comment.children.length === 1 ? 'reply' : 'replies'}`
                  : 'Collapse'}
              </small>
            </button>
          )}
        </div>

        {/* Inline reply form */}
        {showReplyForm && (
          <div className="mb-1">
            <textarea
              className="form-control"
              rows="3"
              placeholder={`Reply to ${comment.profiles?.username || 'this comment'}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              aria-label={`Reply to ${comment.profiles?.username || 'comment'}`}
              autoFocus
            />
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
              <button
                className="btn btn-outline-secondary"
                onClick={() => { setShowReplyForm(false); setReplyText(''); }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submitReply}
                disabled={isSubmitting || !replyText.trim()}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Posting...
                  </>
                ) : (
                  'Reply'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Render children recursively (nested inside content column = automatic indent) */}
        {hasChildren && !isCollapsed && (
          <div className="comment-children" ref={childrenRef}>
            {comment.children.map((child) => (
              <CommentThread
                key={child.id}
                comment={child}
                depth={depth + 1}
                postId={postId}
                postAuthorId={postAuthorId}
                onCommentAdded={onCommentAdded}
                user={user}
                profile={profile}
                showToast={showToast}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default CommentThread;
