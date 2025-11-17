import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { friendsService, Contact, AppUser } from '../../services/friends';
import AddPersonModal from '../../components/AddPersonModal';

export interface LocalPendingFriend {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  type: 'contact' | 'appUser' | 'manual';
  profileImage?: string;
}

const AddFriendScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [appUsers] = useState<AppUser[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [filteredAppUsers, setFilteredAppUsers] = useState<AppUser[]>([]);
  const [pendingFriends, setPendingFriends] = useState<LocalPendingFriend[]>([]);
  const [currentFriends, setCurrentFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterResults();
  }, [searchQuery, contacts, appUsers, pendingFriends, currentFriends]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current friends to filter them out
      const friendsData = await friendsService.getFriends();
      const allCurrentFriends = [
        ...(friendsData.friends || []),
        ...(friendsData.pendingFriends || [])
      ];
      setCurrentFriends(allCurrentFriends);

      // Load contacts if permission granted
      const hasPermission = await friendsService.checkContactPermission();
      if (hasPermission) {
        const deviceContacts = await friendsService.getDeviceContacts();
        setContacts(deviceContacts);
      }

      // Load app users (could be from a search API)
      // For now, we'll leave this empty as it would typically be populated by search
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyFriend = (contact: Contact) => {
    const result = currentFriends.some(friend => {
      // Check by email
      if (friend.email && contact.emails?.some(email =>
        email.toLowerCase() === friend.email.toLowerCase()
      )) {
        return true;
      }

      // Check by phone number (normalize phone numbers by removing spaces, dashes, etc.)
      if (friend.phoneNumber && contact.phoneNumbers?.some(phone => {
        const normalizedFriendPhone = friend.phoneNumber.replace(/[\s\-\(\)\+]/g, '');
        const normalizedContactPhone = phone.replace(/[\s\-\(\)\+]/g, '');
        if (normalizedFriendPhone === normalizedContactPhone) {
          return true;
        }
        return false;
      })) {
        return true;
      }

      return false;
    });

    return result;
  };

  const isAppUserAlreadyFriend = (user: AppUser) => {
    return currentFriends.some(friend => {
      // Check by email
      if (friend.email && user.email &&
        friend.email.toLowerCase() === user.email.toLowerCase()) {
        return true;
      }

      // Check by phone number
      if (friend.phoneNumber && user.phoneNumber) {
        const normalizedFriendPhone = friend.phoneNumber.replace(/[\s\-\(\)\+]/g, '');
        const normalizedUserPhone = user.phoneNumber.replace(/[\s\-\(\)\+]/g, '');
        if (normalizedFriendPhone === normalizedUserPhone) {
          return true;
        }
      }

      // Check by user ID if available
      if (friend._id && user._id && friend._id === user._id) {
        return true;
      }

      return false;
    });
  };

  const filterResults = () => {
    if (!searchQuery.trim()) {
      // Exclude already selected contacts and current friends
      const availableContacts = contacts.filter(contact => {
        const isSelected = pendingFriends.some(pf => pf.id === `contact-${contact.id}`);
        const isCurrentFriend = isAlreadyFriend(contact);

        return !isSelected && !isCurrentFriend;
      });
      setFilteredContacts(availableContacts);
      setFilteredAppUsers([]);
      return;
    }

    const query = searchQuery.toLowerCase();

    // Filter contacts and exclude selected ones and current friends
    const filteredC = contacts.filter(contact => {
      const isSelected = pendingFriends.some(pf => pf.id === `contact-${contact.id}`);
      const isCurrentFriend = isAlreadyFriend(contact);
      const matchesQuery = contact.name.toLowerCase().includes(query) ||
        contact.emails?.some((email: string) => email.toLowerCase().includes(query)) ||
        contact.phoneNumbers?.some((phone: string) => phone.includes(query));

      return !isSelected && !isCurrentFriend && matchesQuery;
    });
    setFilteredContacts(filteredC);

    // Search app users if query looks like email or has enough characters
    if (query.includes('@') || query.length >= 2) {
      searchAppUsers(query);
    } else {
      setFilteredAppUsers([]);
    }
  };

  const searchAppUsers = async (query: string) => {
    try {
      const response = await friendsService.searchAppUsers(query);
      // Exclude already selected app users, existing friends, and current friends
      const availableUsers = response.filter((user: AppUser) => {
        const isSelected = pendingFriends.some(pf => pf.id === `user-${user._id}`);
        const isCurrentFriend = isAppUserAlreadyFriend(user);
        const hasIsFriendFlag = user.isFriend === true;

        return !isSelected && !isCurrentFriend && !hasIsFriendFlag;
      });
      setFilteredAppUsers(availableUsers);
    } catch (error) {
      console.error('Error searching app users:', error);
      setFilteredAppUsers([]);
    }
  };

  const addPendingFriend = (friend: LocalPendingFriend) => {
    if (!pendingFriends.find(f => f.id === friend.id)) {
      setPendingFriends([...pendingFriends, friend]);
      setSearchQuery(''); // Clear search query when adding a friend
    }
  };

  const removePendingFriend = (friendId: string) => {
    setPendingFriends(pendingFriends.filter(f => f.id !== friendId));
  };

  const handleContactSelect = (contact: Contact) => {
    const pendingFriend: LocalPendingFriend = {
      id: `contact-${contact.id}`,
      name: contact.name,
      email: contact.emails?.[0],
      phoneNumber: contact.phoneNumbers?.[0],
      type: 'contact'
    };
    addPendingFriend(pendingFriend);
  };

  const handleAppUserSelect = (user: AppUser) => {
    const pendingFriend: LocalPendingFriend = {
      id: `user-${user._id}`,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      type: 'appUser',
      profileImage: user.profileImage
    };
    addPendingFriend(pendingFriend);
  };

  const handleAddPersonModalSubmit = (person: { name: string; email?: string; phoneNumber?: string; countryCode?: string }) => {
    const pendingFriend: LocalPendingFriend = {
      id: `manual-${Date.now()}`,
      name: person.name,
      email: person.email,
      phoneNumber: person.phoneNumber,
      countryCode: person.countryCode,
      type: 'manual'
    };
    addPendingFriend(pendingFriend);
    setShowAddPersonModal(false);
    setSearchQuery(''); // Clear search query after adding
  };

  const getAddButtonText = () => {
    if (!searchQuery.trim()) return 'Add Someone New';
    return `Add "${searchQuery}"`;
  };

  const navigateToReview = () => {
    if (pendingFriends.length === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to add.');
      return;
    }
    navigation.navigate('ReviewFriends', { pendingFriends });
  };





  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background.body} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top -1 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Friends</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Search Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Friends</Text>
            <View style={styles.searchInputContainer}>
              {/* Selected Friends Tags */}
              <View style={styles.tagsContainer}>
                {pendingFriends.map((friend) => (
                  <View key={friend.id} style={styles.tag}>
                    <Text style={styles.tagText}>{friend.name}</Text>
                    <TouchableOpacity
                      onPress={() => removePendingFriend(friend.id)}
                      style={styles.tagRemove}
                    >
                      <Ionicons name="close" size={16} color={colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TextInput
                  style={styles.searchInput}
                  placeholder={pendingFriends.length > 0 ? "Add more..." : "Search by name, email, or phone"}
                  placeholderTextColor={colors.text.quaternary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  multiline={false}
                />
              </View>
            </View>

            {/* Add Someone New Button */}
            <TouchableOpacity
              style={styles.addNewButton}
              onPress={() => setShowAddPersonModal(true)}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.addNewText}>{getAddButtonText()}</Text>
            </TouchableOpacity>
          </View>



          {loading ? (
            <View style={styles.lastSection}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[600]} />
                <Text style={styles.loadingText}>Loading contacts...</Text>
              </View>
            </View>
          ) : (
            <>
              {/* App Users Results */}
              {filteredAppUsers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Splitlyr Users</Text>
                  {filteredAppUsers.map((user, index) => (
                    <TouchableOpacity
                      key={user._id}
                      style={[
                        styles.listItem,
                        index === filteredAppUsers.length - 1 && styles.lastListItem
                      ]}
                      onPress={() => handleAppUserSelect(user)}
                    >
                      <Image
                        source={{ uri: user.profileImage || 'https://placehold.co/40x40' }}
                        style={styles.userAvatar}
                      />
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{user.name}</Text>
                        <Text style={styles.itemDetail}>{user.email}</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={24} color={colors.primary[600]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Contacts */}
              <View style={filteredAppUsers.length > 0 ? styles.lastSection : styles.lastSection}>
                <Text style={styles.sectionTitle}>
                  {searchQuery ? 'Matching Contacts' : 'Your Contacts'}
                </Text>
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact, index) => (
                    <TouchableOpacity
                      key={contact.id}
                      style={[
                        styles.listItem,
                        index === filteredContacts.length - 1 && styles.lastListItem
                      ]}
                      onPress={() => handleContactSelect(contact)}
                    >
                      <View style={styles.avatar}>
                        <Ionicons name="person" size={20} color={colors.text.tertiary} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{contact.name}</Text>
                        <Text style={styles.itemDetail}>
                          {contact.phoneNumbers?.[0] || contact.emails?.[0] || 'No contact info'}
                        </Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={24} color={colors.primary[600]} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No matching contacts found' : 'No contacts available'}
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* Bottom Button */}
      {pendingFriends.length > 0 && (
        <View style={styles.bottomButton}>
          <TouchableOpacity style={styles.reviewButton} onPress={navigateToReview}>
            <Text style={styles.reviewButtonText}>
              Review & Add ({pendingFriends.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Person Modal */}
      <AddPersonModal
        visible={showAddPersonModal}
        onClose={() => setShowAddPersonModal(false)}
        onSubmit={handleAddPersonModalSubmit}
        initialQuery={searchQuery}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.background.body,
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lastSection: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  searchInputContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.medium,
    minHeight: 48,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[700],
    marginRight: 4,
  },
  tagRemove: {
    padding: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    minWidth: 120,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  addNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    marginLeft: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lastListItem: {
    borderBottomWidth: 0,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomButton: {
    padding: 24,
    backgroundColor: colors.background.body,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  reviewButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary[600],
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddFriendScreen;