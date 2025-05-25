// client/src/services/auth.js
import { api } from './api';
import posthog from 'posthog-js';

class AuthService {
  constructor() {
    this.user = JSON.parse(localStorage.getItem('user'));
  }

  async handleGoogleLogin(credential) {
    try {
      const response = await api.post('/auth/google', { credential });
      const { token, user } = response.data;
      
      const userData = {
        ...user,
        token
      };
      
      this.setUser(userData);
      
      // Get or create a persistent distinct ID
      const distinctId = localStorage.getItem('posthog_distinct_id') || user.id;
      localStorage.setItem('posthog_distinct_id', distinctId);
      
      // Identify user in PostHog with persistent distinct ID
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
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
    }
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    return this.user;
  }

  logout() {
    // Don't reset PostHog user, just clear the current user data
    this.user = null;
    localStorage.removeItem('user');
    // Note: We keep posthog_distinct_id in localStorage to maintain user identity
  }

  isAuthenticated() {
    return !!this.user;
  }
}

export const auth = new AuthService();