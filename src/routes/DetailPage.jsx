import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/client';

const DetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect (() => {
    fetchPost().catch(console.error);
    fetchComments().catch(console.error);
  }, [params.user_id]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', params.user_id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching post:', error);
      }
      setPost(data || null);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const {data, error} = await supabase
        .from('comments')
        .select('id, comment, created_at, post_id')
        .eq('post_id', params.user_id)
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching comments:', error);
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const increaseUpvote = async () => {
    if (isUpvoting) return;
    setIsUpvoting(true);
    const newUpvotes = (post?.upvotes ?? 0) + 1;

    setPost((p) => ({ ...(p || {}), upvotes: newUpvotes }));

    try {
      await supabase
        .from('posts')
        .update({ upvotes: newUpvotes })
        .eq('user_id', params.user_id);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSecretKey('');
  };

  const deletePost = async () => {
    if (!post || secretKey !== post.secret_key) {
      alert("Invalid secret key. Please try again.");
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('user_id', params.user_id);

      if (error) throw error;

      alert("Post deleted successfully!");
      navigate('/purpleit/', {replace: true});
    } catch (error) {
      console.error('Error deleting post:', error);
      alert("Error deleting post. Please try again.");
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const handleChange = (e) => {
    setComment(e.target.value);
  };

  const createComment = async () => {
    if (!comment.trim()) return;
    
    setIsCommenting(true);
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: params.user_id, comment: comment.trim() })
        .select();
      
      if (error) throw error;
      
      // Add new comment to the beginning of the array
      setComments([data[0], ...comments]);
      setComment("");
    } catch (error) {
      console.error('Error creating comment:', error);
      alert("Error adding comment. Please try again.");
    } finally {
      setIsCommenting(false);
    }
  };

  const formatTime = (time) => {
    // Calculate time difference in seconds
    let postedTime = (Date.now() - Date.parse(time))/1000;
    
    // Handle non-positive time difference simply
    if (postedTime <= 0) {
      return "just now";
    }
    
    if (postedTime < 60)
      return `${Math.floor(postedTime)} seconds ago`;
    if (postedTime < 60*60)
      return `${Math.floor(postedTime/60)} minutes ago`;
    if (postedTime < 60*60*24)
      return `${Math.floor(postedTime/(60*60))} hours ago`;
    if (postedTime < 60*60*24*7)
      return `${Math.floor(postedTime/(60*60*24))} days ago`;
    if (postedTime < 60*60*24*30)
      return `${Math.floor(postedTime/(60*60*24*7))} weeks ago`;
    if (postedTime < 60*60*24*7*52)
      return `${Math.floor(postedTime/(60*60*24*30))} months ago`;
    
    return `${Math.floor(postedTime/(60*60*24*7*52))} years ago`;
  };

  const isEdited = (post) => {
    // Check if updated_at exists and is different from created_at
    return post.updated_at && 
      new Date(post.updated_at).getTime() > new Date(post.created_at).getTime();
  };

  if (isLoading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="mb-3"></div>
          <h3>Post not found</h3>
          <Link to="/purpleit/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white py-3">
                <h4 className="modal-title m-0">Delete Post</h4>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this post? This action cannot be undone.</p>
                
                {/* Authentication Section */}
                <div className="bg-danger bg-opacity-10 border border-danger rounded p-3 mb-3">
                  <h6 className="fw-semibold text-danger mb-2">
                    Authentication Required
                  </h6>
                  <label htmlFor="deleteSecretKey" className="form-label text-danger">
                    Enter your secret key to delete this post
                  </label>
                  <input
                    type="password"
                    className="form-control border-danger"
                    id="deleteSecretKey"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Secret key"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={deletePost}
                  disabled={isDeleting || !secretKey.trim()}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Deleting...
                    </>
                  ) : (
                    "Delete Post"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12">
          {/* Back Button */}
          <Link to="/purpleit/" className="btn btn-outline-secondary mb-3">
            <i className="bi bi-arrow-left me-2"></i>Back to Posts
          </Link>

          {/* Post Card */}
          <div className="card shadow">
            <div className="card-body">
              {/* Post Meta */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  <i className="bi bi-clock me-2"></i>Posted {formatTime(post.created_at)}
                  {isEdited(post) && <span className="ms-1 fst-italic">(edited)</span>}
                </small>
                <div className="dropdown">
                  <button className="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i className="bi bi-three-dots"></i>
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to={`/purpleit/edit/${params.user_id}`}>
                        <i className="bi bi-pencil me-2"></i>Edit Post
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={handleDeleteClick}
                      >
                        <i className="bi bi-trash3 me-2"></i>Delete Post
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Post Title */}
              <h1 className="h2 mb-3">{post.title}</h1>

              {/* Post Content */}
              {post.content && (
                <div className="mb-4">
                  <p className="text-muted mb-0" style={{whiteSpace: 'pre-wrap'}}>
                    {post.content}
                  </p>
                </div>
              )}

              {/* Post Image */}
              {post.imageUrl && post.imageUrl !== "" && (
                <div className="mb-4 text-center">
                  <img 
                    src={post.imageUrl} 
                    alt="Post content" 
                    className="img-fluid rounded shadow-sm"
                    style={{maxHeight: '400px'}}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <button 
                  className={`btn ${isUpvoting ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={increaseUpvote}
                  disabled={isUpvoting}
                >
                  {isUpvoting ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-arrow-up me-1"></i>
                  )}
                  {post.upvotes} {post.upvotes === 1 ? 'upvote' : 'upvotes'}
                </button>
              </div>

              {/* Comments Section */}
              <div className="border-top pt-4">
                <h5 className="mb-3">
                  <i className="bi bi-chat-dots me-2"></i>
                  Comments ({comments.length})
                </h5>
                
                {/* Add Comment - Styled like CreatePage */}
                <div className="mb-4">
                  <textarea 
                    className="form-control" 
                    id="comment"
                    rows="3" 
                    placeholder="Write your comment here..." 
                    value={comment} 
                    onChange={handleChange}
                  ></textarea>
                  <div className="form-text mb-3"></div>
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={createComment}
                      disabled={isCommenting || !comment.trim()}
                    >
                      {isCommenting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Posting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>Post Comment
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                {comments && comments.length > 0 && (
                  <div className="mb-3">
                    {comments.map((item) => (
                      <div key={item.id || Math.random()} className='mb-3'>

                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {item.created_at && formatTime(item.created_at)}
                        </small>
                        <p className="mb-1">{item.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;