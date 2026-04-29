import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from 'motion/react';
import RelativeTime from './RelativeTime';

const Post = ({ slug, createdAt, title, upvotes, isEdited, hasUpvoted, authorUsername, authorAvatarUrl, authorId }) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="card mb-3"
      style={{ cursor: 'pointer', willChange: 'transform, box-shadow' }}
      whileHover={shouldReduceMotion ? undefined : {
        y: -2,
        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
        transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
      }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985, transition: { duration: 0.1 } }}
      onClick={() => navigate(`/purpleit/${slug}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/purpleit/${slug}`); }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <small className="text-muted">
            <i className="bi bi-clock me-2"></i>Posted <RelativeTime time={createdAt} />
            {isEdited && <span className="ms-1 fst-italic">(edited)</span>}
          </small>
          <span className={`badge rounded-pill ${hasUpvoted ? 'bg-success' : 'bg-primary'}`}>
            <i className={`me-1 ${hasUpvoted ? 'bi bi-arrow-up-circle-fill' : 'bi bi-arrow-up'}`}></i>
            {upvotes}
          </span>
        </div>
        {/* Author info */}
        <div className="d-flex align-items-center mb-2">
          {authorId ? (
            <Link
              to={`/purpleit/profile/${authorId}`}
              className="d-flex align-items-center text-decoration-none"
              onClick={(e) => e.stopPropagation()}
            >
              {authorAvatarUrl ? (
                <img
                  src={authorAvatarUrl}
                  alt={authorUsername || 'User'}
                  className="post-author-avatar rounded-circle me-2"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <i className="bi bi-person-circle me-2 text-muted"></i>
              )}
              <small className="text-muted fw-semibold">{authorUsername || 'User'}</small>
            </Link>
          ) : (
            <div className="d-flex align-items-center">
              <i className="bi bi-person-circle me-2 text-muted"></i>
              <small className="text-muted">Anonymous</small>
            </div>
          )}
        </div>
        <h5 className="card-title text-dark mb-0 text-break">{title}</h5>
      </div>
    </motion.div>
  );
};

export default Post;
