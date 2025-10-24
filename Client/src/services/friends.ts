import * as Contacts from 'expo-contacts';
import { authStorage } from './authStorage';
import { getApiUrl } from '../config/api';
import type { ApiErrorResponse } from './auth';

const BASE_URL = getApiUrl();

export interface Contact {
    id: string;
    name: string;
    phoneNumbers?: string[];
    emails?: string[];
}

export interface Friend {
    _id: string; // MongoDB field from server
    name: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
    hasTransactions: boolean;
    isContactSynced: boolean;
    isAppUser?: boolean;
    phone?: string; // Alternative field name for phone number
}

export interface PendingFriend {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    profileImage?: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export interface FriendsData {
    friends: Friend[];
    pendingFriends: PendingFriend[];
}

export interface AppUser {
    _id: string; // MongoDB uses _id
    name: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
    isFriend?: boolean; // This might be determined client-side
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    totalExpenses: number;
}

export interface SearchResult {
    friends: Friend[];
    groups: Group[];
    appUsers: AppUser[];
    contacts: Contact[];
}

class FriendsService {
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
                const normalized: ApiErrorResponse = {
                    success: false,
                    message: (data && (data.message || data.error)) || `HTTP error! status: ${response.status}`,
                    errors: data && data.errors ? data.errors : undefined,
                };
                throw normalized as unknown as Error;
            }

            // Return the data directly from successful response
            return data.success ? data.data : data;
        } catch (error: any) {
            if (error && error.success === false) throw error as ApiErrorResponse;
            const fallback: ApiErrorResponse = { success: false, message: error?.message || 'An unexpected error occurred' };
            throw fallback as unknown as Error;
        }
    }

    // Contact Permission Methods
    async requestContactPermission(): Promise<boolean> {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Error requesting contact permission:', error);
            return false;
        }
    }

    async checkContactPermission(): Promise<boolean> {
        try {
            const { status } = await Contacts.getPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Error checking contact permission:', error);
            return false;
        }
    }

    async getDeviceContacts(): Promise<Contact[]> {
        try {
            const hasPermission = await this.checkContactPermission();
            if (!hasPermission) {
                throw new Error('Contact permission not granted');
            }

            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
            });

            return data.map((contact: any) => ({
                id: contact.id,
                name: contact.name || 'Unknown',
                phoneNumbers: contact.phoneNumbers?.map((phone: any) => phone.number) || [],
                emails: contact.emails?.map((email: any) => email.email) || [],
            }));
        } catch (error) {
            console.error('Error getting device contacts:', error);
            throw error;
        }
    }

    // Friend Management Methods
    async getFriends(): Promise<FriendsData> {
        return this.makeAuthedRequest<FriendsData>('/users/friends', {
            method: 'GET',
        });
    }

    async addFriend(friendsData: Array<any>): Promise<FriendsData> {
        return this.makeAuthedRequest<FriendsData>('/users/friends', {
            method: 'POST',
            body: JSON.stringify({ friends: friendsData }),
        });
    }

    async removeFriend(friendId: string): Promise<void> {
        return this.makeAuthedRequest<void>(`/users/friends/${friendId}`, {
            method: 'DELETE'
        });
    }

    // Search Methods
    async searchUsers(query: string): Promise<SearchResult> {
        try {
            // Only search app users if query is long enough
            const appUsersPromise = query && query.trim().length >= 2
                ? this.searchAppUsers(query)
                : Promise.resolve([]);

            // Search for friends, groups, and app users
            const [friendsData, groupsData, appUsersData] = await Promise.all([
                this.getFriends(),
                this.getGroups(),
                appUsersPromise
            ]);

            const searchResult: SearchResult = {
                friends: (friendsData.friends || []).filter(friend =>
                    friend.name.toLowerCase().includes(query.toLowerCase()) ||
                    friend.email.toLowerCase().includes(query.toLowerCase())
                ),
                groups: (groupsData || []).filter(group =>
                    group.name.toLowerCase().includes(query.toLowerCase())
                ),
                appUsers: appUsersData || [],
                contacts: [] // Will be filled by local search in the component
            };

            return searchResult;
        } catch (error) {
            console.error('Error searching users:', error);
            throw new Error('Failed to search users');
        }
    }

    async searchAppUsers(query: string, page: number = 1, limit: number = 10): Promise<AppUser[]> {
        if (!query || query.trim().length < 2) {
            throw new Error('Search term must be at least 2 characters long');
        }

        const params = new URLSearchParams({
            userId: query.trim(),
            page: page.toString(),
            limit: limit.toString()
        });

        return this.makeAuthedRequest<AppUser[]>(`/users/?${params.toString()}`, {
            method: 'GET'
        });
    }

    // Group Methods
    async getGroups(): Promise<Group[]> {
        return this.makeAuthedRequest<Group[]>('/groups', {
            method: 'GET'
        });
    }
}

export const friendsService = new FriendsService(BASE_URL);
