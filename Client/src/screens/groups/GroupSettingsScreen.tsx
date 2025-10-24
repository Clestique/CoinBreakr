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
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { groupsService, Group } from '../../services/groups';
import { friendsService } from '../../services/friends';
import { authStorage } from '../../services/authStorage';

type GroupSettingsScreenProps = {
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

const GroupSettingsScreen: React.FC<GroupSettingsScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { group: initialGroup } = route.params as { group: Group };
  
  // State
  const [group, setGroup] = useState<Group>(initialGroup);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedMembers, setExpandedMembers] = useState(false);
  const [showAddMemberSection, setShowAddMemberSection] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [allUsers, setAllUsers] = useState<SearchableUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description || '');

  useEffect(() => {
    getCurrentUser();
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

    if (showAddMemberSection) {
      searchUsers();
    }
  }, [searchQuery, allUsers, showAddMemberSection]);

  const getCurrentUser = async () => {
    try {
      const token = await authStorage.getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId || payload.id || payload.sub);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      // Get friends
      const friendsResponse = await friendsService.getFriends();
      const friends = friendsResponse.friends || [];

      // Filter out current members
      const currentMemberIds = group.members.map(member => member.user);
      const availableFriends = friends.filter(
        friend => !currentMemberIds.includes(friend._id)
      );

      // Convert friends to searchable users
      const friendUsers: SearchableUser[] = availableFriends.map(friend => ({
        _id: friend._id,
        name: friend.name,
        email: friend.email,
        profileImage: friend.profileImage,
        isFriend: true,
      }));

      setAllUsers(friendUsers);
      setSearchResults(friendUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const createdById = typeof group.createdBy === 'string' ? group.createdBy : group.createdBy._id;
  const isCreator = currentUserId === createdById;
  const currentMember = group.members.find(member => member.user === currentUserId);
  const isAdmin = currentMember?.role === 'admin' || isCreator;

  // Debug logging
  console.log('Actions Debug:', {
    currentUserId,
    createdById,
    isCreator,
    isAdmin,
    showLeaveGroup: !isCreator
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!isAdmin) {
      Alert.alert('Error', 'You do not have permission to edit this group');
      setIsEditing(false);
      return;
    }

    if (!editName.trim()) {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const updatedGroup = await groupsService.updateGroup(group._id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      
      // Update the group data in place
      setGroup(updatedGroup);
      setIsEditing(false);
      
      // Show success message
      Alert.alert('Success', 'Group details updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update group');
      // Reset form values on error
      setEditName(group.name);
      setEditDescription(group.description || '');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditName(group.name);
    setEditDescription(group.description || '');
    setIsEditing(false);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (memberId === currentUserId) {
      Alert.alert(
        'Leave Group',
        'Are you sure you want to leave this group?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => removeMember(memberId) },
        ]
      );
    } else {
      Alert.alert(
        'Remove Member',
        `Remove ${memberName} from the group?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeMember(memberId) },
        ]
      );
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      setLoading(true);
      const updatedGroup = await groupsService.removeMemberFromGroup(group._id, memberId);
      
      if (memberId === currentUserId) {
        // User left the group, navigate back
        navigation.navigate('GroupsList', { refresh: true });
        return;
      }
      
      setGroup(updatedGroup);
      loadUsers(); // Refresh available users
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (user: SearchableUser) => {
    try {
      setLoading(true);
      const updatedGroup = await groupsService.addMemberToGroup(group._id, [user._id]);
      setGroup(updatedGroup);
      
      // Remove the added user from search results
      setAllUsers(allUsers.filter(u => u._id !== user._id));
      setSearchResults(searchResults.filter(u => u._id !== user._id));
      
      Alert.alert('Success', `${user.name} added to group`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setLoading(true);
              await groupsService.deleteGroup(group._id);
              navigation.navigate('GroupsList', { refresh: true });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete group');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const toggleAddMemberSection = () => {
    setShowAddMemberSection(!showAddMemberSection);
    if (!showAddMemberSection) {
      setSearchQuery('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background.body} barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top - 15 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Details</Text>
        <View style={styles.headerRightButtons}>
          {isEditing && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleCancel}
            >
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={isEditing ? handleSave : handleEdit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary[600]} />
            ) : (
              <Ionicons 
                name={isEditing ? "checkmark" : "create-outline"} 
                size={24} 
                color={colors.primary[600]} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Info Section */}
        <View style={styles.section}>
          <View style={styles.groupHeader}>
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={32} color={colors.primary[600]} />
            </View>
            <View style={styles.groupInfo}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Group name"
                  placeholderTextColor={colors.text.tertiary}
                  maxLength={50}
                />
              ) : (
                <Text style={styles.groupName}>{group.name}</Text>
              )}
              <Text style={styles.memberCount}>
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionLabel}>Description</Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Add a description..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            ) : (
              <Text style={styles.description}>
                {group.description || 'No description'}
              </Text>
            )}
          </View>

          {/* Creator Info */}
          <View style={styles.creatorInfo}>
            <Text style={styles.sectionLabel}>Created by</Text>
            <Text style={styles.creatorText}>
              {isCreator 
                ? 'You' 
                : typeof group.createdBy === 'string' 
                  ? 'Group Creator' 
                  : group.createdBy.name
              }
            </Text>
            <Text style={styles.createdDate}>
              {new Date(group.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members ({group.members.length})</Text>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setExpandedMembers(!expandedMembers)}
            >
              <Ionicons 
                name={expandedMembers ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Add Members Button - Only for Admins */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.addMemberButton}
              onPress={toggleAddMemberSection}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.addMemberButtonText}>Add Members</Text>
              <Ionicons 
                name={showAddMemberSection ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={colors.text.tertiary} 
              />
            </TouchableOpacity>
          )}

          {/* Add Members Search - Only for Admins */}
          {isAdmin && showAddMemberSection && (
            <View style={styles.addMemberContainer}>
              {/* Search Input */}
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

              {/* Search Results */}
              {loadingUsers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : (
                <View style={styles.searchResults}>
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
                            <Text style={styles.resultsLabel}>Friends</Text>
                            {friendResults.map((user) => (
                              <TouchableOpacity
                                key={user._id}
                                style={styles.userItem}
                                onPress={() => handleAddMember(user)}
                                disabled={loading}
                              >
                                <Image
                                  source={{ uri: user.profileImage || 'https://placehold.co/40x40' }}
                                  style={styles.userAvatar}
                                />
                                <View style={styles.userInfo}>
                                  <Text style={styles.userName}>{user.name}</Text>
                                  <Text style={styles.userEmail}>{user.email}</Text>
                                  <Text style={styles.friendBadge}>Friend</Text>
                                </View>
                                <Ionicons name="add-circle-outline" size={24} color={colors.primary[600]} />
                              </TouchableOpacity>
                            ))}
                          </>
                        )}

                        {/* App Users Section */}
                        {showAppUsers && appUserResults.length > 0 && (
                          <>
                            <Text style={styles.resultsLabel}>App Users</Text>
                            <Text style={styles.searchHint}>Will be added as friends automatically</Text>
                            {appUserResults.map((user) => (
                              <TouchableOpacity
                                key={user._id}
                                style={styles.userItem}
                                onPress={() => handleAddMember(user)}
                                disabled={loading}
                              >
                                <Image
                                  source={{ uri: user.profileImage || 'https://placehold.co/40x40' }}
                                  style={styles.userAvatar}
                                />
                                <View style={styles.userInfo}>
                                  <Text style={styles.userName}>{user.name}</Text>
                                  <Text style={styles.userEmail}>{user.email}</Text>
                                  <Text style={styles.appUserBadge}>Will be added as friend</Text>
                                </View>
                                <Ionicons name="add-circle-outline" size={24} color={colors.primary[600]} />
                              </TouchableOpacity>
                            ))}
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
                              • App users will be automatically added as friends
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>
              )}
            </View>
          )}

          {/* Members List */}
          {expandedMembers && (
            <View style={styles.membersList}>
              {group.members.map((member, index) => (
                <View key={member._id || index} style={styles.memberItem}>
                  <Image
                    source={{ uri: 'https://placehold.co/40x40' }}
                    style={styles.memberAvatar}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.user === currentUserId ? 'You' : `Member ${index + 1}`}
                    </Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                    <Text style={styles.joinedDate}>
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {isAdmin && member.user !== currentUserId && (
                    <TouchableOpacity
                      style={styles.removeMemberButton}
                      onPress={() => handleRemoveMember(member.user, `Member ${index + 1}`)}
                    >
                      <Ionicons name="remove-circle-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  )}
                  {member.user === currentUserId && !isCreator && (
                    <TouchableOpacity
                      style={styles.leaveButton}
                      onPress={() => handleRemoveMember(member.user, 'You')}
                    >
                      <Text style={styles.leaveButtonText}>Leave</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {/* Creator can delete group */}
          {isCreator && (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleDeleteGroup}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.actionButtonText, styles.dangerText]}>Delete Group</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}

          {/* Non-creators can leave group */}
          {!isCreator && (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => handleRemoveMember(currentUserId!, 'You')}
            >
              <Ionicons name="exit-outline" size={20} color={colors.error} />
              <Text style={[styles.actionButtonText, styles.dangerText]}>Leave Group</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>


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
  headerButton: {
    padding: 8,
    minWidth: 40,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  groupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  editTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 22,
  },
  creatorInfo: {
    marginBottom: 8,
  },
  creatorText: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 4,
  },
  createdDate: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  expandButton: {
    padding: 4,
  },
  toggleButton: {
    padding: 4,
  },
  membersList: {
    marginTop: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
    marginBottom: 2,
  },
  joinedDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  removeMemberButton: {
    padding: 8,
  },
  leaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.error,
  },
  leaveButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: colors.error,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 16,
  },
  addMemberButtonText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  addMemberContainer: {
    marginTop: 16,
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
  searchResults: {
    marginTop: 8,
  },
  resultsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  searchHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
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
  appUserBadge: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
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

export default GroupSettingsScreen;