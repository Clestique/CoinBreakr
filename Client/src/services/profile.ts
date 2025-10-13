import { authStorage } from './authStorage';

const BASE_URL = 'http://104.197.213.168:3000/v1';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: UserProfile;
}

export interface UpdateProfileRequest {
  name?: string;
  phoneNumber?: string; // compatibility with alternative backend field names
  profileImage?: string; // base64 data URI
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiErrorProfile {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

class ProfileService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
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
        const normalized: ApiErrorProfile = {
          success: false,
          message: (data && (data.message || data.error)) || `HTTP error! status: ${response.status}`,
          errors: data && data.errors ? data.errors : undefined,
        };
        throw normalized as unknown as Error;
      }

      return data as T;
    } catch (error: any) {
      if (error && error.success === false) throw error as ApiErrorProfile;
      const fallback: ApiErrorProfile = { success: false, message: error?.message || 'An unexpected error occurred' };
      throw fallback as unknown as Error;
    }
  }

  getProfile(): Promise<ProfileResponse> {
    return this.makeAuthedRequest<ProfileResponse>('/users/profile', { method: 'GET' });
  }

  updateProfile(payload: UpdateProfileRequest): Promise<ProfileResponse> {
    return this.makeAuthedRequest<ProfileResponse>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  changePassword(payload: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    return this.makeAuthedRequest<{ success: boolean; message: string }>('/users/change-password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  logout(): Promise<{ success: boolean; message: string }> {
    return this.makeAuthedRequest<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  requestAccountClosure(): Promise<{ success: boolean; message: string }> {
    return this.makeAuthedRequest<{ success: boolean; message: string }>('/users/request-closure', {
      method: 'POST',
    });
  }
}

export const profileService = new ProfileService(BASE_URL);
