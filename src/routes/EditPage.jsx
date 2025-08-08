import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from '../utils/client';

const EditPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [inputs, setInputs] = useState({
    'title': '',
    'content': '',
    'imageUrl': ''
  });
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect (() => {
    fetchPost();
  }, [params.user_id]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*') // Change this to fetch ALL fields including secret_key
        .eq('user_id', params.user_id)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        alert("Error loading post. Please try again.");
      } else if (data) {
        setPost(data); // Store the complete post data including secret_key
        setInputs({
          title: data.title || '',
          content: data.content || '',
          imageUrl: data.imageUrl || ''
        });
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert("Error loading post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePost = async (e) => {
    e.preventDefault();
    if (!post || secretKey !== post.secret_key) {
      alert("Invalid secret key. Please try again.");
      return;
    }

    if (!inputs.title.trim()) {
      alert("Please enter a title for your post.");
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: inputs.title, 
          content: inputs.content, 
          imageUrl: inputs.imageUrl,
          updated_at: new Date() // Add the current date as updated_at
        })
        .eq('user_id', params.user_id);

      if (error) throw error;

      alert("Post updated successfully!");
      navigate(`/${params.user_id}`);
    } catch (error) {
      console.error('Error updating post:', error);
      alert("Error updating post. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChange = (e) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
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
          <h3>Post not found</h3>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8">
          <div className="card shadow">
            <div className="card-header bg-warning text-dark py-3">
              <h4 className="card-title m-0">
                Edit Your Post
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={updatePost}>
                {/* Authentication Section */}
                <div className="bg-warning bg-opacity-10 border border-warning rounded p-3 mb-4">
                  <h5 className="fw-semibold text-warning mb-2">
                    Authentication Required
                  </h5>
                  <label htmlFor="secretKey" className="form-label text-warning">
                    Enter your secret key to edit this post
                  </label>
                  <input
                    type="password"
                    className="form-control border-warning"
                    id="secretKey"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Secret key"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="title"
                    name="title" 
                    placeholder="Enter your post title..." 
                    value={inputs["title"]} 
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="content" className="form-label">Content</label>
                  <textarea 
                    className="form-control" 
                    id="content"
                    name="content" 
                    rows="6" 
                    placeholder="Write your post here..." 
                    value={inputs["content"]} 
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="imageUrl" className="form-label">Image URL</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    id="imageUrl"
                    name="imageUrl" 
                    placeholder="https://example.com/image.jpg (Optional)" 
                    value={inputs["imageUrl"]} 
                    onChange={handleChange}
                  />
                  <div className="form-text">
                    <i className="bi bi-info-circle me-2"></i>
                    Add an image URL to make your post more engaging
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => navigate(`/${params.user_id}`)}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-x-circle me-2"></i>Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-warning"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>Update Post
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPage;