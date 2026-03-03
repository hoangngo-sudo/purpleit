import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useToast } from '../contexts/useToast';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      showToast({ message: 'Please log in to continue.', type: 'info' });
      navigate('/purpleit/login', { replace: true });
    }
  }, [loading, user, navigate, showToast]);

  if (loading) {
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

  return user ? children : null;
};

export default ProtectedRoute;
