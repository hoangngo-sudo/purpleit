import { Link } from "react-router-dom";
import RelativeTime from './RelativeTime';

const Post = ({ slug, createdAt, title, upvotes, isEdited, hasUpvoted, authorUsername, authorAvatarUrl, authorId }) => {
  return (
    <Link to={`/purpleit/${slug}`} className="text-decoration-none">
      <div className="card mb-3 hover-shadow">
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
          <h5 className="card-title text-dark mb-0">{title}</h5>
        </div>
      </div>
    </Link>
  );
};

export default Post;
