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
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { getProfileImageUri } from '../../utils/defaultImage';
import { groupsService, CreateGroupData } from '../../services/groups';
import { friendsService } from '../../services/friends';

interface SearchableUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  isFriend: boolean;
}

const CreateGroupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SearchableUser[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [allUsers, setAllUsers] = useState<SearchableUser[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      const query = searchQuery.trim();
      const words = query.split(/\s+/).filter(word => word.length > 0);

      if (query) {
        // Always show friends when searching
        const friendResults = allUsers.filter(user =>
          user.isFriend && (
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
          )
        );

        // Search app users only if search has more than 2 words
        let appUserResults: SearchableUser[] = [];
        if (words.length > 2) {
          try {
            const appUsers = await friendsService.searchAppUsers(query);
            appUserResults = appUsers.map(user => ({
              _id: user._id,
              name: user.name,
              email: user.email,
              profileImage: user.profileImage,
              isFriend: false,
            }));
          } catch (error) {

            // Continue with empty app user results
          }
        }

        setSearchResults([...friendResults, ...appUserResults]);
      } else {
        // Show only friends when not searching
        const friendsOnly = allUsers.filter(user => user.isFriend);
        setSearchResults(friendsOnly);
      }
    };

    searchUsers();
  }, [searchQuery, allUsers]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      // Get friends
      const friendsResponse = await friendsService.getFriends();
      const friends = friendsResponse.friends || [];

      // Convert friends to searchable users
      const friendUsers: SearchableUser[] = friends.map(friend => ({
        _id: friend._id,
        name: friend.name,
        email: friend.email,
        profileImage: friend.profileImage,
        isFriend: true,
      }));

      // For now, we'll start with just friends. App users will be loaded dynamically when searching
      setAllUsers(friendUsers);
      setSearchResults(friendUsers);
    } catch (error) {

      Alert.alert('Error', 'Unable to load users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };



  const toggleMemberSelection = async (user: SearchableUser) => {
    console.log('=== MEMBER SELECTION ===');
    console.log('User:', user.name, '| ID:', user._id, '| isFriend:', user.isFriend);

    const isSelected = selectedMembers.some(member => member._id === user._id);
    console.log('Is currently selected:', isSelected);

    if (isSelected) {
      console.log('Removing member from selection');
      setSelectedMembers(selectedMembers.filter(member => member._id !== user._id));
    } else {
      // Server automatically adds non-friends as friends, so we can allow both
      if (!user.isFriend) {
        console.log('⚠️ Adding non-friend - server will automatically add as friend');
      } else {
        console.log('✅ Adding friend to selection');
      }

      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(member => member._id !== userId));
  };

  const handleCreateGroup = async () => {
    console.log('\n=== CREATE GROUP VALIDATION ===');
    console.log('Group name:', groupName.trim());
    console.log('Selected members count:', selectedMembers.length);
    console.log('Selected members:', selectedMembers.map(m => ({ name: m.name, id: m._id, isFriend: m.isFriend })));

    if (!groupName.trim()) {
      console.log('❌ Validation failed: No group name');
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedMembers.length === 0) {
      console.log('❌ Validation failed: No members selected');
      Alert.alert('Error', 'Please add at least one member to the group');
      return;
    }

    try {
      setLoading(true);

      // Server handles both friends and non-friends (automatically adds non-friends as friends)
      const friendMembers = selectedMembers.filter(member => member.isFriend);
      const nonFriendMembers = selectedMembers.filter(member => !member.isFriend);

      console.log('Friend members:', friendMembers.map(m => ({ name: m.name, id: m._id })));
      console.log('Non-friend members (will be added as friends by server):', nonFriendMembers.map(m => ({ name: m.name, id: m._id })));

      // Ensure member IDs are strings and not empty
      const memberIds = selectedMembers
        .map(member => member._id)
        .filter(id => id && typeof id === 'string' && id.trim().length > 0)
        .map(id => id.trim());

      console.log('Final member IDs to send:', memberIds);

      if (memberIds.length === 0) {
        console.log('❌ Validation failed: No valid member IDs');
        Alert.alert('Error', 'Please add at least one member to the group.');
        return;
      }

      const groupData: CreateGroupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        members: memberIds,
      };

      console.log('✅ Sending group data to server:', groupData);

      const createdGroup = await groupsService.createGroup(groupData);

      console.log('✅ Group created successfully');
      Alert.alert(
        'Success',
        'Group created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to the specific group screen instead of groups list
              navigation.navigate('GroupExpenses', { 
                group: createdGroup,
                groupId: createdGroup._id 
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.log('❌ Group creation failed:', error);

      let errorMessage = 'Failed to create group. Please try again.';

      if (error && error.message) {
        errorMessage = error.message;

        // If there are validation errors, show them
        if (error.errors && Array.isArray(error.errors)) {
          const validationMessages = error.errors.map((err: any) =>
            `${err.field}: ${err.message}`
          ).join('\n');
          errorMessage = `Validation errors:\n${validationMessages}`;
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const canCreateGroup = groupName.trim() && selectedMembers.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <TouchableOpacity
          style={[styles.headerButton, { opacity: canCreateGroup ? 1 : 0.5 }]}
          onPress={handleCreateGroup}
          disabled={!canCreateGroup || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Group Name *</Text>
            <TextInput
              style={styles.textInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              placeholderTextColor={colors.text.tertiary}
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={groupDescription}
              onChangeText={setGroupDescription}
              placeholder="What's this group for?"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
        </View>

        {/* Selected Members Section */}
        {selectedMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Selected Members ({selectedMembers.length})
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedMembersContainer}>
              {selectedMembers.map((member) => (
                <View key={member._id} style={styles.selectedMemberItem}>
                  <Image
                    source={{ uri: getProfileImageUri(member.profileImage, 40) }}
                    style={styles.selectedMemberAvatar}
                  />
                  <Text style={styles.selectedMemberName} numberOfLines={1}>
                    {member.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeMemberButton}
                    onPress={() => removeMember(member._id)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Add Members Section */}
        <View style={styles.section}>
          <View style={styles.addMembersSectionHeader}>
            <Text style={styles.sectionTitle}>Add Members</Text>
            <TouchableOpacity
              style={styles.searchToggle}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons
                name={showSearch ? "search" : "search-outline"}
                size={20}
                color={colors.primary[600]}
              />
            </TouchableOpacity>
          </View>

          {showSearch && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.text.tertiary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search friends or type 3+ words for app users..."
                placeholderTextColor={colors.text.tertiary}
              />
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearSearch}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {loadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : (
            <View style={styles.usersList}>
              {(() => {
                const query = searchQuery.trim();
                const words = query.split(/\s+/).filter(word => word.length > 0);

                const friendResults = searchResults.filter(user => user.isFriend);
                const appUserResults = searchResults.filter(user => !user.isFriend);

                const showAppUsers = !query || words.length > 2;

                return (
                  <>
                    {/* Friends Section */}
                    {friendResults.length > 0 && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionLabel}>Friends</Text>
                        </View>
                        {friendResults.map((user) => {
                          const isSelected = selectedMembers.some(member => member._id === user._id);

                          return (
                            <TouchableOpacity
                              key={user._id}
                              style={[styles.userItem, isSelected && styles.selectedUserItem]}
                              onPress={() => toggleMemberSelection(user)}
                            >
                              <Image
                                source={{ uri: getProfileImageUri(user.profileImage, 40) }}
                                style={styles.userAvatar}
                              />
                              <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userEmail}>{user.email}</Text>
                                <Text style={styles.friendBadge}>Friend</Text>
                              </View>
                              <View style={styles.selectionIndicator}>
                                {isSelected ? (
                                  <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                                ) : (
                                  <View style={styles.unselectedCircle} />
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}

                    {/* App Users Section */}
                    {showAppUsers && appUserResults.length > 0 && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionLabel}>App Users</Text>
                          <Text style={styles.searchHint}>Will be added as friends automatically</Text>
                        </View>
                        {appUserResults.map((user) => {
                          const isSelected = selectedMembers.some(member => member._id === user._id);

                          return (
                            <TouchableOpacity
                              key={user._id}
                              style={[styles.userItem, isSelected && styles.selectedUserItem]}
                              onPress={() => toggleMemberSelection(user)}
                            >
                              <Image
                                source={{ uri: getProfileImageUri(user.profileImage, 40) }}
                                style={styles.userAvatar}
                              />
                              <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userEmail}>{user.email}</Text>
                                <Text style={styles.appUserBadge}>Will be added as friend</Text>
                              </View>
                              <View style={styles.selectionIndicator}>
                                {isSelected ? (
                                  <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                                ) : (
                                  <View style={styles.unselectedCircle} />
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}

                    {/* Empty State */}
                    {searchResults.length === 0 && (
                      <View style={styles.emptyResults}>
                        {query && words.length <= 2 ? (
                          <>
                            <Text style={styles.emptyResultsText}>No friends found</Text>
                            <Text style={styles.emptyResultsHint}>
                              Type more than 2 words to search app users
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.emptyResultsText}>No users found</Text>
                        )}
                      </View>
                    )}

                    {/* Search Hint */}
                    {!query && (
                      <View style={styles.searchHintContainer}>
                        <Text style={styles.searchHintText}>
                          • Friends appear automatically{'\n'}
                          • Type more than 2 words to search app users{'\n'}
                          • App users will be automatically added as friends when creating the group
                        </Text>
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          )}
        </View>
      </ScrollView>
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
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    textAlign: 'right',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  addMembersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  searchToggle: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectedMembersContainer: {
    flexDirection: 'row',
  },
  selectedMemberItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  selectedMemberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  selectedMemberName: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  removeMemberButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.background.primary,
    borderRadius: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.background.primary,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  clearSearch: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  usersList: {
    marginTop: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  selectedUserItem: {
    backgroundColor: colors.primary[25],
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  friendBadge: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  appUserBadge: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  disabledUserItem: {
    opacity: 0.6,
  },
  disabledAvatar: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.text.tertiary,
  },
  notFriendBadge: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyResultsText: {
    fontSize: 16,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  emptyResultsHint: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  searchHintContainer: {
    backgroundColor: colors.background.tertiary,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  searchHintText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

export default CreateGroupScreen;