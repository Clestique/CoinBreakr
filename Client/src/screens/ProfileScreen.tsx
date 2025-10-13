import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
// @ts-ignore - use require to avoid type requirement if expo-image-picker types are missing
const ImagePicker: any = require('expo-image-picker');
import { useNavigation } from '@react-navigation/native';
import { authStorage } from '../services/authStorage';
import { profileService } from '../services/profile';
import SectionCard from '../components/SectionCard';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ name?: string; phoneNumber?: string; profileImage?: string; form?: string; passwordForm?: string; currentPassword?: string; newPassword?: string }>({});
  const [success, setSuccess] = useState<{ form?: string; passwordForm?: string }>({});
  const nameRef = useRef<TextInput | null>(null);
  const phoneRef = useRef<TextInput | null>(null);
  const imageRef = useRef<TextInput | null>(null);
  const currentPasswordRef = useRef<TextInput | null>(null);
  const newPasswordRef = useRef<TextInput | null>(null);

  const [form, setForm] = useState<{ name: string; phoneNumber?: string; profileImage?: string }>({ name: '' });
  const [passwordForm, setPasswordForm] = useState<{ currentPassword: string; newPassword: string }>({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    loadProfile();
    // request media permissions for image picker
    (async () => {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (_) {}
    })();
  }, []);

  // Auto-dismiss success bars
  useEffect(() => {
    if (success.form || success.passwordForm) {
      const t = setTimeout(() => setSuccess({}), 2500);
      return () => clearTimeout(t);
    }
  }, [success.form, success.passwordForm]);

  const loadProfile = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await profileService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setForm({
          name: res.data.name,
          phoneNumber: (res.data as any).phoneNumber,
          profileImage: (res.data as any).profileImage,
        });
      } else {
        setErrors({ form: res.message || 'Failed to load profile' });
      }
    } catch (error: any) {
      const apiErr: any = error && error.success === false ? error : null;
      setErrors({ form: apiErr ? apiErr.message : 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const onSaveProfile = async () => {
    setErrors({});
    if (!form.name) {
      setErrors({ name: 'Name is required' });
      nameRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const res = await profileService.updateProfile({ name: form.name, phoneNumber: form.phoneNumber, profileImage: form.profileImage });
      if (res.success) {
        setProfile((prev: any) => ({
          ...(prev || {}),
          name: form.name,
          phoneNumber: form.phoneNumber,
          profileImage: form.profileImage,
        }));
        setEditMode(false);
        setSuccess({ form: 'Profile updated successfully' });
      } else {
        setErrors({ form: res.message || 'Update failed' });
      }
    } catch (error: any) {
      const apiErr: any = error && error.success === false ? error : null;
      const fieldErrors: any = {};
      if (apiErr?.errors?.name?.length) fieldErrors.name = apiErr.errors.name[0];
      if (apiErr?.errors?.phoneNumber?.length) fieldErrors.phoneNumber = apiErr.errors.phoneNumber[0];
      if (apiErr?.errors?.profileImage?.length) fieldErrors.profileImage = apiErr.errors.profileImage[0];
      setErrors({ ...fieldErrors, form: apiErr ? apiErr.message : 'An unexpected error occurred' });
      if (fieldErrors.name) nameRef.current?.focus();
      else if (fieldErrors.phoneNumber) phoneRef.current?.focus();
      else if (fieldErrors.profileImage) imageRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    setErrors({});
    if (!passwordForm.currentPassword) {
      setErrors({ currentPassword: 'Current password is required' });
      currentPasswordRef.current?.focus();
      return;
    }
    if (!passwordForm.newPassword) {
      setErrors({ newPassword: 'New password is required' });
      newPasswordRef.current?.focus();
      return;
    }

    setChangingPassword(true);
    try {
      const res = await profileService.changePassword(passwordForm);
      if (res.success) {
        setPasswordForm({ currentPassword: '', newPassword: '' });
        setSuccess({ passwordForm: 'Password changed successfully' });
      } else {
        setErrors({ passwordForm: res.message || 'Failed to change password' });
      }
    } catch (error: any) {
      const apiErr: any = error && error.success === false ? error : null;
      const fieldErrors: any = {};
      if (apiErr?.errors?.currentPassword?.length) fieldErrors.currentPassword = apiErr.errors.currentPassword[0];
      if (apiErr?.errors?.newPassword?.length) fieldErrors.newPassword = apiErr.errors.newPassword[0];
      setErrors({ ...fieldErrors, passwordForm: apiErr ? apiErr.message : 'An unexpected error occurred' });
      if (fieldErrors.currentPassword) currentPasswordRef.current?.focus();
      else if (fieldErrors.newPassword) newPasswordRef.current?.focus();
    } finally {
      setChangingPassword(false);
    }
  };

  const onPickImage = async () => {
    if (!editMode) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      // Newer expo-image-picker returns { canceled, assets }
      // @ts-ignore
      if (result.canceled) return;
      // @ts-ignore
      const asset = result.assets && result.assets.length ? result.assets[0] : null;
      if (asset && asset.base64) {
        const mime = (asset.mimeType as string) || 'image/jpeg';
        const dataUri = `data:${mime};base64,${asset.base64}`;
        setForm({ ...form, profileImage: dataUri });
      }
    } catch (e) {
      // silently ignore picker errors, user can retry
    }
  };

  const onLogout = async () => {
    try {
      await profileService.logout();
    } catch (_) {}
    await authStorage.clearAuth();
    // Navigate to Auth stack
    // @ts-ignore
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Profile</Text>

        {success.form ? (
          <View style={styles.toastSuccess}>
            <Text style={styles.toastText}>{success.form}</Text>
          </View>
        ) : null}
        {success.passwordForm ? (
          <View style={styles.toastSuccess}>
            <Text style={styles.toastText}>{success.passwordForm}</Text>
          </View>
        ) : null}

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={onPickImage} activeOpacity={editMode ? 0.7 : 1}>
            <Image
              source={{ uri: form.profileImage || 'https://placehold.co/96x96' }}
              style={styles.avatar}
            />
            {editMode ? <Text style={styles.changePhotoText}>Change Photo</Text> : null}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{profile?.name || '-'}</Text>
            <Text style={styles.emailText}>{profile?.email || '-'}</Text>
          </View>
        </View>

        <SectionCard title="Profile Details">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              ref={nameRef}
              style={[styles.input, errors.name ? styles.inputError : null]}
              editable={editMode}
              value={form.name}
              onChangeText={(t) => {
                setForm({ ...form, name: t });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="Enter your name"
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.readonlyValue}>{profile?.email || '-'}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              ref={phoneRef}
              style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
              editable={editMode}
              value={form.phoneNumber || ''}
              onChangeText={(t) => {
                setForm({ ...form, phoneNumber: t });
                if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
              }}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
            />
            {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
          </View>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.button, editMode ? styles.buttonSecondary : styles.buttonPrimary]}
              onPress={() => {
                if (editMode) {
                  onSaveProfile();
                } else {
                  setEditMode(true);
                  setTimeout(() => nameRef.current?.focus(), 0);
                }
              }}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{editMode ? 'Save' : 'Edit Profile'}</Text>}
            </TouchableOpacity>
            {editMode ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonTertiary]}
                onPress={() => {
                  setEditMode(false);
                  setErrors({});
                  if (profile) setForm({ name: profile.name, phoneNumber: (profile as any).phoneNumber, profileImage: profile.profileImage });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Security">
          {errors.passwordForm ? <Text style={styles.passwordFormMessage}>{errors.passwordForm}</Text> : null}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              ref={currentPasswordRef}
              style={[styles.input, errors.currentPassword ? styles.inputError : null]}
              value={passwordForm.currentPassword}
              onChangeText={(t) => {
                setPasswordForm({ ...passwordForm, currentPassword: t });
                if (errors.currentPassword) setErrors({ ...errors, currentPassword: undefined });
              }}
              placeholder="Enter current password"
              secureTextEntry
            />
            {errors.currentPassword ? <Text style={styles.errorText}>{errors.currentPassword}</Text> : null}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              ref={newPasswordRef}
              style={[styles.input, errors.newPassword ? styles.inputError : null]}
              value={passwordForm.newPassword}
              onChangeText={(t) => {
                setPasswordForm({ ...passwordForm, newPassword: t });
                if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
              }}
              placeholder="Enter new password"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={onChangePassword}
            />
            {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
          </View>
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={onChangePassword} disabled={changingPassword}>
            {changingPassword ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Update Password</Text>}
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Account Closure">
          <Text style={styles.helperText}>Request to permanently close your account. This action is reviewed and may take time.</Text>
          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={async () => {
              try {
                const res = await profileService.requestAccountClosure();
                if (res.success) setSuccess({ form: res.message || 'Closure request submitted' });
                else setErrors({ form: res.message || 'Request failed' });
              } catch (e: any) {
                setErrors({ form: e?.message || 'Request failed' });
              }
            }}
          >
            <Text style={styles.buttonText}>Request Account Closure</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Danger Zone">
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={onLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
    backgroundColor: '#F3F4F6',
  },
  changePhotoText: {
    marginTop: 4,
    fontSize: 11,
    color: '#059669',
    textAlign: 'center',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  emailText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  readonlyValue: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonPrimary: {
    backgroundColor: '#059669',
  },
  buttonSecondary: {
    backgroundColor: '#059669',
  },
  buttonTertiary: {
    backgroundColor: '#9CA3AF',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  dangerButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
  },
  formError: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
  },
  passwordFormMessage: {
    color: '#059669',
    fontSize: 14,
    marginBottom: 8,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ProfileScreen;
