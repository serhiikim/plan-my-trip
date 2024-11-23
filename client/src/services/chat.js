// src/services/chat.js
import { api } from './api';

class ChatService {
  async sendMessage(message) {
    const response = await api.post('/chat/message', { message });
    return response.data;
  }

  async getChatHistory() {
    const response = await api.get('/chat/history');
    return response.data;
  }
}

export const chatService = new ChatService();