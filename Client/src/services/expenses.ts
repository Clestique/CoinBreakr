import { authStorage } from './authStorage';
import { makeApiRequest } from '../config/api';
import type { ApiErrorResponse } from './auth';

export interface ExpenseUser {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
}

export interface SplitWith {
    user: ExpenseUser;
    amount: number;
    settled: boolean;
    settledAt?: string;
}

export interface Expense {
    _id: string;
    title: string;
    description?: string;
    amount: number;
    date: string;
    category: string;
    createdBy: ExpenseUser;
    paidBy: ExpenseUser;
    splitWith: SplitWith[];
    isSettled: boolean;
    groupId?: string; // Group ID if this is a group expense
}

export interface ExpensesResponse {
    success: boolean;
    data: Expense[];
    pagination: {
        current: number;
        limit: number;
        pages: number;
        total: number;
    };
}

export interface ExpenseFilters {
    page?: number;
    limit?: number;
    friendId?: string;
    settled?: boolean;
}

class ExpensesService {
    private async makeAuthedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = await authStorage.getToken();

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
            const response = await makeApiRequest(endpoint, config);

            let data: any = null;
            try {
                data = await response.json();
            } catch (_) {
                data = null;
            }

            if (!response.ok) {
                const normalized: ApiErrorResponse = {
                    success: false,
                    message: (data && (data.message || data.error)) || `HTTP error! status: ${response.status}`,
                    errors: data && data.errors ? data.errors : undefined,
                };
                throw normalized as unknown as Error;
            }

            return data;
        } catch (error: any) {
            if (error && error.success === false) throw error as ApiErrorResponse;
            const fallback: ApiErrorResponse = { success: false, message: error?.message || 'An unexpected error occurred' };
            throw fallback as unknown as Error;
        }
    }

    async getUserExpenses(filters: ExpenseFilters = {}): Promise<ExpensesResponse> {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.friendId) params.append('friendId', filters.friendId);
        if (filters.settled !== undefined) params.append('settled', filters.settled.toString());

        const queryString = params.toString();
        const endpoint = `/expenses${queryString ? `?${queryString}` : ''}`;

        return this.makeAuthedRequest<ExpensesResponse>(endpoint, {
            method: 'GET',
        });
    }

    async getExpenseById(expenseId: string): Promise<Expense> {
        const response = await this.makeAuthedRequest<any>(`/expenses/${expenseId}`, {
            method: 'GET',
        });

        // Handle different response structures - return the data field if it exists
        return response.data || response;
    }

    async createExpense(expenseData: {
        description: string;
        amount: number;
        currency?: string;
        date: string;
        category: string;
        paidBy?: string;
        splitWith: Array<{ user: string; amount: number }>;
        notes?: string;
        groupId?: string; // Optional group ID for group expenses
    }): Promise<Expense> {
        return this.makeAuthedRequest<Expense>('/expenses', {
            method: 'POST',
            body: JSON.stringify(expenseData),
        });
    }

    async updateExpense(expenseId: string, expenseData: Partial<Expense>): Promise<Expense> {
        const response = await this.makeAuthedRequest<any>(`/expenses/${expenseId}`, {
            method: 'PUT',
            body: JSON.stringify(expenseData),
        });

        // Handle different response structures - return the data field if it exists
        return response.data || response;
    }

    async deleteExpense(expenseId: string): Promise<void> {
        return this.makeAuthedRequest<void>(`/expenses/${expenseId}`, {
            method: 'DELETE',
        });
    }

    async settleExpense(id: string): Promise<Expense> {
        return this.makeAuthedRequest<Expense>(`/expenses/${id}/settle`, {
            method: 'PATCH',
        });
    }

    async getGroupExpenses(groupId: string, filters: ExpenseFilters = {}): Promise<ExpensesResponse> {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.settled !== undefined) params.append('settled', filters.settled.toString());

        const queryString = params.toString();
        const endpoint = `/expenses/group/${groupId}${queryString ? `?${queryString}` : ''}`;
        return this.makeAuthedRequest<ExpensesResponse>(endpoint, {
            method: 'GET',
        });
    }
}

export const expensesService = new ExpensesService();