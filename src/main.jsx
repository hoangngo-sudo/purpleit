import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import App from './App.jsx';

import HomePage from './routes/HomePage.jsx';
import CreatePage from './routes/CreatePage.jsx';
import EditPage from './routes/EditPage.jsx';
import DetailPage from './routes/DetailPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/purpleit/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="/purpleit/create" element={<CreatePage />} />
          <Route path="/purpleit/edit/:user_id" element={<EditPage />} />
          <Route path="/purpleit/:user_id" element={<DetailPage />} />
        </Route>
      </Routes>
    </Router>
  </StrictMode>,
)