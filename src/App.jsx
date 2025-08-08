import { Link, Outlet } from 'react-router-dom';
import { useState } from 'react';

const App = () => {
  
  const [searchInput, setSearchInput] = useState("");

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top py-3">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold m-0" to="/purpleit/">
            p/webdev
          </Link>
          
          <div className="d-flex flex-grow-1 justify-content-center mx-4">
            <div className="input-group" style={{maxWidth: '400px'}}>
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search posts here..." 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)} 
              />
            </div>
          </div>

          <div className="navbar-nav flex-row">
            <Link 
              className="btn btn-light text-primary fw-semibold" 
              to="/purpleit/create">
              <i className="bi bi-plus-circle me-2"></i>Create Post
            </Link>
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
