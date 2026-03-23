import { Component } from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
          <div className="card border-0 shadow-sm" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="card-body text-center p-5">
              <i className="bi bi-exclamation-triangle display-1 text-warning mb-3 d-block"></i>
              <h2 className="fw-bold mb-2">Something went wrong</h2>
              <p className="text-muted mb-4">
                An unexpected error occurred. Please try again.
              </p>
              <div className="d-flex justify-content-center gap-2">
                <Link to="/purpleit/" className="btn btn-primary" onClick={this.handleReset}>
                  <i className="bi bi-house me-2"></i>Go Home
                </Link>
                <button className="btn btn-outline-secondary" onClick={this.handleReset}>
                  <i className="bi bi-arrow-clockwise me-2"></i>Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
