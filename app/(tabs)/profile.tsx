import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthService } from '../../googleServices/authService';
import { showSuccessAlert, showErrorAlert } from '../../components/ui/alert';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  
  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const profileCardOpacity = useSharedValue(0);
  const passwordSectionOpacity = useSharedValue(0);
  const dangerZoneOpacity = useSharedValue(0);

  useEffect(() => {
    loadUserProfile();
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    profileCardOpacity.value = withDelay(400, withSpring(1));
    passwordSectionOpacity.value = withDelay(600, withSpring(1));
    dangerZoneOpacity.value = withDelay(800, withSpring(1));
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await AuthService.getCurrentUser();
      
      // Ensure we have valid user data
      if (!userData || !userData.email) {
        throw new Error('Invalid user data received');
      }
      
      setUser(userData);
      setEditedName(userData.name || '');
      setEditedPhone(userData.phone || '');
    } catch (error: any) {
      console.error('Load user profile error:', error);
      showErrorAlert(
        'Profile Error',
        error.message || 'Failed to load profile. Please try again.'
      );
      if (error.message?.includes('Authentication expired') || error.message?.includes('expired')) {
        router.replace('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      showErrorAlert('Validation Error', 'Name cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser = await AuthService.updateProfile({
        name: editedName.trim(),
        phone: editedPhone.trim() || undefined,
      });
      
      setUser(updatedUser);
      setIsEditing(false);
      showSuccessAlert('Profile Updated', 'Your profile has been updated successfully.');
    } catch (error: any) {
      showErrorAlert(
        'Update Failed',
        error.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(user?.name || '');
    setEditedPhone(user?.phoneNumber || '');
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showErrorAlert('Validation Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorAlert('Validation Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showErrorAlert('Validation Error', 'New password must be at least 6 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      await AuthService.changePassword({ currentPassword, newPassword });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccessAlert('Password Changed', 'Your password has been updated successfully.');
    } catch (error: any) {
      showErrorAlert(
        'Password Change Failed',
        error.message || 'Failed to change password. Please try again.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              router.replace('/login');
            } catch (error: any) {
              showErrorAlert(
                'Sign Out Failed',
                error.message || 'Failed to sign out. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleRequestEmailChange = () => {
    Alert.alert(
      'Change Email',
      'To change your email address, please contact our support team.',
      [{ text: 'OK' }]
    );
  };

  const handleRequestPhoneChange = () => {
    Alert.alert(
      'Change Phone',
      'To change your phone number, please contact our support team.',
      [{ text: 'OK' }]
    );
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -50],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const profileCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: profileCardOpacity.value,
    transform: [{ translateY: interpolate(profileCardOpacity.value, [0, 1], [30, 0]) }],
  }));

  const passwordSectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: passwordSectionOpacity.value,
    transform: [{ translateY: interpolate(passwordSectionOpacity.value, [0, 1], [30, 0]) }],
  }));

  const dangerZoneAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dangerZoneOpacity.value,
    transform: [{ translateY: interpolate(dangerZoneOpacity.value, [0, 1], [30, 0]) }],
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  if (isLoading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle" size={80} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <Pressable style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
      
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons 
              name={isEditing ? "close" : "create"} 
              size={24} 
              color="#ffffff" 
            />
          </Pressable>
        </Animated.View>

        {/* Profile Details Section */}
        <Animated.View style={[styles.profileCard, profileCardAnimatedStyle]}>
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.cardGradient}
          >
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="person" size={20} color="#667eea" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.infoInput}
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder="Enter your name"
                      autoCapitalize="words"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{user.name || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="mail" size={20} color="#667eea" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={[styles.infoValue, styles.emailValue]}>{user.email || 'Not provided'}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="call" size={20} color="#667eea" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.infoInput}
                      value={editedPhone}
                      onChangeText={setEditedPhone}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {user.phoneNumber || 'Not provided'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {isEditing && (
              <View style={styles.editActions}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.actionButton, styles.saveButton, isSaving && styles.buttonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </Pressable>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Password Change Section */}
        <Animated.View style={[styles.passwordSection, passwordSectionAnimatedStyle]}>
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>Change Password</Text>
            
            <View style={styles.passwordInputContainer}>
              <Ionicons name="lock-closed" size={20} color="#667eea" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Current Password"
                placeholderTextColor="#999"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons 
                  name={showCurrentPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#667eea" 
                />
              </Pressable>
            </View>

            <View style={styles.passwordInputContainer}>
              <Ionicons name="lock-closed" size={20} color="#667eea" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#667eea" 
                />
              </Pressable>
            </View>

            <View style={styles.passwordInputContainer}>
              <Ionicons name="lock-closed" size={20} color="#667eea" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm New Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#667eea" 
                />
              </Pressable>
            </View>

            <Pressable
              style={[styles.changePasswordButton, isChangingPassword && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.changePasswordButtonText}>Change Password</Text>
              )}
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View style={[styles.dangerZone, dangerZoneAnimatedStyle]}>
          <View style={styles.dangerZoneCard}>
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            
            <Pressable style={styles.dangerZoneItem} onPress={handleRequestEmailChange}>
              <Ionicons name="mail" size={20} color="#ff4757" />
              <Text style={styles.dangerZoneText}>Request Email Change</Text>
              <Ionicons name="chevron-forward" size={20} color="#ff4757" />
            </Pressable>

            <Pressable style={styles.dangerZoneItem} onPress={handleRequestPhoneChange}>
              <Ionicons name="call" size={20} color="#ff4757" />
              <Text style={styles.dangerZoneText}>Request Phone Change</Text>
              <Ionicons name="chevron-forward" size={20} color="#ff4757" />
            </Pressable>

            <Pressable style={[styles.dangerZoneItem, styles.signOutItem]} onPress={handleSignOut}>
              <Ionicons name="log-out" size={20} color="#ff4757" />
              <Text style={[styles.dangerZoneText, styles.signOutText]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={20} color="#ff4757" />
            </Pressable>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 20,
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
    marginTop: 20,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  passwordSection: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoSection: {
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  emailValue: {
    color: '#667eea',
  },
  infoInput: {
    fontSize: 16,
    color: '#333333',
    borderBottomWidth: 1,
    borderBottomColor: '#667eea',
    paddingVertical: 5,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  inputIcon: {
    marginRight: 15,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 12,
  },
  passwordToggle: {
    padding: 5,
  },
  changePasswordButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  changePasswordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerZone: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  dangerZoneCard: {
    backgroundColor: 'rgba(255, 71, 87, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.2)',
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: 15,
  },
  dangerZoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    marginBottom: 10,
  },
  dangerZoneText: {
    flex: 1,
    fontSize: 16,
    color: '#ff4757',
    fontWeight: '500',
    marginLeft: 15,
  },
  signOutItem: {
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  signOutText: {
    fontWeight: '600',
  },
});