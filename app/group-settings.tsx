import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
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
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { GroupService, Group } from '../googleServices/groupService';
import { AuthService } from '../googleServices/authService';

const { width } = Dimensions.get('window');

export default function GroupSettingsScreen() {
  const { groupId } = useLocalSearchParams<{
    groupId: string;
  }>();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadCurrentUser();
    if (groupId) {
      loadGroupData();
    }
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    contentOpacity.value = withDelay(400, withSpring(1));
  }, [groupId]);

  const loadCurrentUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setCurrentUserId(currentUser.id);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadGroupData = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      const groupData = await GroupService.getGroupById(groupId);
      setGroup(groupData);
      setEditedName(groupData.name);
      setEditedDescription(groupData.description || '');
    } catch (error) {
      console.error('Load group data error:', error);
      Alert.alert('Error', 'Failed to load group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!group) return;
    
    // Reset form to original values
    setEditedName(group.name);
    setEditedDescription(group.description || '');
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!group) return;

    // Validation
    if (!editedName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setSaving(true);
    try {
      const updatedGroup = await GroupService.updateGroup(group._id, {
        name: editedName.trim(),
        description: editedDescription.trim(),
      });
      
      setGroup(updatedGroup);
      setIsEditing(false);
      Alert.alert('Success', 'Group updated successfully!');
    } catch (error: any) {
      console.error('Update group error:', error);
      Alert.alert('Error', error.message || 'Failed to update group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group? You will no longer be able to see group expenses.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!groupId) return;
              await GroupService.leaveGroup(groupId);
              Alert.alert('Success', 'You have left the group successfully.');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave group.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone and all group data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!groupId) return;
              await GroupService.deleteGroup(groupId);
              Alert.alert('Success', 'Group deleted successfully.');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete group.');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!groupId) return;
              await GroupService.removeMember(groupId, memberId);
              Alert.alert('Success', `${memberName} has been removed from the group.`);
              loadGroupData(); // Refresh group data
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  const handleAddMember = () => {
    Alert.alert('Add Member', 'Add member functionality will be implemented soon.');
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
    transform: [
      {
        translateY: interpolate(contentOpacity.value, [0, 1], [30, 0]),
      },
    ],
  }));

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.loadingContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading group settings...</Text>
        </View>
      </>
    );
  }

  if (!group) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.errorContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
          <Ionicons name="alert-circle-outline" size={64} color="#ffffff" />
          <Text style={styles.errorText}>Failed to load group settings</Text>
          <Pressable style={styles.retryButton} onPress={loadGroupData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const isAdmin = currentUserId && group ? GroupService.isGroupAdmin(group, currentUserId) : false;

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
            <Text style={styles.headerTitle}>Group Settings</Text>
            <Text style={styles.headerSubtitle}>{group.name}</Text>
          </View>
        </Animated.View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
            
            {/* Group Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Group Information</Text>
              <View style={styles.card}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Group Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.infoInput}
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder="Enter group name"
                      autoCapitalize="words"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{group.name}</Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Description</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.infoInput, styles.multilineInput]}
                      value={editedDescription}
                      onChangeText={setEditedDescription}
                      placeholder="Enter group description"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {group.description || 'No description'}
                    </Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Members</Text>
                  <Text style={styles.infoValue}>
                    {GroupService.formatMemberCount(group.members.length)}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Created</Text>
                  <Text style={styles.infoValue}>
                    {new Date(group.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                {isAdmin && (
                  <View style={styles.editActions}>
                    {isEditing ? (
                      <>
                        <Pressable
                          style={[styles.actionButton, styles.cancelButton]}
                          onPress={handleCancelEdit}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionButton, styles.saveButton, saving && styles.buttonDisabled]}
                          onPress={handleSaveEdit}
                          disabled={saving}
                        >
                          {saving ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                          )}
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        style={[styles.actionButton, styles.editButton]}
                        onPress={handleEditGroup}
                      >
                        <Ionicons name="create-outline" size={16} color="#667eea" />
                        <Text style={styles.editButtonText}>Edit Details</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Admin Actions */}
            {isAdmin && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Admin Actions</Text>
                <View style={styles.card}>
                  <Pressable style={styles.settingsOption} onPress={handleAddMember}>
                    <Ionicons name="person-add-outline" size={20} color="#667eea" />
                    <Text style={styles.settingsOptionText}>Add Member</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  </Pressable>

                  <Pressable style={[styles.settingsOption, styles.dangerOption]} onPress={handleDeleteGroup}>
                    <Ionicons name="trash-outline" size={20} color="#ff4757" />
                    <Text style={[styles.settingsOptionText, styles.dangerText]}>Delete Group</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Members Management */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members</Text>
              <View style={styles.card}>
                {group.members.map((member) => (
                  <View key={member.user._id} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.memberAvatar}
                      >
                        <Text style={styles.memberAvatarText}>
                          {member.user.name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName}>{member.user.name}</Text>
                        <Text style={styles.memberRole}>
                          {member.role === 'admin' ? 'Admin' : 'Member'}
                        </Text>
                      </View>
                    </View>
                    {isAdmin && member.role !== 'admin' && member.user._id !== group.createdBy._id && (
                      <Pressable
                        style={styles.removeMemberButton}
                        onPress={() => handleRemoveMember(member.user._id, member.user.name)}
                      >
                        <Ionicons name="remove-circle-outline" size={20} color="#ff4757" />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Member Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.card}>
                <Pressable style={[styles.settingsOption, styles.dangerOption]} onPress={handleLeaveGroup}>
                  <Ionicons name="exit-outline" size={20} color="#ff4757" />
                  <Text style={[styles.settingsOptionText, styles.dangerText]}>Leave Group</Text>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </Pressable>
              </View>
            </View>

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
    left: 0,
    right: 0,
    top: 0,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: 600,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoInput: {
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#667eea',
    paddingVertical: 8,
  },
  multilineInput: {
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#f0f4ff',
  },
  editButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dangerOption: {
    // No background color change needed for individual options
  },
  dangerText: {
    color: '#ff4757',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
  removeMemberButton: {
    padding: 8,
  },
});
