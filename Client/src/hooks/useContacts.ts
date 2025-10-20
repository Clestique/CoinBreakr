import { useState, useEffect } from 'react';
import { friendsService, Contact, Friend } from '../services/friends';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissionAndLoad();
  }, []);

  const checkPermissionAndLoad = async () => {
    try {
      const permission = await friendsService.checkContactPermission();
      setHasPermission(permission);
      
      if (permission) {
        await loadContacts();
      }
      
      await loadFriends();
    } catch (error) {
      console.error('Error checking permission and loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const deviceContacts = await friendsService.getDeviceContacts();
      setContacts(deviceContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await friendsService.getFriends();
      if (response.success && response.data) {
        setFriends(response.data);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await friendsService.requestContactPermission();
      setHasPermission(granted);
      
      if (granted) {
        await loadContacts();
        await syncContacts();
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  const syncContacts = async () => {
    try {
      if (contacts.length > 0) {
        await friendsService.syncContactsWithServer(contacts);
        await loadFriends(); // Reload friends after sync
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
    }
  };

  const addFriend = async (userId: string): Promise<boolean> => {
    try {
      const response = await friendsService.addFriend(userId);
      if (response.success) {
        await loadFriends();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding friend:', error);
      return false;
    }
  };

  const searchContacts = (query: string): Contact[] => {
    return friendsService.searchLocalContacts(contacts, query);
  };

  return {
    contacts,
    friends,
    hasPermission,
    loading,
    requestPermission,
    syncContacts,
    addFriend,
    searchContacts,
    loadFriends,
    loadContacts,
  };
};

export default useContacts;