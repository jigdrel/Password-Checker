import api from './api';
import { User } from '../types';

export const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
};