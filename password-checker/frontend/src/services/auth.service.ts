import api from './api';
import { LoginData, RegisterData, LoginResponse, TwoFactorSetup } from '../types';

export const authService = {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async enable2FA(password: string): Promise<TwoFactorSetup> {
    const response = await api.post('/auth/2fa/enable', { password });
    return response.data;
  },

  async verify2FA(userId: string, code: string): Promise<LoginResponse> {
    const response = await api.post('/auth/2fa/verify', { userId, code });
    return response.data;
  },

  async disable2FA(password: string, code: string) {
    const response = await api.post('/auth/2fa/disable', { password, code });
    return response.data;
  },
};
