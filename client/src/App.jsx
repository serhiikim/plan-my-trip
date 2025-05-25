// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from '@/components/ui/toaster';
import { StoreProvider } from './store/store';
import { auth } from './services/auth';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import PlanPage from './pages/PlanPage';
import ItinerariesPage from './pages/ItinerariesPage';
import LandingPage from './pages/LandingPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function ProtectedRoute({ children }) {
  return auth.isAuthenticated() ? children : <Navigate to="/" replace />;
}

function App() {
  useEffect(() => {
    // Identify existing user if they're already logged in
    const user = auth.getUser();
    if (user) {
      const distinctId = localStorage.getItem('posthog_distinct_id') || user.id;
      posthog.identify(
        distinctId,
        {
          email: user.email,
          name: user.name,
          picture: user.picture,
          google_id: user.id,
          last_login: new Date().toISOString()
        }
      );
    }
  }, []);

  return (
    <StoreProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/chat"
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