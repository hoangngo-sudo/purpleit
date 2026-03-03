import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from '../utils/client';
import { useToast } from '../contexts/useToast';
import { useAuth } from '../contexts/useAuth';
import { uploadImage, isPostOwner } from '../utils/helpers';
import ImageDropZone from '../components/ImageDropZone';

const EditPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [inputs, setInputs] = useState({
    title: '',
    content: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('url');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [params.user_id]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', params.user_id)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        showToast({ message: 'Error loading post. Please try again.', type: 'error' });
      } else if (data) {
        if (!isPostOwner(data, user)) {
          setAccessDenied(true);
          setPost(data);
          return;
        }
        setPost(data);
        setInputs({
          title: data.title || '',
          content: data.content || '',
          imageUrl: data.imageUrl || ''
        });
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      showToast({ message: 'Error loading post. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePost = async (e) => {
    e.preventDefault();

    if (!inputs.title.trim()) {
      showToast({ message: 'Please enter a title for your post.', type: 'error' });
      return;
    }

    setIsUpdating(true);

    try {
      let finalImageUrl = inputs.imageUrl;
      if (uploadMethod === 'file' && imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('posts')
        .update({
          title: inputs.title,
          content: inputs.content,
          imageUrl: finalImageUrl,
          updated_at: new Date()
        })
        .eq('user_id', params.user_id);

      if (error) throw error;

      showToast({ message: 'Post updated successfully!', type: 'success' });
      navigate(`/purpleit/${params.user_id}`);
    } catch (error) {
      console.error('Error updating post:', error);
      showToast({ message: 'Error updating post. Please try again.', type: 'error' });
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
          <Link to="/purpleit/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <h3 className="mb-3">Access Denied</h3>
          <p className="text-muted">You can only edit your own posts.</p>
          <Link to="/purpleit/" className="btn btn-primary"><i className="bi bi-arrow-left me-2"></i>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-warning text-dark py-3">
              <h4 className="card-title m-0">
                Edit Your Post
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={updatePost}>
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

                {/* Image Section */}
                <div className="mb-4">
                  <label className="form-label">Image</label>

                  {/* Toggle between URL and File upload */}
                  <div className="btn-group d-flex mb-3" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="editUploadMethod"
                      id="editUrlMethod"
                      checked={uploadMethod === 'url'}
                      onChange={() => { setUploadMethod('url'); setImageFile(null); }}
                    />
                    <label className="btn btn-outline-warning" htmlFor="editUrlMethod">
                      <i className="bi bi-link-45deg me-2"></i>Image URL
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="editUploadMethod"
                      id="editFileMethod"
                      checked={uploadMethod === 'file'}
                      onChange={() => setUploadMethod('file')}
                    />
                    <label className="btn btn-outline-warning" htmlFor="editFileMethod">
                      <i className="bi bi-upload me-2"></i>Upload File
                    </label>
                  </div>

                  {/* URL Input */}
                  {uploadMethod === 'url' && (
                    <>
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
                        <i className="bi bi-info-circle me-1"></i>
                        Add an image URL to make your post more engaging
                      </div>
                    </>
                  )}

                  {/* File Upload (Drag & Drop) */}
                  {uploadMethod === 'file' && (
                    <ImageDropZone
                      file={imageFile}
                      onFileSelect={setImageFile}
                      onFileClear={() => setImageFile(null)}
                      onError={(msg) => showToast({ message: msg, type: 'error' })}
                      currentImageUrl={post.imageUrl}
                      accentColor="warning"
                    />
                  )}
                </div>

                <div className="d-grid gap-1 d-md-flex justify-content-md-end">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => navigate(`/purpleit/${params.user_id}`)}
                    disabled={isUpdating}
                  >
                    Cancel
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
                      'Update Post'
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