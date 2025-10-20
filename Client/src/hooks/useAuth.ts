import { useState, useEffect } from 'react';
import { authStorage } from '../services/authStorage';

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userId: null,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [isAuthenticated, userId] = await Promise.all([
        authStorage.isAuthenticated(),
        authStorage.getUserId(),
      ]);

      setAuthState({
        isAuthenticated,
        userId,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        isAuthenticated: false,
        userId: null,
        isLoading: false,
      });
    }
  };

  const login = async (userId: string, token: string) => {
    try {
      await Promise.all([
        authStorage.setUserId(userId),
        authStorage.setToken(token),
      ]);

      setAuthState({
        isAuthenticated: true,
        userId,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authStorage.clearAuth();
      setAuthState({
        isAuthenticated: false,
        userId: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return {
    ...authState,
    login,
    logout,
    checkAuthStatus,
  };
};