import { AuthService } from './authService';

interface GroupMember {
  user: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  role: 'admin' | 'member';
  joinedAt: string;
}

interface Group {
  _id: string;
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
  totalExpenses?: number;
  totalAmount?: number;
}

interface GroupExpense {
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
  group: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateGroupData {
  name: string;
  description?: string;
  members?: string[]; // Array of user IDs
}

interface UpdateGroupData {
  name?: string;
  description?: string;
}

interface GroupBalance {
  member: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  balance: number;
  message: string;
}

export class GroupService {
  // Get user's groups
  static async getUserGroups(): Promise<Group[]> {
    try {
      const response = await AuthService.makeAuthenticatedRequest('/groups', {
        method: 'GET',
      });
      
      // Transform the data to include both _id and id for compatibility
      return response.data.map((group: any) => ({
        ...group,
        id: group._id,
      }));
    } catch (error) {
      console.error('Get user groups error:', error);
      throw error;
    }
  }

  // Get group by ID
  static async getGroupById(groupId: string): Promise<Group> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/groups/${groupId}`, {
        method: 'GET',
      });
      
      return {
        ...response.data,
        id: response.data._id,
      };
    } catch (error) {
      console.error('Get group by ID error:', error);
      throw error;
    }
  }

  // Create new group
  static async createGroup(groupData: CreateGroupData): Promise<Group> {
    try {
      const response = await AuthService.makeAuthenticatedRequest('/groups', {
        method: 'POST',
        body: JSON.stringify({
          ...groupData,
          // Note: Backend should automatically add the authenticated user as admin/creator
          // The members array contains additional friends to add as regular members
        }),
      });
      
      return {
        ...response.data,
        id: response.data._id,
      };
    } catch (error) {
      console.error('Create group error:', error);
      throw error;
    }
  }

  // Update group
  static async updateGroup(groupId: string, updateData: UpdateGroupData): Promise<Group> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      return {
        ...response.data,
        id: response.data._id,
      };
    } catch (error) {
      console.error('Update group error:', error);
      throw error;
    }
  }

  // Delete group
  static async deleteGroup(groupId: string): Promise<void> {
    try {
      await AuthService.makeAuthenticatedRequest(`/groups/${groupId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete group error:', error);
      throw error;
    }
  }

  // Join group
  static async joinGroup(groupId: string): Promise<void> {
    try {
      await AuthService.makeAuthenticatedRequest(`/groups/${groupId}/join`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Join group error:', error);
      throw error;
    }
  }

  // Leave group
  static async leaveGroup(groupId: string): Promise<void> {
    try {
      await AuthService.makeAuthenticatedRequest(`/groups/${groupId}/leave`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Leave group error:', error);
      throw error;
    }
  }

  // Add member to group
  static async addMember(groupId: string, userId: string): Promise<void> {
    try {
      await AuthService.makeAuthenticatedRequest(`/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Add member error:', error);
      throw error;
    }
  }

  // Remove member from group
  static async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      await AuthService.makeAuthenticatedRequest(`/groups/${groupId}/members/${userId}`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Remove member error:', error);
      throw error;
    }
  }

  // Search groups
  static async searchGroups(query: string): Promise<Group[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const response = await AuthService.makeAuthenticatedRequest(`/groups/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
      });
      
      return response.data.map((group: any) => ({
        ...group,
        id: group._id,
      }));
    } catch (error) {
      console.error('Search groups error:', error);
      throw error;
    }
  }

  // Get group expenses
  static async getGroupExpenses(groupId: string, options: {
    page?: number;
    limit?: number;
    settled?: boolean;
  } = {}): Promise<{
    success: boolean;
    data: GroupExpense[];
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
      if (options.settled !== undefined) queryParams.append('settled', options.settled.toString());

      const response = await AuthService.makeAuthenticatedRequest(`/expenses/group/${groupId}?${queryParams.toString()}`, {
        method: 'GET',
      });
      
      return response;
    } catch (error) {
      console.error('Get group expenses error:', error);
      throw error;
    }
  }

  // Get group balance summary
  static async getGroupBalance(groupId: string): Promise<{
    group: Group;
    balances: { [userId: string]: number };
    totalExpenses: number;
  }> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/expenses/group/${groupId}/balance`, {
        method: 'GET',
      });
      
      return response.data;
    } catch (error) {
      console.error('Get group balance error:', error);
      throw error;
    }
  }

  // Get user's balance in a group
  static async getUserGroupBalance(groupId: string): Promise<GroupBalance[]> {
    try {
      const response = await AuthService.makeAuthenticatedRequest(`/groups/${groupId}/balances`, {
        method: 'GET',
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Get user group balance error:', error);
      throw error;
    }
  }

  // Check if user is group admin
  static isGroupAdmin(group: Group, userId: string): boolean {
    const member = group.members.find(m => m.user._id === userId);
    return member?.role === 'admin' || group.createdBy._id === userId;
  }

  // Check if user is group member
  static isGroupMember(group: Group, userId: string): boolean {
    return group.members.some(m => m.user._id === userId);
  }

  // Get member role in group
  static getMemberRole(group: Group, userId: string): 'admin' | 'member' | null {
    const member = group.members.find(m => m.user._id === userId);
    if (!member) return null;
    
    // Creator is always admin
    if (group.createdBy._id === userId) return 'admin';
    
    return member.role;
  }

  // Format group member count
  static formatMemberCount(count: number): string {
    if (count === 1) return '1 member';
    return `${count} members`;
  }

  // Format group expense count
  static formatExpenseCount(count: number): string {
    if (count === 0) return 'No expenses';
    if (count === 1) return '1 expense';
    return `${count} expenses`;
  }

  // Calculate total group amount
  static calculateGroupTotal(expenses: GroupExpense[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  // Get group statistics
  static getGroupStats(group: Group, expenses: GroupExpense[]): {
    totalAmount: number;
    totalExpenses: number;
    settledExpenses: number;
    pendingExpenses: number;
    memberCount: number;
  } {
    const totalAmount = this.calculateGroupTotal(expenses);
    const totalExpenses = expenses.length;
    const settledExpenses = expenses.filter(e => e.isSettled).length;
    const pendingExpenses = totalExpenses - settledExpenses;
    const memberCount = group.members.length;

    return {
      totalAmount,
      totalExpenses,
      settledExpenses,
      pendingExpenses,
      memberCount,
    };
  }
}

export type { 
  Group, 
  GroupMember, 
  GroupExpense, 
  CreateGroupData, 
  UpdateGroupData, 
  GroupBalance 
};