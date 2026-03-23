import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/client';
import { isEdited, isPostOwner, buildCommentTree } from '../utils/helpers';
import { useToast } from '../contexts/useToast';
import { useAuth } from '../contexts/useAuth';
import CommentThread from '../components/CommentThread';
import RelativeTime from '../components/RelativeTime';

const DetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, profile } = useAuth();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const [rootComments, setRootComments] = useState([]);
  const [childComments, setChildComments] = useState([]);
  const [commentPage, setCommentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [totalRootCount, setTotalRootCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const COMMENT_PAGE_SIZE = 10;

  useEffect(() => {
    fetchPost();
    setRootComments([]);
    setChildComments([]);
    setCommentPage(0);
    setHasMoreComments(true);
    loadComments(0);
    fetchVotedState();
  }, [params.slug, user]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', params.slug)
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

  const loadComments = async (pageNum = 0) => {
    try {
      const from = pageNum * COMMENT_PAGE_SIZE;
      const to = from + COMMENT_PAGE_SIZE - 1;

      const { data: roots, count, error: rootsError } = await supabase
        .from('comments')
        .select(
          'id, comment, created_at, post_id, parent_id, is_deleted, profiles!comments_author_id_fkey(id, username, avatar_url)',
          { count: 'exact' }
        )
        .eq('post_id', params.slug)
        .is('parent_id', null)
        .order('created_at', { ascending: true })
        .range(from, to);

      if (rootsError) console.error('Error fetching root comments:', rootsError);

      if (pageNum === 0) {
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select(
            'id, comment, created_at, post_id, parent_id, is_deleted, profiles!comments_author_id_fkey(id, username, avatar_url)'
          )
          .eq('post_id', params.slug)
          .not('parent_id', 'is', null)
          .order('created_at', { ascending: true });

        if (repliesError) console.error('Error fetching replies:', repliesError);
        setChildComments(replies || []);
      }

      setRootComments((prev) =>
        pageNum === 0 ? (roots || []) : [...prev, ...(roots || [])]
      );
      setTotalRootCount(count || 0);
      setHasMoreComments((roots || []).length === COMMENT_PAGE_SIZE);
      setCommentPage(pageNum);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const fetchVotedState = async () => {
    if (!user) { setVoted(false); return; }
    try {
      const { data } = await supabase
        .from('upvotes')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('post_id', params.slug)
        .maybeSingle();
      setVoted(!!data);
    } catch { setVoted(false); }
  };

  const toggleUpvote = async () => {
    if (isUpvoting) return;
    if (!user) {
      showToast({ message: 'Log in to upvote posts.', type: 'warning' });
      return;
    }
    setIsUpvoting(true);

    // Optimistic update
    const wasVoted = voted;
    const optimisticCount = (post?.upvotes ?? 0) + (wasVoted ? -1 : 1);
    setVoted(!wasVoted);
    setPost((p) => ({ ...p, upvotes: optimisticCount }));

    try {
      const { data, error } = await supabase.rpc('toggle_upvote', { p_post_id: params.slug });
      if (error) throw error;
      // Use server-authoritative values
      setVoted(data.has_upvoted);
      setPost((p) => ({ ...p, upvotes: data.upvotes }));
    } catch (err) {
      console.error('Upvote error:', err);
      // Revert optimistic update
      setVoted(wasVoted);
      setPost((p) => ({ ...p, upvotes: (p?.upvotes ?? 0) + (wasVoted ? 1 : -1) }));
      showToast({ message: 'Could not update vote. Please try again.', type: 'error' });
    } finally {
      setIsUpvoting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const deletePost = async () => {
    if (!post) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('slug', params.slug);

      if (error) throw error;

      showToast({ message: 'Post deleted successfully!', type: 'success' });
      navigate('/purpleit/', {replace: true});
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast({ message: 'Error deleting post. Please try again.', type: 'error' });
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const commentTree = useMemo(() => buildCommentTree([...rootComments, ...childComments]), [rootComments, childComments]);

  const handleCommentAdded = (newComment) => {
    setChildComments((prev) => [...prev, newComment]);
  };

  const createComment = async () => {
    if (!user) {
      showToast({ message: 'Log in to post comments.', type: 'warning' });
      return;
    }
    if (!comment.trim()) return;
    
    setIsCommenting(true);
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: params.slug,
          comment: comment.trim(),
          author_id: user.id,
          parent_id: null,
        })
        .select();
      
      if (error) throw error;
      
      // Re-fetch from page 0 to include the new root comment
      loadComments(0);
      setComment("");
    } catch (error) {
      console.error('Error creating comment:', error);
      showToast({ message: 'Error adding comment. Please try again.', type: 'error' });
    } finally {
      setIsCommenting(false);
    }
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
          <h3 className="mb-3">404: What are you looking at?</h3>
          <Link to="/purpleit/" className="btn btn-primary gap-3"><i className="bi bi-arrow-left me-2"></i>Back to Home</Link>
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
                  disabled={isDeleting}
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
          <div className="card">
            <div className="card-body pb-0">
              {/* Post Meta */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  <i className="bi bi-clock me-2"></i>Posted <RelativeTime time={post.created_at} />
                  {isEdited(post) && <span className="ms-1 fst-italic">(edited)</span>}
                </small>
                <div className="dropdown">
                  <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    More
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      {isPostOwner(post, user) ? (
                        <Link className="dropdown-item" to={`/purpleit/edit/${params.slug}`}>
                          <i className="bi bi-pencil me-2"></i>Edit Post
                        </Link>
                      ) : (
                        <span
                          className="dropdown-item disabled"
                          title={user ? 'Not your post' : 'Log in to manage posts'}
                        >
                          <i className="bi bi-pencil me-2"></i>Edit Post
                        </span>
                      )}
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      {isPostOwner(post, user) ? (
                        <button 
                          className="dropdown-item text-danger" 
                          onClick={() => setShowDeleteModal(true)}
                        >
                          <i className="bi bi-trash3 me-2"></i>Delete Post
                        </button>
                      ) : (
                        <span
                          className="dropdown-item disabled text-muted"
                          title={user ? 'Not your post' : 'Log in to manage posts'}
                        >
                          <i className="bi bi-trash3 me-2"></i>Delete Post
                        </span>
                      )}
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
              {post.imageUrl && (
                <div className="mb-4 text-center">
                  <img 
                    src={post.imageUrl} 
                    alt="Post content" 
                    className="img-fluid rounded"
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
                  className={`btn ${voted ? 'btn-success' : isUpvoting ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={toggleUpvote}
                  disabled={isUpvoting}
                >
                  {isUpvoting ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className={`me-1 ${voted ? 'bi bi-arrow-up-circle-fill' : 'bi bi-arrow-up'}`}></i>
                  )}
                  {post.upvotes} {post.upvotes === 1 ? 'upvote' : 'upvotes'}
                </button>
              </div>

              {/* Comments Section */}
              <div>
                <h5 className="mb-3">
                  {totalRootCount + childComments.length} Comment{(totalRootCount + childComments.length) !== 1 ? 's' : ''}
                </h5>
                
                {/* Add Comment */}
                <div className="mb-3">
                  {user ? (
                    <>
                      <textarea 
                        className="form-control" 
                        id="comment"
                        rows="3" 
                        placeholder="Write your comment here..." 
                        value={comment} 
                        onChange={(e) => setComment(e.target.value)}
                      ></textarea>
                      <div className="d-grid gap-1 d-md-flex justify-content-md-end mt-3">
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
                            'Reply'
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-3 mb-3 border rounded bg-light">
                      <p className="text-muted mb-2">
                        <i className="me-2"></i>Log in to join the conversation.
                      </p>
                      <Link to="/purpleit/login" className="btn btn-outline-primary btn-sm">
                        Log In
                      </Link>
                    </div>
                  )}
                </div>

                {/* Comments List (threaded) */}
                {commentTree.length > 0 && (
                  <div className="mb-3">
                    {commentTree.map((rootComment) => (
                      <CommentThread
                        key={rootComment.id}
                        comment={rootComment}
                        depth={0}
                        postId={params.slug}
                        postAuthorId={post?.author_id}
                        onCommentAdded={handleCommentAdded}
                        user={user}
                        profile={profile}
                        showToast={showToast}
                      />
                    ))}
                  </div>
                )}

                {hasMoreComments && rootComments.length > 0 && (
                  <div className="text-center py-3">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => loadComments(commentPage + 1)}
                    >
                      Load more comments ({totalRootCount - rootComments.length} remaining)
                    </button>
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