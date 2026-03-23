import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const LoginPage = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/purpleit/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-7">
          <div className="card border-0 bg-transparent shadow-none">
            <div className="card-body p-4 p-md-8">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="login-icon-wrapper mb-3">
                  <i className="bi bi-person-circle display-3 text-primary"></i>
                </div>
                <h2 className="fw-bold mb-2">Welcome to p/webdev</h2>
                <p className="text-muted mb-0">Sign in to create posts, comment, and upvote</p>
              </div>

              {/* Google Sign-In Button */}
              <button
                className="btn btn-outline-dark w-100 py-3 d-flex align-items-center justify-content-center gap-2 mb-3"
                onClick={signInWithGoogle}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span className="fw-semibold">Sign in with Google</span>
              </button>

              {/* Divider */}
              <div className="text-center">
                <small className="text-muted">
                  <i className="bi bi-shield-lock me-1"></i>
                  I only collect your email address :)
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
