import { AuthService } from './authService';

interface Friend {
  _id: string;
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface SearchUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface FriendBalance {
  friend: Friend;
  balance: number;
  message: string;
}

interface ExpenseResponse {
  success: boolean;
  data: any[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
  };
}

export class FriendsService {
  // Get current user's friends list
  static async getFriends(): Promise<Friend[]> {
    try {
      const response = await AuthService.makeAuthenticatedRequest('/users/friends', {
        method: 'GET',
      });
      
      // Transform the data to include both _id and id for compatibility
      return response.data.map((friend: any) => ({
        ...friend,
        id: friend._id,
      }));
    } catch (error) {
      console.error('Get friends error:', error);
      throw error;
    }
  }

  // Search for users by name or email
  static async searchUsers(query: string): Promise<SearchUser[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const response = await AuthService.makeAuthenticatedRequest(`/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // Add a friend
  static async addFriend(friendId: string): Promise<void> {
    try {
      await AuthService.makeAuthenticatedRequest('/users/friends', {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      });
    } catch (error) {
      console.error('Add friend error:', error);
      throw error;
    }
  }

  // Remove a friend
  static async removeFriend(friendId: string): Promise<void> {
    try {
      await AuthService.makeAuthenticatedRequest(`/users/friends/${friendId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Remove friend error:', error);
      throw error;
    }
  }

  // Get balance with a specific friend
  static async getFriendBalance(friendId: string): Promise<FriendBalance> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/users/friends/${friendId}/balance`, {
        method: 'GET',
      });
      
      return response.data;
    } catch (error) {
      console.error('Get friend balance error:', error);
      throw error;
    }
  }

  // Get all balances with friends
  static async getAllBalances(): Promise<FriendBalance[]> {
    try {
      const response = await AuthService.makeAuthenticatedRequest('/users/balances', {
        method: 'GET',
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Get all balances error:', error);
      throw error;
    }
  }

  // Get expenses between user and a specific friend
  static async getExpensesWithFriend(friendId: string, page: number = 1, limit: number = 10): Promise<ExpenseResponse> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/expenses?friendId=${friendId}&page=${page}&limit=${limit}`, {
        method: 'GET',
      });
      
      return response;
    } catch (error) {
      console.error('Get expenses with friend error:', error);
      throw error;
    }
  }

  // Get friends with their balances combined
  static async getFriendsWithBalances(): Promise<(Friend & { balance?: number; balanceMessage?: string })[]> {
    try {
      const [friends, balances] = await Promise.all([
        this.getFriends(),
        this.getAllBalances()
      ]);

      // Create a map of friend ID to balance info
      const balanceMap = new Map();
      balances.forEach(balance => {
        balanceMap.set(balance.friend._id, {
          balance: balance.balance,
          balanceMessage: balance.message
        });
      });

      // Merge friends with their balance information
      return friends.map(friend => {
        const balanceInfo = balanceMap.get(friend._id);
        return {
          ...friend,
          balance: balanceInfo?.balance || 0,
          balanceMessage: balanceInfo?.balanceMessage || 'You are settled up'
        };
      });
    } catch (error) {
      console.error('Get friends with balances error:', error);
      throw error;
    }
  }
}

export type { Friend, SearchUser, FriendBalance, ExpenseResponse };