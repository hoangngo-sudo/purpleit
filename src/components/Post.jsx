import { Link } from "react-router-dom";

const Post = ({ user_id, time, title, upvotes, isEdited }) => {
  return (
    <Link to={`/${user_id}`} className="text-decoration-none">
      <div className="card mb-3 shadow-sm hover-shadow transition">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <small className="text-muted">
              <i className="bi bi-clock me-2"></i>Posted {time} ago
              {isEdited && <span className="ms-1 fst-italic">(edited)</span>}
            </small>
            <span className="badge bg-primary rounded-pill">
              <i className="bi bi-arrow-up me-1"></i>
              {upvotes}
            </span>
          </div>
          <h5 className="card-title text-dark mb-0">{title}</h5>
        </div>
      </div>
    </Link>
  );
};

export default Post;
