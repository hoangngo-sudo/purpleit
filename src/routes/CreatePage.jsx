import { useState } from "react";
import { supabase } from "../utils/client";
import { useNavigate } from "react-router-dom";

const CreatePage = () => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({
    'title': '',
    'content': '',
    'imageUrl': '',
    'secret_key': ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const createPost = async (e) => {
    e.preventDefault();
    
    if (!inputs.title.trim()) {
      alert("Please enter a title for your post.");
      return;
    }

    setIsLoading(true);
    
    try {
      const userId = Math.random().toString(36).substring(2, 15);
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: inputs.title, 
          content: inputs.content, 
          imageUrl: inputs.imageUrl,
          user_id: userId,
          upvotes: 0,
          secret_key: inputs.secret_key
        })
        .select();

      if (error) throw error;

      setInputs({
        'title': '',
        'content': '',
        'imageUrl': '',
        'secret_key': ''
      });

      alert("Post created successfully!");
      navigate(`/purpleit/${data[0].user_id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      alert("Error creating post. Please try again.");
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
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white py-3">
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

                <div className="mb-3">
                  <label htmlFor="imageUrl" className="form-label">Image URL</label>
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
                </div>

                <div className="mb-3">
                  <label htmlFor="secret_key" className="form-label">
                    Secret Key (For Authentication)
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="secret_key"
                    name="secret_key"
                    value={inputs["secret_key"]}
                    onChange={handleChange}
                    placeholder="Create a secret key to edit/delete your post later"
                  />
                  <div className="form-text">
                    <i className="bi bi-shield-lock me-1"></i>
                    Keep this secret! You&apos;ll need it to edit or delete your post
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => navigate('/purpleit/')}
                    disabled={isLoading}
                  >
                    <i className="bi bi-x-circle me-2"></i>Cancel
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
                      <>
                        <i className="bi bi-check-circle me-2"></i>Post
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

export default CreatePage;