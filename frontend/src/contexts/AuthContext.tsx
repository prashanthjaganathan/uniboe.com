import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { authService } from '@/services/auth.service';
import {
  UserResponse,
  UserLoginRequest,
  UserRegistrationRequest,
  TokenResponse,
  RegistrationConfirmationResponse,
} from '@/types/auth.types';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: UserLoginRequest) => Promise<void>;
  register: (
    data: UserRegistrationRequest
  ) => Promise<TokenResponse | RegistrationConfirmationResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (data: UserLoginRequest) => {
    const response = await authService.login(data);
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem('auth_token', response.access_token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
  };

  const register = async (
    data: UserRegistrationRequest
  ): Promise<TokenResponse | RegistrationConfirmationResponse> => {
    const response = await authService.register(data);

    if ('access_token' in response) {
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    }

    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
