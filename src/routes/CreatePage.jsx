import { useState } from "react";
import { supabase } from "../utils/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/useToast";
import { useAuth } from "../contexts/useAuth";
import { uploadImage } from "../utils/helpers";
import ImageDropZone from "../components/ImageDropZone";

const CreatePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [inputs, setInputs] = useState({
    title: '',
    content: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('url');
  const [isLoading, setIsLoading] = useState(false);

  // Upload image if needed, insert the new post row, and navigate to it
  const createPost = async (e) => {
    e.preventDefault();
    
    if (!inputs.title.trim()) {
      showToast({ message: 'Please enter a title for your post.', type: 'error' });
      return;
    }

    setIsLoading(true);
    
    try {
      let finalImageUrl = inputs.imageUrl;

      // If user chose to upload a file, upload it first
      if (uploadMethod === 'file' && imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const slug = Math.random().toString(36).substring(2, 15);
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: inputs.title, 
          content: inputs.content, 
          imageUrl: finalImageUrl,
          slug: slug,
          upvotes: 0,
          author_id: user.id
        })
        .select();

      if (error) throw error;

      showToast({ message: 'Post created successfully!', type: 'success' });
      navigate(`/purpleit/${data[0].slug}`);
    } catch (error) {
      console.error('Error creating post:', error);
      showToast({ message: 'Error creating post. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }))
  };

  return (
    <div>
      <div className="card">
        <div className="card-header bg-primary text-white py-2">
              <h4 className="card-title m-0">
                Create a New Post
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={createPost}>
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

                {/* Image Upload Section */}
                <div className="mb-3">
                  <label className="form-label">Add Image</label>
                  
                  {/* Toggle between URL and File upload */}
                  <div className="btn-group d-flex mb-3" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="uploadMethod"
                      id="urlMethod"
                      checked={uploadMethod === 'url'}
                      onChange={() => setUploadMethod('url')}
                    />
                    <label className="btn btn-outline-primary" htmlFor="urlMethod">
                      <i className="bi bi-link-45deg me-2"></i>Image URL
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="uploadMethod"
                      id="fileMethod"
                      checked={uploadMethod === 'file'}
                      onChange={() => setUploadMethod('file')}
                    />
                    <label className="btn btn-outline-primary" htmlFor="fileMethod">
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
                        placeholder="https://example.com/image.jpg" 
                        value={inputs["imageUrl"]} 
                        onChange={handleChange}
                      />
                      <div className="form-text">
                        <i className="bi bi-info-circle me-1"></i>
                        Add an image URL to make your post more engaging
                      </div>
                    </>
                  )}

                  {uploadMethod === 'file' && (
                    <ImageDropZone
                      file={imageFile}
                      onFileSelect={setImageFile}
                      onFileClear={() => setImageFile(null)}
                      onError={(msg) => showToast({ message: msg, type: 'error' })}
                      accentColor="primary"
                    />
                  )}
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/purpleit/')}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      'Post'
                    )}
                  </button>
                </div>
              </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;