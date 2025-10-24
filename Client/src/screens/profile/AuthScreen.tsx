import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { authService, LoginRequest, RegisterRequest } from '../../services/auth';
import { authStorage } from '../../services/authStorage';
import colors from '../../theme/colors';

interface AuthScreenProps {
  navigation: any;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; form?: string }>({});
  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const nameInputRef = useRef<TextInput | null>(null);

  const handleAuth = async () => {
    // reset previous errors
    setErrors({});

    // client-side required validation
    if (!email || !password || (!isLogin && !name)) {
      const newErrors: { email?: string; password?: string; name?: string } = {};
      if (!email) newErrors.email = 'Email is required';
      if (!password) newErrors.password = 'Password is required';
      if (!isLogin && !name) newErrors.name = 'Full name is required';
      setErrors(newErrors);

      // focus the first invalid field
      if (newErrors.name && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (newErrors.email && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (newErrors.password && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      let authData;
      if (isLogin) {
        const loginData: LoginRequest = { email, password };
        authData = await authService.login(loginData);
      } else {
        const registerData: RegisterRequest = { name, email, password };
        authData = await authService.register(registerData);
      }

      // Store the token and user ID from auth response
      await authStorage.setToken(authData.token);
      await authStorage.setUserId(authData.user.id.toString());
      
      // Navigate to Main tab navigator after successful auth
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error: any) {
      console.error('Auth error:', error);
      // Normalize ApiErrorResponse shape coming from authService
      const apiError: any = error && error.success === false ? error : null;
      if (apiError && apiError.errors) {
        const fieldErrors: { email?: string; password?: string; name?: string; form?: string } = {};
        if (apiError.errors.email && apiError.errors.email.length) {
          fieldErrors.email = apiError.errors.email[0];
        }
        if (apiError.errors.password && apiError.errors.password.length) {
          fieldErrors.password = apiError.errors.password[0];
        }
        if (apiError.errors.name && apiError.errors.name.length) {
          fieldErrors.name = apiError.errors.name[0];
        }
        setErrors({ ...fieldErrors, form: apiError.message });

        // focus in priority order: name (for register), email, password
        if (!isLogin && fieldErrors.name && nameInputRef.current) {
          nameInputRef.current.focus();
        } else if (fieldErrors.email && emailInputRef.current) {
          emailInputRef.current.focus();
        } else if (fieldErrors.password && passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      } else {
        setErrors({ form: apiError ? apiError.message : 'An unexpected error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>💰</Text>
          <Text style={styles.title}>CoinBreakr</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                ref={nameInputRef}
                style={[
                  styles.input,
                  errors.name ? styles.inputError : null,
                ]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              ref={emailInputRef}
              style={[
                styles.input,
                errors.email ? styles.inputError : null,
              ]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={passwordInputRef}
              style={[
                styles.input,
                errors.password ? styles.inputError : null,
              ]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleAuth}
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {errors.form ? (
            <Text style={styles.formErrorText}>{errors.form}</Text>
          ) : null}

          <TouchableOpacity 
            style={[styles.authButton, isLoading && styles.authButtonDisabled]} 
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.authButtonText}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  authButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    shadowColor: colors.primary[600],
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  authButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchButtonText: {
    color: colors.primary[600],
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 6,
  },
  formErrorText: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AuthScreen;