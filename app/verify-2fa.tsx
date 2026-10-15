// ─────────────────────────────────────────────────────────────
// app/verify-2fa.tsx
// Two-Factor Authentication Verification Screen
//
// HOW THIS SCREEN IS REACHED:
//   The login screen navigates here (with params) when the server
//   returns needs_2fa:true. The email code was already sent by
//   the login screen BEFORE navigating here.
//
// FLOW ON THIS SCREEN:
//   1. User types the 6-digit code from their email.
//   2. Call verify2FACode(email, code).
//   3. On success, automatically re-call loginUser(username, password).
//      WHY: The verify step only marks 2FA as done on the server.
//      It does NOT issue tokens. We need to login again to get them.
//   4. Save tokens and go to Home.
// ─────────────────────────────────────────────────────────────

import React, { useRef, useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/hooks/useAppTheme';
import { Theme } from '@/constants/theme';
import {
  verify2FACode,
  loginUser,
  initiate2FA,
  saveTokens,
} from '@/services/authService';

export default function Verify2FAScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppTheme();

  // ── Route Params ───────────────────────────────────────────
  // These were passed from the login screen. We need the email
  // to verify the code, and the credentials to re-run login
  // after verification succeeds.
  const { email, username, password } = useLocalSearchParams<{
    email: string;
    username: string;
    password: string;
  }>();

  // ── Code Input State ───────────────────────────────────────
  // We split the 6-digit code into 6 individual boxes for a
  // native-feeling OTP (One Time Password) input experience.
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // ── UI State ───────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // The full 6-digit code as a single string for API submission
  const fullCode = digits.join('');
  const isCodeComplete = fullCode.length === 6;

  // ── OTP Input Handler ──────────────────────────────────────
  // WHY this logic: when the user types a digit, we auto-advance
  // to the next box. When they backspace an empty box, we go back.
  // This mimics native SMS autofill-style OTP inputs.
  const handleDigitChange = (value: string, index: number) => {
    // Only allow single digit numbers
    const digit = value.replace(/[^0-9]/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance to next box if a digit was entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when the last digit is filled
    if (digit && index === 5) {
      const completeCode = newDigits.join('');
      if (completeCode.length === 6) {
        handleVerify(completeCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Go back to the previous box on backspace if current box is empty
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Verify Handler ─────────────────────────────────────────
  const handleVerify = async (codeOverride?: string) => {
    const code = codeOverride ?? fullCode;
    if (code.length !== 6 || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // STEP 2: Verify the 6-digit email code.
      await verify2FACode(email, code);

      // STEP 3: Verification succeeded. Now re-run login to get tokens.
      // WHY: The verify endpoint only marks 2FA as done. We need
      // to call login again to actually receive the JWT tokens.
      const loginResult = await loginUser(username, password);

      if (!loginResult.needs_2fa) {
        // STEP 4: Login succeeded — save tokens and go to Home.
        await saveTokens(loginResult.access, loginResult.refresh);
        
        import('@/utils/storage').then(m => {
          if (loginResult.user?.company_registration_ids?.length > 0) {
            m.saveCompanyId(loginResult.user.company_registration_ids[0]);
          }
        });
        
        router.replace('/');
      } else {
        // This should not happen after a successful 2FA verify,
        // but handle it gracefully just in case.
        setErrorMsg('Verification succeeded but login failed. Please try again from the start.');
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Verification failed. Please try again.');
      // Clear the code boxes so the user can re-enter easily
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend Handler ─────────────────────────────────────────
  // Allows the user to request a new code if theirs expired (1 min TTL).
  const handleResend = async () => {
    if (resendLoading) return;

    setResendLoading(true);
    setResendSuccess(false);
    setErrorMsg(null);

    try {
      await initiate2FA(email);
      setResendSuccess(true);
      // Auto-clear the success message after 4 seconds
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to resend code.');
    } finally {
      setResendLoading(false);
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
          {
            paddingTop: insets.top + Theme.spacing.xl,
            paddingBottom: insets.bottom + Theme.spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Back Button ─────────────────────────────────── */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="mail-unread-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Check Your Email
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a 6-digit verification code to
          </Text>
          <Text style={[styles.emailText, { color: colors.primary }]}>
            {email}
          </Text>
          <Text style={[styles.expiryNote, { color: colors.textMuted }]}>
            Code expires in 1 minute
          </Text>
        </View>

        {/* ── Error Banner ─────────────────────────────────── */}
        {errorMsg && (
          <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
          </View>
        )}

        {/* ── Resend Success Banner ─────────────────────────── */}
        {resendSuccess && (
          <View style={[styles.successBanner, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.successText, { color: colors.primary }]}>
              A new code has been sent to your email.
            </Text>
          </View>
        )}

        {/* ── 6-Digit OTP Input ─────────────────────────────── */}
        <View style={styles.otpContainer}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpBox,
                {
                  // Highlight the active box with primary color border
                  borderColor: digit ? colors.primary : colors.border,
                  backgroundColor: colors.surfaceMuted,
                  color: colors.textPrimary,
                },
              ]}
              value={digit}
              onChangeText={(val) => handleDigitChange(val, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              editable={!loading}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* ── Verify Button ─────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            {
              backgroundColor: isCodeComplete && !loading
                ? colors.primary
                : colors.surfaceMuted,
            },
          ]}
          onPress={() => handleVerify()}
          disabled={!isCodeComplete || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <Text style={[
              styles.verifyButtonText,
              { color: isCodeComplete ? colors.textOnPrimary : colors.textMuted },
            ]}>
              Verify & Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* ── Resend Code ───────────────────────────────────── */}
        <View style={styles.resendRow}>
          <Text style={[styles.resendLabel, { color: colors.textMuted }]}>
            Didn't receive it?{' '}
          </Text>
          <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
            {resendLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.resendLink, { color: colors.primary }]}>
                Resend Code
              </Text>
            )}
          </TouchableOpacity>
        </View>

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

  // ── Back Button ──────────────────────────────────────────
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Theme.spacing.xl,
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
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
  },
  emailText: {
    fontSize: Theme.typography.fontSizeMd,
    fontWeight: Theme.typography.fontWeightBold,
    marginTop: 4,
  },
  expiryNote: {
    fontSize: Theme.typography.fontSizeXs,
    marginTop: Theme.spacing.sm,
  },

  // ── Banners ──────────────────────────────────────────────
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.lg,
  },
  successText: {
    fontSize: Theme.typography.fontSizeSm,
    fontWeight: Theme.typography.fontWeightMedium,
    flex: 1,
  },

  // ── OTP Input ────────────────────────────────────────────
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xl,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
    fontSize: Theme.typography.fontSizeXl,
    fontWeight: Theme.typography.fontWeightBold,
  },

  // ── Verify Button ────────────────────────────────────────
  verifyButton: {
    height: 54,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  verifyButtonText: {
    fontSize: Theme.typography.fontSizeMd,
    fontWeight: Theme.typography.fontWeightBold,
    letterSpacing: 0.3,
  },

  // ── Resend ───────────────────────────────────────────────
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendLabel: {
    fontSize: Theme.typography.fontSizeSm,
  },
  resendLink: {
    fontSize: Theme.typography.fontSizeSm,
    fontWeight: Theme.typography.fontWeightBold,
  },
});
