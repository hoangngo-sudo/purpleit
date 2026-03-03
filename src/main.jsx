import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import App from './App.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

import HomePage from './routes/HomePage.jsx';
import CreatePage from './routes/CreatePage.jsx';
import EditPage from './routes/EditPage.jsx';
import DetailPage from './routes/DetailPage.jsx';
import LoginPage from './routes/LoginPage.jsx';
import ProfilePage from './routes/ProfilePage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/purpleit/" element={<App />}>
              <Route index element={<HomePage />} />
              <Route path="create" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
              <Route path="edit/:user_id" element={<ProtectedRoute><EditPage /></ProtectedRoute>} />
              <Route path="login" element={<LoginPage />} />
              <Route path="profile/:userId" element={<ProfilePage />} />
              <Route path=":user_id" element={<DetailPage />} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)