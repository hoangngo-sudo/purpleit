import { Link, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './contexts/useAuth';

const App = () => {
  
  const [searchInput, setSearchInput] = useState("");
  const { user, profile, loading } = useAuth();

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top py-3">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold m-0" to="/purpleit/">
            p/webdev
          </Link>
          
          <div className="d-flex flex-grow-1 justify-content-center mx-4">
            <form
              className="d-flex"
              role="search"
              style={{maxWidth: '400px', width: '100%'}}
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                className="form-control me-2"
                type="search"
                placeholder="Search posts here..."
                aria-label="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
          </div>

          <div className="d-flex flex-row align-items-center gap-3">
            {/* Auth-dependent UI */}
            {!loading && (
              <>
                {user && profile ? (
                  <>
                    <Link 
                      className="btn btn-light text-primary fw-semibold" 
                      to="/purpleit/create">
                      <i className="bi bi-plus-circle me-2"></i>Create Post
                    </Link>
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
                  </>
                ) : (
                  <Link
                    className="btn btn-outline-light fw-semibold"
                    to="/purpleit/login"
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i>Log In
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-6">
            <Outlet context={[searchInput, setSearchInput]} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
