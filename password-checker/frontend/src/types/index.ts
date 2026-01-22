export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  requiresTwoFactor: boolean;
  userId?: string;
  access_token?: string;
  user?: User;
  message?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
  isCommon: boolean;
  isPwned?: boolean;
  pwnedCount?: number;
  crackTime: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  message: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginData) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}