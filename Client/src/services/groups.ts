import { authStorage } from './authStorage';
import { getApiUrl } from '../config/api';
import type { ApiErrorResponse } from './auth';

const BASE_URL = getApiUrl();

export interface GroupMember {
    _id: string;
    user: string;
    role: string;
    joinedAt: string;
}

export interface Group {
    _id: string;
    name: string;
    description?: string;
    members: GroupMember[];
    createdBy: string | { _id: string; name: string; email: string };
    createdAt: string;
    updatedAt: string;
}

export interface CreateGroupData {
    name: string;
    description?: string;
    members?: string[];
}

export interface UpdateGroupData {
    name?: string;
    description?: string;
    members?: string[];
}

class GroupsService {
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

            } catch (parseError) {

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

            // Handle different response structures
            if (data && typeof data === 'object') {
                // If response has success field and it's false, treat as error
                if (data.success === false) {
                    const errorResponse: ApiErrorResponse = {
                        success: false,
                        message: data.message || 'Server error',
                        errors: data.errors || undefined,
                    };
                    throw errorResponse as unknown as Error;
                }

                // Return the data field if it exists, otherwise return the whole response
                return data.data || data;
            }

            return data;
        } catch (error: any) {
            if (error && error.success === false) throw error as ApiErrorResponse;
            const fallback: ApiErrorResponse = { success: false, message: error?.message || 'An unexpected error occurred' };
            throw fallback as unknown as Error;
        }
    }

    async getGroups(): Promise<{ groups: Group[] }> {
        try {
            const groups = await this.makeAuthedRequest<Group[]>('/groups', {
                method: 'GET',
            });
            return { groups: groups || [] };
        } catch (error) {

            return { groups: [] };
        }
    }

    async createGroup(groupData: CreateGroupData): Promise<Group> {
        try {
            const token = await authStorage.getToken();
            let currentUserId: string | null = null;

            if (token) {
                try {
                    // Decode JWT to get user ID (basic decode, not verification)
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    currentUserId = payload.userId || payload.id || payload.sub;
                } catch (e) {
                    console.log('Failed to decode token for user ID');
                }
            }

            // Ensure members array contains only valid string IDs and exclude current user
            // Server automatically adds non-friends as friends
            const sanitizedMembers = groupData.members?.filter(member => {
                const isValid = member && typeof member === 'string' && member.trim().length > 0;
                const isNotCurrentUser = !currentUserId || member !== currentUserId;
                return isValid && isNotCurrentUser;
            }).map(member => member.trim()) || [];

            const sanitizedGroupData = {
                ...groupData,
                members: sanitizedMembers
            };

            // Create the group - server will automatically add non-friends as friends
            const newGroup = await this.makeAuthedRequest<Group>('/groups', {
                method: 'POST',
                body: JSON.stringify(sanitizedGroupData),
            });

            return newGroup;
        } catch (error) {
            console.log('❌ Server error during group creation:', error);
            // Re-throw the original error to preserve server validation messages
            throw error;
        }
    }

    async updateGroup(groupId: string, updates: UpdateGroupData): Promise<Group> {
        try {
            const updatedGroup = await this.makeAuthedRequest<Group>(`/groups/${groupId}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
            });
            return updatedGroup;
        } catch (error) {

            throw new Error('Failed to update group');
        }
    }

    async deleteGroup(groupId: string): Promise<void> {
        try {
            await this.makeAuthedRequest<void>(`/groups/${groupId}`, {
                method: 'DELETE',
            });
        } catch (error) {

            throw new Error('Failed to delete group');
        }
    }

    async getGroupById(groupId: string): Promise<Group> {
        try {
            const group = await this.makeAuthedRequest<Group>(`/groups/${groupId}`, {
                method: 'GET',
            });
            return group;
        } catch (error) {

            throw new Error('Failed to get group');
        }
    }

    async addMemberToGroup(groupId: string, members: string[]): Promise<Group> {
        try {
            const updatedGroup = await this.makeAuthedRequest<Group>(`/groups/${groupId}/members`, {
                method: 'POST',
                body: JSON.stringify({ members }),
            });
            return updatedGroup;
        } catch (error) {

            throw new Error('Failed to add members to group');
        }
    }

    async removeMemberFromGroup(groupId: string, memberId: string): Promise<Group> {
        try {
            const updatedGroup = await this.makeAuthedRequest<Group>(`/groups/${groupId}/members/${memberId}`, {
                method: 'DELETE',
            });
            return updatedGroup;
        } catch (error) {

            throw new Error('Failed to remove member from group');
        }
    }
}

export const groupsService = new GroupsService(BASE_URL);