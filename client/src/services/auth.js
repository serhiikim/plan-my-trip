// client/src/services/auth.js
import { api } from './api';

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
    this.user = null;
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.user;
  }
}

export const auth = new AuthService();