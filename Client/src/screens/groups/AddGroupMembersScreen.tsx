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
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { friendsService } from '../../services/friends';
import { groupsService } from '../../services/groups';

type AddGroupMembersScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any>;
};

interface SearchableUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  isFriend: boolean;
}

interface SelectedMember {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  type: 'friend' | 'appUser';
}

const AddGroupMembersScreen: React.FC<AddGroupMembersScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { groupId, currentMembers } = route.params as { groupId: string; currentMembers: string[] };

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState<SearchableUser[]>([]);
  const [filteredAppUsers, setFilteredAppUsers] = useState<SearchableUser[]>([]);
  const [allFriends, setAllFriends] = useState<SearchableUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterResults();
  }, [searchQuery, allFriends, selectedMembers, currentMembers]);

  const filterResults = () => {
    if (!searchQuery.trim()) {
      // Show available friends when not searching
      const availableFriends = allFriends.filter(user => 
        !selectedMembers.some(selected => selected.id === user._id)
      );
      setFilteredFriends(availableFriends);
      setFilteredAppUsers([]);
      return;
    }

    const query = searchQuery.toLowerCase();

    // Filter friends and exclude selected ones
    const friendResults = allFriends.filter(user => {
      const isSelected = selectedMembers.some(selected => selected.id === user._id);
      const matchesQuery = user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      return !isSelected && matchesQuery;
    });
    setFilteredFriends(friendResults);

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
      // Exclude current members, existing friends, and selected members
      const availableUsers = response.filter((user: any) => {
        const isCurrentMember = currentMembers.includes(user._id);
        const hasIsFriendFlag = user.isFriend === true;
        const isSelected = selectedMembers.some(selected => selected.id === user._id);
        return !isCurrentMember && !hasIsFriendFlag && !isSelected;
      });

      const appUserResults: SearchableUser[] = availableUsers.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        isFriend: false,
      }));

      setFilteredAppUsers(appUserResults);
    } catch (error) {
      console.error('Error searching app users:', error);
      setFilteredAppUsers([]);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get friends
      const friendsResponse = await friendsService.getFriends();
      const friends = friendsResponse.friends || [];

      // Filter out current members
      const availableFriends = friends.filter(
        friend => !currentMembers.includes(friend._id)
      );

      // Convert friends to searchable users
      const friendUsers: SearchableUser[] = availableFriends.map(friend => ({
        _id: friend._id,
        name: friend.name,
        email: friend.email,
        profileImage: friend.profileImage,
        isFriend: true,
      }));

      setAllFriends(friendUsers);
      setFilteredFriends(friendUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const addSelectedMember = (member: SelectedMember) => {
    if (!selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers([...selectedMembers, member]);
      setSearchQuery(''); // Clear search query when adding a member
    }
  };

  const removeSelectedMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== memberId));
  };

  const handleFriendSelect = (user: SearchableUser) => {
    const selectedMember: SelectedMember = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      type: 'friend'
    };
    addSelectedMember(selectedMember);
  };

  const handleAppUserSelect = (user: SearchableUser) => {
    const selectedMember: SelectedMember = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      type: 'appUser'
    };
    addSelectedMember(selectedMember);
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert('No Members Selected', 'Please select at least one member to add.');
      return;
    }

    try {
      setAddingMembers(true);
      
      // Prepare members data with emails
      const membersData = selectedMembers.map(member => ({
        email: member.email,
        role: 'member'
      }));
      
      // Add members to group
      await groupsService.addMembersToGroup(groupId, membersData);
      
      Alert.alert('Success', `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} added to group`);
      
      // Navigate back to group settings
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Members</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Search Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Members</Text>
            <View style={styles.searchInputContainer}>
              {/* Selected Members Tags */}
              <View style={styles.tagsContainer}>
                {selectedMembers.map((member) => (
                  <View key={member.id} style={styles.tag}>
                    <Text style={styles.tagText}>{member.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeSelectedMember(member.id)}
                      style={styles.tagRemove}
                    >
                      <Ionicons name="close" size={16} color={colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TextInput
                  style={styles.searchInput}
                  placeholder={selectedMembers.length > 0 ? "Add more..." : "Search by name, email, or phone"}
                  placeholderTextColor={colors.text.quaternary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  multiline={false}
                />
              </View>
            </View>
          </View>

          {loading ? (
            <View style={styles.lastSection}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[600]} />
                <Text style={styles.loadingText}>Loading friends...</Text>
              </View>
            </View>
          ) : (
            <>
              {/* App Users Results */}
              {filteredAppUsers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>App Users</Text>
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

              {/* Friends */}
              <View style={filteredAppUsers.length > 0 ? styles.lastSection : styles.lastSection}>
                <Text style={styles.sectionTitle}>
                  {searchQuery ? 'Matching Friends' : 'Your Friends'}
                </Text>
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend, index) => (
                    <TouchableOpacity
                      key={friend._id}
                      style={[
                        styles.listItem,
                        index === filteredFriends.length - 1 && styles.lastListItem
                      ]}
                      onPress={() => handleFriendSelect(friend)}
                    >
                      <Image
                        source={{ uri: friend.profileImage || 'https://placehold.co/40x40' }}
                        style={styles.userAvatar}
                      />
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{friend.name}</Text>
                        <Text style={styles.itemDetail}>{friend.email}</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={24} color={colors.primary[600]} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No matching friends found' : 'No friends available'}
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* Bottom Button */}
      {selectedMembers.length > 0 && (
        <View style={styles.bottomButton}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddMembers}
            disabled={addingMembers}
          >
            {addingMembers ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>
                Add Members ({selectedMembers.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    marginBottom: -14
  },
  addButton: {
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
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddGroupMembersScreen;