// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from '@/components/ui/toaster';
import { StoreProvider } from './store/store';
import { auth } from './services/auth';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import PlanPage from './pages/PlanPage';
import ItinerariesPage from './pages/ItinerariesPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function ProtectedRoute({ children }) {
  return auth.isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <StoreProvider>
      <GoogleOAuthProvider clientId='1033578669045-vhl44tbljn882e8qa1nqd57i0k0v3c5f.apps.googleusercontent.com'>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans/:planId"
              element={
                <ProtectedRoute>
                  <PlanPage />
                </ProtectedRoute>
              }
            />
            {/* Redirect /plan to chat page where user can start new plan */}
            <Route 
              path="/plan" 
              element={
                <ProtectedRoute>
                  <ItinerariesPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster />
        </Router>
      </GoogleOAuthProvider>
    </StoreProvider>
  );
}

export default App;