import { v4 as uuidv4 } from 'uuid';

class PlacesSessionManager {
  constructor() {
    this.currentToken = null;
    this.tokenCreationTime = null;
    this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  }

  getToken() {
    const now = Date.now();
    if (!this.currentToken || !this.tokenCreationTime || 
        (now - this.tokenCreationTime) > this.SESSION_TIMEOUT) {
      this.currentToken = uuidv4();
      this.tokenCreationTime = now;
    }
    return this.currentToken;
  }

  resetToken() {
    this.currentToken = null;
    this.tokenCreationTime = null;
  }
}

export const placesSessionManager = new PlacesSessionManager();