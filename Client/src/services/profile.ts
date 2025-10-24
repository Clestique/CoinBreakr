import { authStorage } from './authStorage';
import { getApiUrl } from '../config/api';
import type { ApiErrorResponse } from './auth';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  phoneNumber?: string;
  createdAt?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

class ProfileService {
  private baseURL: string;

  constructor() {
    this.baseURL = getApiUrl();
  }

  private async makeAuthedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await authStorage.getToken();
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);

      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
        const normalizedError: ApiErrorResponse = {
          success: false,
          message: data?.message || `HTTP error! status: ${response.status}`,
          errors: data?.errors
        };
        throw normalizedError as unknown as Error;
      }

      // Return the data directly from successful response
      // Handle both wrapped ({success: true, data: ...}) and direct response formats
      if (data && typeof data === 'object') {
        if (data.success === true && data.data) {
          return data.data;
        } else if (data.success === false) {
          // This should have been caught above, but just in case
          const errorResponse: ApiErrorResponse = {
            success: false,
            message: data.message || 'Unknown error',
            errors: data.errors
          };
          throw errorResponse as unknown as Error;
        } else {
          // Direct data response (no wrapper)
          return data;
        }
      }
      return data;
    } catch (error: any) {
      if (error && error.success === false) {
        throw error as ApiErrorResponse;
      }
      const fallback: ApiErrorResponse = {
        success: false,
        message: error?.message || 'An unexpected error occurred'
      };
      throw fallback as unknown as Error;
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.makeAuthedRequest<UserProfile>('/users/profile', {
      method: 'GET'
    });
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<any> {
    const result = await this.makeAuthedRequest<any>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
    return result;
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const result = await this.makeAuthedRequest<ChangePasswordResponse>('/users/change-password', {
      method: 'PATCH',
      body: JSON.stringify(passwordData)
    });
    return result;
  }
}

export const profileService = new ProfileService();
