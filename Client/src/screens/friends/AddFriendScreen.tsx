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
  const [loading, setLoading] = useState(true);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterResults();
  }, [searchQuery, contacts, appUsers, pendingFriends]);

  const loadData = async () => {
    setLoading(true);
    try {
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

  const filterResults = () => {
    if (!searchQuery.trim()) {
      // Exclude already selected contacts
      const availableContacts = contacts.filter(contact => 
        !pendingFriends.some(pf => pf.id === `contact-${contact.id}`)
      );
      setFilteredContacts(availableContacts);
      setFilteredAppUsers([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Filter contacts and exclude selected ones
    const filteredC = contacts.filter(contact => {
      const isSelected = pendingFriends.some(pf => pf.id === `contact-${contact.id}`);
      const matchesQuery = contact.name.toLowerCase().includes(query) ||
        contact.emails?.some((email: string) => email.toLowerCase().includes(query)) ||
        contact.phoneNumbers?.some((phone: string) => phone.includes(query));
      
      return !isSelected && matchesQuery;
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
      if (response.success && response.data) {
        // Exclude already selected app users and existing friends
        const availableUsers = response.data.filter((user: AppUser) => 
          !user.isFriend && 
          !pendingFriends.some(pf => pf.id === `user-${user._id}`)
        );
        setFilteredAppUsers(availableUsers);
      } else {
        setFilteredAppUsers([]);
      }
    } catch (error) {
      console.error('Error searching app users:', error);
      setFilteredAppUsers([]);
    }
  };

  const addPendingFriend = (friend: LocalPendingFriend) => {
    if (!pendingFriends.find(f => f.id === friend.id)) {
      setPendingFriends([...pendingFriends, friend]);
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

  const renderContact = (contact: Contact) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.listItem}
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
  );

  const renderAppUser = (user: AppUser) => (
    <TouchableOpacity
      key={user._id}
      style={styles.listItem}
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
  );

  const renderPendingFriend = (friend: LocalPendingFriend) => (
    <View key={friend.id} style={styles.pendingItem}>
      <View style={styles.avatar}>
        {friend.profileImage ? (
          <Image source={{ uri: friend.profileImage }} style={styles.userAvatar} />
        ) : (
          <Ionicons name="person" size={20} color={colors.text.tertiary} />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{friend.name}</Text>
        <Text style={styles.itemDetail}>
          {friend.email || friend.phoneNumber || 'Manual entry'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removePendingFriend(friend.id)}>
        <Ionicons name="close-circle" size={24} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Friends</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or phone"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Add Someone New Button */}
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => setShowAddPersonModal(true)}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.primary[600]} />
            <Text style={styles.addNewText}>{getAddButtonText()}</Text>
          </TouchableOpacity>

          {/* Pending Friends */}
          {pendingFriends.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selected Friends ({pendingFriends.length})</Text>
              {pendingFriends.map(renderPendingFriend)}
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : (
            <>
              {/* App Users Results */}
              {filteredAppUsers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>CoinBreakr Users</Text>
                  {filteredAppUsers.map(renderAppUser)}
                </View>
              )}

              {/* Contacts */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {searchQuery ? 'Matching Contacts' : 'Your Contacts'}
                </Text>
                {filteredContacts.length > 0 ? (
                  filteredContacts.map(renderContact)
                ) : (
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No matching contacts found' : 'No contacts available'}
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.body,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchContainer: {
    marginVertical: 16,
  },
  searchInput: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  addNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[25],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
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
    backgroundColor: colors.background.secondary,
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