import { getApiUrl } from '../config/api';

const BASE_URL = getApiUrl();

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
}

export interface ApiErrorResponse {
	success: false;
	message: string;
	errors?: Record<string, string[]>;
}

export interface AuthData {
	user: {
		id: string;
		name: string;
		email: string;
	};
	token: string;
}


class AuthService {
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
				const normalizedError: ApiErrorResponse = {
					success: false,
					message:
						(data && (data.message || data.error)) ||
						`HTTP error! status: ${response.status}`,
					errors: data && data.errors ? data.errors : undefined,
				};
				// Throw a typed error object to be handled by callers
				throw normalizedError as unknown as Error;
			}

			// Return the data directly from successful response
			return data.success ? data.data : data;
		} catch (error: any) {
			// Re-throw normalized errors from above
			if (error && error.success === false) {
				throw error as ApiErrorResponse;
			}

			if (error instanceof Error) {
				// Wrap generic errors into ApiErrorResponse for a consistent contract
				const wrapped: ApiErrorResponse = { success: false, message: error.message };
				throw wrapped as unknown as Error;
			}
			const fallback: ApiErrorResponse = { success: false, message: 'An unexpected error occurred' };
			throw fallback as unknown as Error;
		}
	}

	async login(credentials: LoginRequest): Promise<AuthData> {
		return this.makeRequest<AuthData>('/auth/login', {
			method: 'POST',
			body: JSON.stringify(credentials),
		});
	}

	async register(userData: RegisterRequest): Promise<AuthData> {
		return this.makeRequest<AuthData>('/auth/register', {
			method: 'POST',
			body: JSON.stringify(userData),
		});
	}
}

export const authService = new AuthService(BASE_URL);
