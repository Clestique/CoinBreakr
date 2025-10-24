import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authStorage } from '../../services/authStorage';
import { profileService, UserProfile, ChangePasswordRequest } from '../../services/profile';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Editable form fields
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNumber: '',
    profileImage: ''
  });

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const profile = await profileService.getUserProfile();
      setProfile(profile);
      // Pre-populate edit form
      setEditForm({
        name: profile.name,
        phoneNumber: profile.phoneNumber || '',
        profileImage: profile.profileImage || ''
      });
    } catch (err: any) {
      const errorMessage = err && err.success === false ? err.message : (err.message || 'An unexpected error occurred');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values from current profile state
    if (profile) {
      setEditForm({
        name: profile.name || '',
        phoneNumber: profile.phoneNumber || '',
        profileImage: profile.profileImage || ''
      });
    }
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: editForm.name.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        profileImage: editForm.profileImage
      };

      const response = await profileService.updateProfile(updateData);

      // Since API returns success message instead of updated profile,
      // we'll update the local state with the data we sent (which was confirmed successful)
      if (response && (response as any).success === true && profile) {
        const updatedProfile: UserProfile = {
          ...profile,
          name: updateData.name,
          phoneNumber: updateData.phoneNumber,
          profileImage: updateData.profileImage
        };

        // Update local state immediately
        setProfile(updatedProfile);
        // Also update the edit form to reflect the new data
        setEditForm({
          name: updatedProfile.name || '',
          phoneNumber: updatedProfile.phoneNumber || '',
          profileImage: updatedProfile.profileImage || ''
        });
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        // Fallback: if response format is unexpected, just update with our data
        const updatedProfile: UserProfile = {
          ...profile!,
          name: updateData.name,
          phoneNumber: updateData.phoneNumber,
          profileImage: updateData.profileImage
        };
        setProfile(updatedProfile);
        setEditForm({
          name: updatedProfile.name || '',
          phoneNumber: updatedProfile.phoneNumber || '',
          profileImage: updatedProfile.profileImage || ''
        });
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (err: any) {
      const errorMessage = err && err.success === false ? err.message : (err.message || 'Failed to update profile');
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await profileService.changePassword({
        currentPassword: passwordForm.currentPassword.trim(),
        newPassword: passwordForm.newPassword.trim()
      });

      // Clear form and hide section on success
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setShowChangePassword(false);
      Alert.alert('Success', response.message || 'Password changed successfully');
    } catch (err: any) {
      const errorMessage = err && err.success === false ? err.message : (err.message || 'Failed to change password');
      Alert.alert('Error', errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authStorage.clearAuth();
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
            } catch (err) {
              // Handle logout error silently or show user-friendly message
            }
          }
        }
      ]
    );
  };

  const handleImagePicker = async () => {
    if (!isEditing) return;

    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const imageUri = `data:image/jpeg;base64,${asset.base64}`;
          setEditForm({ ...editForm, profileImage: imageUri });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAccountDeletion = () => {
    Alert.alert(
      'Account Deletion',
      'Account deletion functionality is not implemented yet.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={isEditing ? handleCancel : handleEdit}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        scrollEnabled={isEditing || showChangePassword}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Details Section */}
        <SectionCard title="Profile Details">
          <View style={styles.profileHeader}>
            {/* Left side - Profile Image */}
            <View style={styles.profileImageSection}>
              <TouchableOpacity onPress={handleImagePicker} disabled={!isEditing}>
                <Image
                  source={{
                    uri: isEditing && editForm.profileImage
                      ? editForm.profileImage
                      : profile?.profileImage || 'https://placehold.co/80x80'
                  }}
                  style={styles.profileImage}
                />
                {isEditing && (
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
              {isEditing && (
                <TouchableOpacity style={styles.changeImageButton} onPress={handleImagePicker}>
                  <Text style={styles.changeImageText}>Change Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Right side - Read-only Info */}
            <View style={styles.profileInfoSection}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email || 'Not set'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          {/* Editable Fields */}
          <View style={styles.editableFields}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  placeholder="Enter your name"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile?.name || 'Not set'}</Text>
              )}
            </View>

            <View style={[styles.fieldContainer, !isEditing && styles.lastFieldContainer]}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={editForm.phoneNumber}
                  onChangeText={(text) => setEditForm({ ...editForm, phoneNumber: text })}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile?.phoneNumber || 'Not set'}</Text>
              )}
            </View>
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>Save Details</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </SectionCard>

        {/* Account Actions Section */}
        <SectionCard title="Account Actions">
          <TouchableOpacity
            style={styles.accountAction}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.text.primary} />
            <Text style={styles.accountActionText}>Change Password</Text>
            <Ionicons
              name={showChangePassword ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.passwordSection}>
              <Text style={styles.passwordSectionTitle}>Change Password</Text>

              <View style={styles.passwordField}>
                <Text style={styles.passwordLabel}>Current Password *</Text>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
                  placeholder="Enter your current password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.passwordField}>
                <Text style={styles.passwordLabel}>New Password *</Text>
                <TextInput
                  style={[
                    styles.passwordInput,
                    passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 6 && styles.passwordInputError
                  ]}
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                  placeholder="Enter new password (min. 6 characters)"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 6 && (
                  <Text style={styles.passwordError}>Password must be at least 6 characters</Text>
                )}
              </View>

              <View style={styles.passwordActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.changePasswordButton]}
                  onPress={handleChangePassword}
                  disabled={changingPassword || !passwordForm.currentPassword.trim() || !passwordForm.newPassword.trim()}
                >
                  {changingPassword ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.actionButtonText}>Update</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelPasswordButton]}
                  onPress={() => {
                    setPasswordForm({ currentPassword: '', newPassword: '' });
                    setShowChangePassword(false);
                  }}
                  disabled={changingPassword}
                >
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.accountAction} onPress={handleAccountDeletion}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.accountActionText, styles.dangerText]}>Request Account Deletion</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountActionLast} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.accountActionText, styles.dangerText]}>Logout</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        </SectionCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.body,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    flex: 0,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.tertiary,
    position: 'relative',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeImageButton: {
    marginTop: 8,
  },
  changeImageText: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
    textAlign: 'center',
  },
  profileInfoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  editableFields: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  lastFieldContainer: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 4,
  },

  fieldInput: {
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background.primary,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // minHeight: 48,
  },
  saveButton: {
    backgroundColor: colors.primary[600],
  },
  cancelButton: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  changePasswordButton: {
    backgroundColor: colors.primary[600],
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: colors.text.primary,
  },
  accountAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  accountActionLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  accountActionText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  dangerText: {
    color: colors.error,
  },
  passwordSection: {
    backgroundColor: colors.background.tertiary,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  passwordSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  passwordField: {
    marginBottom: 12,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  passwordInput: {
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cancelPasswordButton: {
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  passwordInputError: {
    borderColor: colors.error,
  },
  passwordError: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;