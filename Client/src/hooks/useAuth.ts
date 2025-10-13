import { useState, useEffect } from 'react';
import { authStorage, User } from '../services/authStorage';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [isAuthenticated, user] = await Promise.all([
        authStorage.isAuthenticated(),
        authStorage.getUser(),
      ]);

      setAuthState({
        isAuthenticated,
        user,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  };

  const login = async (user: User, token: string) => {
    try {
      await Promise.all([
        authStorage.setUser(user),
        authStorage.setToken(token),
      ]);

      setAuthState({
        isAuthenticated: true,
        user,
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
        user: null,
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
