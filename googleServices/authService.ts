import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.0.241:3000/v1';
const TOKEN_KEY = 'auth_token';

interface SignUpData {
  name: string;
  email: string;
  password: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    message: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  // Store authentication token
  static async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  // Get stored authentication token
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Remove authentication token
  static async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  // Make authenticated API request
  static async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, remove it
        await this.removeToken();
        throw new Error('Authentication expired. Please sign in again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {};
    }

    // Check if response has content to parse
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
  }

  // Sign up new user
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Sign up failed');
      }

      const authResponse: AuthResponse = await response.json();
      
      if (authResponse.success && authResponse.data.token) {
        await this.storeToken(authResponse.data.token);
      }

      return authResponse;
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  // Sign in existing user
  static async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Sign in failed');
      }

      const authResponse: AuthResponse = await response.json();
      
      if (authResponse.success && authResponse.data.token) {
        await this.storeToken(authResponse.data.token);
      }

      return authResponse;
    } catch (error) {
      console.error('Sign in error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  // Sign out user
  static async signOut(): Promise<void> {
    try {
      const token = await this.getToken();
      // if (token) {
      //   // Optional: Call server to invalidate token
      //   try {
      //     await fetch(`${API_BASE_URL}/auth/signout`, {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json',
      //         Authorization: `Bearer ${token}`,
      //       },
      //     });
      //   } catch (error) {
      //     console.warn('Failed to notify server of sign out:', error);
      //   }
      // }
      
      await this.removeToken();
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  // Get current user profile
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await this.makeAuthenticatedRequest('/users/profile', {
        method: 'GET',
      });
      return response.data; // Handle different response structures
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await this.makeAuthenticatedRequest('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data; // Handle different response structures
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Change password
  static async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      await this.makeAuthenticatedRequest('/users/change-password', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}