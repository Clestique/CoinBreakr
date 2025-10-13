import { authStorage } from './authStorage';

const BASE_URL = 'http://104.197.213.168:3000/v1';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  imageUrl?: string;
  lastLogin?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: UserProfile;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  imageUrl?: string;
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

    // Debug: log token being used
    console.log('[ProfileService] Using token:', token);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
      console.log('[ProfileService] Making request to:', url);
      console.log('[ProfileService] Request config:', config);
      const response = await fetch(url, config);

      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
        console.log('[ProfileService] Request failed', {
          url,
          status: response.status,
          data,
        });
        const normalized: ApiErrorProfile = {
          success: false,
          message: (data && (data.message || data.error)) || `HTTP error! status: ${response.status}`,
          errors: data && data.errors ? data.errors : undefined,
        };
        throw normalized as unknown as Error;
      }

      return data as T;
    } catch (error: any) {
      console.log('[ProfileService] Caught error', error);
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
}

export const profileService = new ProfileService(BASE_URL);
