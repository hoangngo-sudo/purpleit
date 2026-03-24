import { Link, Outlet } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from './contexts/useAuth';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  
  const [searchInput, setSearchInput] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const mobileSearchRef = useRef(null);

  // Auto-focus the mobile search input when scene 2 opens
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const renderAvatar = () => {
    if (loading) return null;
    if (user && profile) {
      return (
        <Link
          className="d-flex align-items-center"
          to={`/purpleit/profile/${user.id}`}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="navbar-avatar rounded-circle"
              style={{ width: '36px', height: '36px' }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <i className="bi bi-person-circle text-white fs-4"></i>
          )}
        </Link>
      );
    }
    return (
      <Link
        className="btn btn-outline-light fw-semibold"
        to="/purpleit/login"
      >
        <i className="bi bi-box-arrow-in-right me-2"></i>Log In
      </Link>
    );
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-primary sticky-top py-2">
        <div className="container-fluid">

          {/* ── Desktop navbar (lg+): brand | search | create + avatar ── */}
          <div className="d-none d-lg-flex align-items-center w-100">
            <Link className="navbar-brand fw-bold m-0" to="/purpleit/">
              p/webdev
            </Link>

            <div className="d-flex flex-grow-1 justify-content-center">
              <form
                className="d-flex w-100"
                role="search"
                style={{ maxWidth: '400px' }}
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  className="form-control"
                  type="search"
                  placeholder="Search posts here..."
                  aria-label="Search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </form>
            </div>

            <div className="d-flex align-items-center gap-3">
              {!loading && user && profile && (
                <Link
                  className="btn btn-light text-primary"
                  to="/purpleit/create"
                >
                  <i className="bi bi-plus-circle me-2"></i>Create Post
                </Link>
              )}
              {renderAvatar()}
            </div>
          </div>

          {/* ── Mobile navbar (<lg): two-scene layout ── */}
          <div className="d-flex d-lg-none align-items-center w-100">
            {!mobileSearchOpen ? (
              /* Scene 1: brand | search-icon  create  avatar */
              <>
                <Link className="navbar-brand fw-bold m-0 me-auto" to="/purpleit/">
                  p/webdev
                </Link>
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-outline-light"
                    onClick={() => setMobileSearchOpen(true)}
                    aria-label="Open search"
                  >
                    <i className="bi bi-search"></i>
                  </button>
                  {!loading && user && profile && (
                    <Link
                      className="btn btn-light text-primary"
                      to="/purpleit/create"
                    >
                      <i className="bi bi-plus-circle me-2"></i>Create
                    </Link>
                  )}
                  {renderAvatar()}
                </div>
              </>
            ) : (
              /* Scene 2: back-button | wide search bar */
              <>
                <button
                  className="btn btn-outline-light me-2 flex-shrink-0"
                  onClick={() => setMobileSearchOpen(false)}
                  aria-label="Close search"
                >
                  <i className="bi bi-arrow-left"></i>
                </button>
                <form
                  className="d-flex flex-grow-1"
                  role="search"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    ref={mobileSearchRef}
                    className="form-control"
                    type="search"
                    placeholder="Search posts..."
                    aria-label="Search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </form>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-6 py-2 py-md-3 py-lg-4 px-2 px-md-3">
            <ErrorBoundary>
              <Outlet context={[searchInput, setSearchInput]} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
