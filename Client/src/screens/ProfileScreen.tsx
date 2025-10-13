import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { profileService, UserProfile } from '../services/profile';

const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; imageUrl?: string; form?: string; passwordForm?: string; currentPassword?: string; newPassword?: string }>({});

  const nameRef = useRef<TextInput | null>(null);
  const phoneRef = useRef<TextInput | null>(null);
  const imageRef = useRef<TextInput | null>(null);
  const currentPasswordRef = useRef<TextInput | null>(null);
  const newPasswordRef = useRef<TextInput | null>(null);

  const [form, setForm] = useState<{ name: string; phone?: string; imageUrl?: string }>({ name: '' });
  const [passwordForm, setPasswordForm] = useState<{ currentPassword: string; newPassword: string }>({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await profileService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setForm({ name: res.data.name, phone: res.data.phone, imageUrl: res.data.imageUrl });
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
      const res = await profileService.updateProfile({ name: form.name, phone: form.phone, imageUrl: form.imageUrl });
      if (res.success && res.data) {
        setProfile(res.data);
        setEditMode(false);
      } else {
        setErrors({ form: res.message || 'Update failed' });
      }
    } catch (error: any) {
      const apiErr: any = error && error.success === false ? error : null;
      const fieldErrors: any = {};
      if (apiErr?.errors?.name?.length) fieldErrors.name = apiErr.errors.name[0];
      if (apiErr?.errors?.phone?.length) fieldErrors.phone = apiErr.errors.phone[0];
      if (apiErr?.errors?.imageUrl?.length) fieldErrors.imageUrl = apiErr.errors.imageUrl[0];
      setErrors({ ...fieldErrors, form: apiErr ? apiErr.message : 'An unexpected error occurred' });
      if (fieldErrors.name) nameRef.current?.focus();
      else if (fieldErrors.phone) phoneRef.current?.focus();
      else if (fieldErrors.imageUrl) imageRef.current?.focus();
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
        setErrors({ passwordForm: 'Password changed successfully' });
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

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <View style={styles.profileHeader}>
          <Image
            source={{ uri: form.imageUrl || 'https://placehold.co/96x96' }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{profile?.name || '-'}</Text>
            <Text style={styles.emailText}>{profile?.email || '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
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
              style={[styles.input, errors.phone ? styles.inputError : null]}
              editable={editMode}
              value={form.phone || ''}
              onChangeText={(t) => {
                setForm({ ...form, phone: t });
                if (errors.phone) setErrors({ ...errors, phone: undefined });
              }}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
            />
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              ref={imageRef}
              style={[styles.input, errors.imageUrl ? styles.inputError : null]}
              editable={editMode}
              value={form.imageUrl || ''}
              onChangeText={(t) => {
                setForm({ ...form, imageUrl: t });
                if (errors.imageUrl) setErrors({ ...errors, imageUrl: undefined });
              }}
              placeholder="https://..."
              autoCapitalize="none"
            />
            {errors.imageUrl ? <Text style={styles.errorText}>{errors.imageUrl}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Login</Text>
            <Text style={styles.readonlyValue}>{profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : '-'}</Text>
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
                  if (profile) setForm({ name: profile.name, phone: profile.phone, imageUrl: profile.imageUrl });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
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
        </View>
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
});

export default ProfileScreen;


