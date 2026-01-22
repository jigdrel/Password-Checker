import api from './api';
import { PasswordStrength } from '../types';

export const passwordService = {
  async checkPassword(password: string): Promise<PasswordStrength> {
    const response = await api.post('/password/check', { password });
    return response.data;
  },

  async checkPwnedPassword(password: string): Promise<{ isPwned: boolean; count: number }> {
    const response = await api.post('/password/check-pwned', { password });
    return response.data;
  },
};