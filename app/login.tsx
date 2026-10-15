// ─────────────────────────────────────────────────────────────
// app/login.tsx
// Login Screen — Username + Password entry
//
// FLOW:
//   1. User submits credentials.
//   2. Call loginUser().
//   3a. If response.needs_2fa === false → tokens received → go to Home.
//   3b. If response.needs_2fa === true  → call initiate2FA() to send
//       the email code, then navigate to verify-2fa screen.
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/hooks/useAppTheme';
import { Theme } from '@/constants/theme';
import { loginUser, initiate2FA, saveTokens } from '@/services/authService';
import { saveCompanyId } from '@/utils/storage';


export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppTheme();

  // ── Form State ─────────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── UI State ───────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Input Validation ───────────────────────────────────────
  // Simple client-side guard before hitting the network.
  const isFormValid = username.trim().length > 0 && password.length >= 1;

  // ── Login Handler ──────────────────────────────────────────
  const handleLogin = async () => {
    if (!isFormValid) return;

    setLoading(true);
    setErrorMsg(null); // Clear any previous error

    try {
      // STEP 1: Submit username + password to the server.
      const result = await loginUser(username.trim(), password);

      if (!result.needs_2fa) {
        // ── SUCCESS PATH ──────────────────────────────────────
        // The server confirmed credentials AND 2FA is still valid.
        // Save the tokens securely and go straight to the Home screen.
        await saveTokens(result.access, result.refresh);

        // Save the company ID for data capture.
        // WHY await: production builds (Hermes) navigate much faster than
        // dev builds. A fire-and-forget import().then() would lose the race
        // against router.replace('/'), leaving companyId null in preview.tsx.
        if (result.user?.company_registration_ids?.length > 0) {
          await saveCompanyId(result.user.company_registration_ids[0]);
        }

        // replace() so the user cannot press "back" to return to login
        router.replace('/');

      } else {
        // ── 2FA REQUIRED PATH ────────────────────────────────
        // The server accepted the password but wants 2FA before
        // issuing tokens. We must:
        //   1. Trigger the email code to be sent.
        //   2. Navigate to the verification screen, passing the
        //      email AND the original credentials (so that screen
        //      can silently re-run login after verifying the code).
        await initiate2FA(result.email);

        router.push({
          pathname: '/verify-2fa',
          params: {
            email: result.email,
            // WHY pass credentials: the verify-2fa screen needs them
            // to automatically re-run loginUser() after verification,
            // so the user doesn't have to type their password again.
            username: username.trim(),
            password: password,
          },
        });
      }
    } catch (err: any) {
      // Show the error under the form (not an Alert pop-up,
      // which is disruptive and poor UX for form errors).
      setErrorMsg(err.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + Theme.spacing.xl, paddingBottom: insets.bottom + Theme.spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="leaf" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to continue earning from recycling
          </Text>
        </View>

        {/* ── Error Banner ────────────────────────────────── */}
        {errorMsg && (
          <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
          </View>
        )}

        {/* ── Form ─────────────────────────────────────────── */}
        <View style={styles.form}>

          {/* Username Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Enter your username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
              {/* Show/Hide password toggle */}
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: isFormValid && !loading
                  ? colors.primary
                  : colors.surfaceMuted,
              },
            ]}
            onPress={handleLogin}
            disabled={!isFormValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={[
                styles.loginButtonText,
                { color: isFormValid ? colors.textOnPrimary : colors.textMuted }
              ]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

        </View>

        {/* ── Footer Note ─────────────────────────────────── */}
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          A verification code may be sent to your email if required.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.lg,
    justifyContent: 'center',
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.typography.fontSize2xl,
    fontWeight: Theme.typography.fontWeightExtraBold,
    letterSpacing: -0.5,
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.typography.fontSizeMd,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Error Banner ─────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.lg,
  },
  errorText: {
    fontSize: Theme.typography.fontSizeSm,
    fontWeight: Theme.typography.fontWeightMedium,
    flex: 1,
  },

  // ── Form ─────────────────────────────────────────────────
  form: {
    gap: Theme.spacing.lg,
  },
  fieldGroup: {
    gap: Theme.spacing.sm,
  },
  label: {
    fontSize: Theme.typography.fontSizeSm,
    fontWeight: Theme.typography.fontWeightSemiBold,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: Theme.spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Theme.typography.fontSizeMd,
    height: '100%',
  },
  eyeButton: {
    paddingLeft: Theme.spacing.sm,
  },
  loginButton: {
    height: 54,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Theme.spacing.sm,
  },
  loginButtonText: {
    fontSize: Theme.typography.fontSizeMd,
    fontWeight: Theme.typography.fontWeightBold,
    letterSpacing: 0.3,
  },

  // ── Footer ───────────────────────────────────────────────
  footerNote: {
    textAlign: 'center',
    fontSize: Theme.typography.fontSizeXs,
    marginTop: Theme.spacing.xl,
    lineHeight: 18,
  },
});
