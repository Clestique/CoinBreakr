import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { GroupService } from '../googleServices/groupService';
import { FriendsService, Friend } from '../googleServices/friendsService';
import { AuthService } from '../googleServices/authService';

export default function CreateGroupScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUser, setCurrentUser] = useState<Friend | null>(null);
  
  // Form state
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadFriends();
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    contentOpacity.value = withDelay(400, withSpring(1));
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const [friendsList, userProfile] = await Promise.all([
        FriendsService.getFriends(),
        AuthService.getCurrentUser()
      ]);
      
      // Transform user profile to Friend format
      const currentUserAsFriend: Friend = {
        _id: userProfile.id,
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        profileImage: userProfile.profileImage || undefined,
      };
      
      setFriends(friendsList);
      setCurrentUser(currentUserAsFriend);
    } catch (error) {
      console.error('Load friends error:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = () => {
    return 'current_user_id'; // Should be retrieved from auth context
  };

  const toggleFriendSelection = (friendId: string) => {
    const newSelection = new Set(selectedFriends);
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId);
    } else {
      newSelection.add(friendId);
    }
    setSelectedFriends(newSelection);
  };

  const handleSubmit = async () => {
    // Validation
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (groupName.trim().length < 2) {
      Alert.alert('Error', 'Group name must be at least 2 characters long');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'Unable to get user information. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      // Create group data - include current user as admin and selected friends as members
      const groupData = {
        name: groupName.trim(),
        description: description.trim() || undefined,
        members: Array.from(selectedFriends), // Array of friend IDs to add as members
        // Note: Current user will be added as admin/creator by the backend
      };

      await GroupService.createGroup(groupData);
      
      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Create group error:', error);
      Alert.alert('Error', error.message || 'Failed to create group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]),
      },
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [30, 0]) }],
  }));

  const renderFriend = (friend: Friend, index: number) => {
    const isSelected = selectedFriends.has(friend._id);
    const currentUserId = getCurrentUserId();

    return (
      <Animated.View
        key={friend._id}
        style={[
          {
            opacity: contentOpacity,
            transform: [
              {
                translateY: interpolate(
                  contentOpacity.value,
                  [0, 1],
                  [20 * (index + 1), 0]
                ),
              },
            ],
          },
        ]}
      >
        <Pressable
          style={[styles.friendItem, isSelected && styles.selectedFriendItem]}
          onPress={() => toggleFriendSelection(friend._id)}
        >
          <View style={styles.friendInfo}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.friendAvatar}
            >
              <Text style={styles.friendAvatarText}>
                {friend.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.friendDetails}>
              <Text style={styles.friendName}>{friend.name}</Text>
              <Text style={styles.friendEmail}>{friend.email}</Text>
            </View>
          </View>
          <View style={styles.selectionIndicator}>
            {isSelected ? (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              </View>
            ) : (
              <View style={styles.unselectedIndicator} />
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.loadingContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
        
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Group</Text>
            <Text style={styles.headerSubtitle}>
              {selectedFriends.size > 0 
                ? `${selectedFriends.size} friend${selectedFriends.size === 1 ? '' : 's'} selected`
                : 'Add friends to your group'
              }
            </Text>
          </View>
          <Pressable
            style={[styles.createButton, submitting && styles.createButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !groupName.trim()}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#ffffff" />
            )}
          </Pressable>
        </Animated.View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
            {/* Group Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Group Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Group Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter group name"
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholderTextColor="#999"
                  autoFocus
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="What's this group for?"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>
            </View>

            {/* Friends Selection Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Add Friends</Text>
                <Text style={styles.sectionSubtitle}>
                  {selectedFriends.size} of {friends.length} selected
                </Text>
              </View>

              {/* Current User Display */}
              {currentUser && (
                <View style={styles.currentUserSection}>
                  <Text style={styles.currentUserLabel}>Group Admin</Text>
                  <View style={styles.currentUserItem}>
                    <View style={styles.friendInfo}>
                      <LinearGradient
                        colors={['#4CAF50', '#45a049']}
                        style={styles.friendAvatar}
                      >
                        <Text style={styles.friendAvatarText}>
                          {currentUser.name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                      <View style={styles.friendDetails}>
                        <Text style={styles.friendName}>{currentUser.name}</Text>
                        <Text style={styles.friendEmail}>{currentUser.email}</Text>
                      </View>
                    </View>
                    <View style={styles.adminBadge}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={styles.adminText}>Admin</Text>
                    </View>
                  </View>
                </View>
              )}

              {friends.length > 0 && (
                <View style={styles.searchContainer}>
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search friends..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor="#999"
                    />
                    {searchQuery.length > 0 && (
                      <Pressable
                        style={styles.clearButton}
                        onPress={() => setSearchQuery('')}
                      >
                        <Ionicons name="close-circle" size={20} color="#999" />
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {/* Selection Actions */}
              {friends.length > 0 && (
                <View style={styles.selectionActions}>
                  <Pressable
                    style={styles.selectionActionButton}
                    onPress={() => {
                      const allFriendIds = new Set(filteredFriends.map(f => f._id));
                      setSelectedFriends(allFriendIds);
                    }}
                  >
                    <Text style={styles.selectionActionText}>Select All</Text>
                  </Pressable>
                  <Pressable
                    style={styles.selectionActionButton}
                    onPress={() => setSelectedFriends(new Set())}
                  >
                    <Text style={styles.selectionActionText}>Clear All</Text>
                  </Pressable>
                </View>
              )}

              {/* Friends List */}
              <View style={styles.friendsContainer}>
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend, index) => renderFriend(friend, index))
                ) : friends.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyStateTitle}>No friends yet</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      Add some friends first to create groups with them
                    </Text>
                    <Pressable
                      style={styles.addFriendsButton}
                      onPress={() => {
                        router.back();
                        // Navigate to friends tab - this would need to be implemented
                        // based on your navigation structure
                      }}
                    >
                      <Text style={styles.addFriendsButtonText}>Add Friends</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="search" size={64} color="#ccc" />
                    <Text style={styles.emptyStateTitle}>No friends found</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      Try a different search term
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Group Preview */}
            {(groupName.trim() || selectedFriends.size > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Group Preview</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.previewAvatar}
                    >
                      <Text style={styles.previewAvatarText}>
                        {groupName.charAt(0).toUpperCase() || 'G'}
                      </Text>
                    </LinearGradient>
                    <View style={styles.previewDetails}>
                      <Text style={styles.previewName}>
                        {groupName.trim() || 'New Group'}
                      </Text>
                      {description.trim() && (
                        <Text style={styles.previewDescription} numberOfLines={2}>
                          {description.trim()}
                        </Text>
                      )}
                      <Text style={styles.previewMetadata}>
                        {selectedFriends.size + 1} member{selectedFriends.size === 0 ? '' : 's'} • Created by you
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    marginBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 44,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  selectionActionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectionActionText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  friendsContainer: {
    gap: 8,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedFriendItem: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 12,
    color: '#666',
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  previewAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  previewDetails: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewMetadata: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addFriendsButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addFriendsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  currentUserSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  currentUserLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  currentUserItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '600',
  },
});
