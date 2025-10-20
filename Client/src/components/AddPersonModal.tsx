import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

interface AddPersonModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (person: { name: string; email?: string; phoneNumber?: string; countryCode?: string }) => void;
  initialQuery?: string;
}

const AddPersonModal: React.FC<AddPersonModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialQuery = '',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phoneNumber?: string;
    form?: string;
  }>({});

  useEffect(() => {
    if (visible && initialQuery) {
      // Smart pre-fill based on query type
      if (isEmail(initialQuery)) {
        setEmail(initialQuery);
        setName('');
        setPhoneNumber('');
      } else if (isPhoneNumber(initialQuery)) {
        setPhoneNumber(initialQuery);
        setName('');
        setEmail('');
      } else {
        setName(initialQuery);
        setEmail('');
        setPhoneNumber('');
      }
    } else if (visible) {
      // Reset form when opening without query
      setName('');
      setEmail('');
      setPhoneNumber('');
      setCountryCode('+1');
    }
    setErrors({});
  }, [visible, initialQuery]);

  const isEmail = (text: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(text);
  };

  const isPhoneNumber = (text: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    return phoneRegex.test(text.replace(/[\s\-\(\)]/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (email.trim() && !isEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (phoneNumber.trim()) {
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        newErrors.phoneNumber = 'Phone number must be 7-15 digits';
      } else if (!/^\d+$/.test(cleanPhone)) {
        newErrors.phoneNumber = 'Phone number can only contain digits';
      }
    }

    // At least one contact method required
    if (!email.trim() && !phoneNumber.trim()) {
      newErrors.form = 'Please provide either an email or phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const fullPhoneNumber = phoneNumber.trim() 
      ? `${countryCode}${phoneNumber.replace(/[\s\-\(\)]/g, '')}`
      : undefined;

    onSubmit({
      name: name.trim(),
      email: email.trim() || undefined,
      phoneNumber: fullPhoneNumber,
      countryCode: phoneNumber.trim() ? countryCode : undefined,
    });

    // Reset form
    setName('');
    setEmail('');
    setPhoneNumber('');
    setCountryCode('+1');
    setErrors({});
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPhoneNumber('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Person</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {errors.form && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.form}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="Enter full name"
                  autoCapitalize="words"
                />
                {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                    if (errors.form) setErrors({ ...errors, form: undefined });
                  }}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneContainer}>
                  <TextInput
                    style={styles.countryCodeInput}
                    value={countryCode}
                    onChangeText={setCountryCode}
                    placeholder="+1"
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={[styles.phoneInput, errors.phoneNumber && styles.inputError]}
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setPhoneNumber(text);
                      if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
                      if (errors.form) setErrors({ ...errors, form: undefined });
                    }}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phoneNumber && <Text style={styles.fieldError}>{errors.phoneNumber}</Text>}
              </View>

              <Text style={styles.helperText}>
                * Name is required. Please provide either email or phone number.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Add Person</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: colors.gray[900],
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scrollView: {
    maxHeight: 400,
  },
  form: {
    padding: 20,
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '05',
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.medium,
    width: 80,
    textAlign: 'center',
  },
  phoneInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.medium,
    flex: 1,
  },
  fieldError: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    shadowColor: colors.primary[600],
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddPersonModal;