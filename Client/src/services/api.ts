const BASE_URL = 'http://34.41.49.170:3000/v1';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    token: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Try to parse JSON; guard against empty body
      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
        // Normalize error shape to include field errors if provided by backend
        const normalizedError: ApiError = {
          success: false,
          message:
            (data && (data.message || data.error)) ||
            `HTTP error! status: ${response.status}`,
          errors: data && data.errors ? data.errors : undefined,
        };
        // Throw a typed error object to be handled by callers
        throw normalizedError as unknown as Error;
      }

      return data as T;
    } catch (error: any) {
      // Re-throw normalized errors from above
      if (error && error.success === false) {
        throw error as ApiError;
      }

      if (error instanceof Error) {
        // Wrap generic errors into ApiError for a consistent contract
        const wrapped: ApiError = { success: false, message: error.message };
        throw wrapped as unknown as Error;
      }
      const fallback: ApiError = { success: false, message: 'An unexpected error occurred' };
      throw fallback as unknown as Error;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService(BASE_URL);
