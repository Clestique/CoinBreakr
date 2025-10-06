import { AuthService } from './authService';

interface ExpenseDetail {
  _id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  paidBy: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  splitWith: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
    amount: number;
    settled: boolean;
  }>;
  isSettled: boolean;
  category: string;
  group?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ExpenseResponse {
  success: boolean;
  data: ExpenseDetail;
}

interface ExpenseUpdateData {
  description?: string;
  amount?: number;
  currency?: string;
  category?: string;
  date?: string;
  splitWith?: Array<{
    user: string;
    amount: number;
  }>;
}

export class ExpenseService {
  // Get expense details by ID
  static async getExpenseById(expenseId: string): Promise<ExpenseDetail> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/expenses/${expenseId}`, {
        method: 'GET',
      });
      
      return response.data;
    } catch (error) {
      console.error('Get expense by ID error:', error);
      throw error;
    }
  }

  // Update expense
  static async updateExpense(expenseId: string, updateData: ExpenseUpdateData): Promise<ExpenseDetail> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return response.data;
    } catch (error) {
      console.error('Update expense error:', error);
      throw error;
    }
  }

  // Delete expense
  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      await AuthService.makeAuthenticatedRequest(`/expenses/${expenseId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete expense error:', error);
      throw error;
    }
  }

  // Settle expense split with a specific user
  static async settleExpenseSplit(expenseId: string, userId: string): Promise<ExpenseDetail> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/expenses/${expenseId}/settle`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      
      return response.data;
    } catch (error) {
      console.error('Settle expense split error:', error);
      throw error;
    }
  }

  // Create new expense
  static async createExpense(expenseData: {
    description: string;
    amount: number;
    currency?: string;
    category?: string;
    date?: string;
    splitWith: Array<{
      user: string;
      amount: number;
    }>;
    groupId?: string;
  }): Promise<ExpenseDetail> {
    try {
      const response = await AuthService.makeAuthenticatedRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
      
      return response.data;
    } catch (error) {
      console.error('Create expense error:', error);
      throw error;
    }
  }

  // Get user's expenses with pagination and filters
  static async getUserExpenses(options: {
    page?: number;
    limit?: number;
    friendId?: string;
    settled?: boolean;
  } = {}): Promise<{
    success: boolean;
    data: ExpenseDetail[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.friendId) queryParams.append('friendId', options.friendId);
      if (options.settled !== undefined) queryParams.append('settled', options.settled.toString());

      const response = await AuthService.makeAuthenticatedRequest(`/expenses?${queryParams.toString()}`, {
        method: 'GET',
      });
      
      return response;
    } catch (error) {
      console.error('Get user expenses error:', error);
      throw error;
    }
  }

  // Format expense amount for display
  static formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Calculate user's share in an expense
  static getUserShare(expense: ExpenseDetail, userId: string): {
    amount: number;
    settled: boolean;
    isPayer: boolean;
  } {
    const isPayer = expense.paidBy._id === userId;
    const userSplit = expense.splitWith.find(split => split.user._id === userId);
    
    return {
      amount: userSplit?.amount || 0,
      settled: userSplit?.settled || false,
      isPayer,
    };
  }

  // Get expense status for a user
  static getExpenseStatus(expense: ExpenseDetail, userId: string): {
    status: 'owed' | 'owes' | 'settled' | 'paid';
    amount: number;
    message: string;
  } {
    const userShare = this.getUserShare(expense, userId);
    
    if (userShare.isPayer) {
      const totalOwed = expense.splitWith
        .filter(split => split.user._id !== userId && !split.settled)
        .reduce((sum, split) => sum + split.amount, 0);
      
      if (totalOwed === 0) {
        return {
          status: 'settled',
          amount: 0,
          message: 'All settled up'
        };
      }
      
      return {
        status: 'owed',
        amount: totalOwed,
        message: `You are owed ${this.formatAmount(totalOwed, expense.currency)}`
      };
    } else {
      if (userShare.settled) {
        return {
          status: 'settled',
          amount: 0,
          message: 'Settled'
        };
      }
      
      return {
        status: 'owes',
        amount: userShare.amount,
        message: `You owe ${this.formatAmount(userShare.amount, expense.currency)}`
      };
    }
  }
}

export type { ExpenseDetail, ExpenseResponse, ExpenseUpdateData };
