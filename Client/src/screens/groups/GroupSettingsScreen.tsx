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
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { groupsService, Group } from '../../services/groups';
import { authStorage } from '../../services/authStorage';

type GroupSettingsScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any>;
};

const GroupSettingsScreen: React.FC<GroupSettingsScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { group: initialGroup } = route.params as { group: Group };

  // State
  const [group, setGroup] = useState<Group>(initialGroup);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedMembers, setExpandedMembers] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description || '');

  useEffect(() => {
    getCurrentUser();
    loadGroupWithMembers();
  }, []);

  const loadGroupWithMembers = async () => {
    try {
      const populatedGroup = await groupsService.getGroupByIdWithMembers(group._id);
      setGroup(populatedGroup);
    } catch (error) {
      console.error('Error loading group with members:', error);
      // Keep the original group data if population fails
    }
  };

  // Refresh group data when returning from AddGroupMembers screen
  useFocusEffect(
    React.useCallback(() => {
      const refreshGroup = async () => {
        try {
          const updatedGroup = await groupsService.getGroupByIdWithMembers(group._id);
          setGroup(updatedGroup);
        } catch (error) {
          console.error('Error refreshing group:', error);
        }
      };

      refreshGroup();
    }, [group._id])
  );

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



  const createdById = typeof group.createdBy === 'string' ? group.createdBy : group.createdBy._id;
  const isCreator = currentUserId === createdById;
  const currentMember = group.members.find(member => 
    (typeof member.user === 'string' ? member.user : member.user._id) === currentUserId
  );
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove member');
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
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedMembers(!expandedMembers)}
          >
            <Text style={styles.sectionTitle}>Members ({group.members.length})</Text>
            <Ionicons
              name={expandedMembers ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {/* Expanded Members Content */}
          {expandedMembers && (
            <View style={styles.expandedContent}>
              {/* Add Members Button - Only for Admins */}
              {isAdmin && (
                <TouchableOpacity
                  style={styles.addMemberButton}
                  onPress={() => navigation.navigate('AddGroupMembers', {
                    groupId: group._id,
                    currentMembers: group.members.map(m => typeof m.user === 'string' ? m.user : m.user._id)
                  })}
                >
                  <Ionicons name="person-add-outline" size={20} color={colors.primary[600]} />
                  <Text style={styles.addMemberButtonText}>Add Members</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}

              {/* Current Members List */}
              <View style={styles.membersList}>
                {group.members.map((member, index) => (
                  <View key={member._id || index} style={[
                    styles.memberItem,
                    index === group.members.length - 1 && styles.lastMemberItem
                  ]}>
                    <Image
                      source={{ 
                        uri: typeof member.user === 'object' && member.user.profileImage 
                          ? member.user.profileImage 
                          : 'https://placehold.co/40x40' 
                      }}
                      style={styles.memberAvatar}
                    />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {(typeof member.user === 'string' ? member.user : member.user._id) === currentUserId 
                          ? 'You' 
                          : typeof member.user === 'object' 
                            ? member.user.name 
                            : `Member ${index + 1}`}
                      </Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                      <Text style={styles.joinedDate}>
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {isAdmin && (typeof member.user === 'string' ? member.user : member.user._id) !== currentUserId && (
                      <TouchableOpacity
                        style={styles.removeMemberButton}
                        onPress={() => handleRemoveMember(
                          typeof member.user === 'string' ? member.user : member.user._id, 
                          typeof member.user === 'object' ? member.user.name : `Member ${index + 1}`
                        )}
                      >
                        <Ionicons name="remove-circle-outline" size={20} color={colors.error} />
                      </TouchableOpacity>
                    )}
                    {(typeof member.user === 'string' ? member.user : member.user._id) === currentUserId && !isCreator && (
                      <TouchableOpacity
                        style={styles.leaveButton}
                        onPress={() => handleRemoveMember(
                          typeof member.user === 'string' ? member.user : member.user._id, 
                          'You'
                        )}
                      >
                        <Text style={styles.leaveButtonText}>Leave</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.lastSection}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {/* Creator can delete group */}
          {(isCreator || isAdmin) && (
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
          {
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => handleRemoveMember(currentUserId!, 'You')}
            >
              <Ionicons name="exit-outline" size={20} color={colors.error} />
              <Text style={[styles.actionButtonText, styles.dangerText]}>Leave Group</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          }
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
  lastSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
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
    paddingVertical: 4,
  },
  expandedContent: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
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
  lastMemberItem: {
    borderBottomWidth: 0,
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
    color: colors.background.primary,
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
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  addMemberButtonText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },

});

export default GroupSettingsScreen;