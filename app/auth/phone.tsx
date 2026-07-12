import {
    AppTextInput,
    Button,
    Card,
    ErrorBanner,
    Screen,
    ScreenSubtitle,
} from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
    ensureProfile,
    isValidE164Phone,
    normalizePhone,
    signInWithPhone,
    verifyPhoneOtp,
} from '@/lib/auth';
import { formatUserError } from '@/lib/errors';
import {
    formatOtpCountdown,
    sanitizeOtpInput,
    SMS_OTP_EXPIRY_SEC,
    SMS_OTP_LENGTH,
    SMS_RESEND_COOLDOWN_SEC,
} from '@/lib/phoneOtp';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, type TextInput } from 'react-native';

/** Keep a leading + and digits only; supports AU local 04… → +614… on send. */
function formatPhoneInput(raw: string): string {
  const stripped = raw.replace(/[^\d+]/g, '');
  if (!stripped || stripped === '+') return '+';
  const digits = stripped.replace(/\+/g, '');
  return `+${digits}`;
}

function startOtpTimers(
  setResendSeconds: (n: number) => void,
  setExpiresSeconds: (n: number) => void,
): void {
  setResendSeconds(SMS_RESEND_COOLDOWN_SEC);
  setExpiresSeconds(SMS_OTP_EXPIRY_SEC);
}

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { refreshCheckIn } = useAuth();
  const { colors } = useTheme();
  const otpRef = useRef<TextInput>(null);

  const [phone, setPhone] = useState('+');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [expiresSeconds, setExpiresSeconds] = useState(0);
  const authDisabled = !isSupabaseConfigured;

  const normalizedPhone = normalizePhone(phone);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        input: { marginBottom: spacing.md },
        changeNumber: { marginTop: spacing.sm },
        hint: {
          color: colors.textSecondary,
          fontSize: 14,
          textAlign: 'center',
          marginBottom: spacing.sm,
        },
        hintExpired: {
          color: colors.warning ?? colors.textSecondary,
          fontSize: 14,
          textAlign: 'center',
          marginBottom: spacing.sm,
        },
      }),
    [colors],
  );

  useEffect(() => {
    if (!sent) return;
    const id = setInterval(() => {
      setResendSeconds((s) => Math.max(0, s - 1));
      setExpiresSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [sent]);

  useEffect(() => {
    if (sent) {
      const t = setTimeout(() => otpRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [sent]);

  const requestOtp = useCallback(async () => {
    if (!isValidE164Phone(normalizedPhone)) {
      setError('Enter a valid number with country code (e.g. +61412345678).');
      return false;
    }
    await signInWithPhone(normalizedPhone);
    setSent(true);
    setOtp('');
    startOtpTimers(setResendSeconds, setExpiresSeconds);
    return true;
  }, [normalizedPhone]);

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await requestOtp();
    } catch (e) {
      setError(formatUserError(e, 'Failed to send code'));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendSeconds > 0) return;
    setLoading(true);
    setError(null);
    try {
      await requestOtp();
    } catch (e) {
      setError(formatUserError(e, 'Could not resend code'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (codeOverride?: string) => {
    const code = sanitizeOtpInput(codeOverride ?? otp);
    setLoading(true);
    setError(null);
    try {
      if (code.length < SMS_OTP_LENGTH) {
        setError(`Enter the ${SMS_OTP_LENGTH}-digit code from your SMS.`);
        return;
      }
      await verifyPhoneOtp(normalizedPhone, code);
      await ensureProfile();
      await refreshCheckIn();
      router.replace('/');
    } catch (e) {
      setError(formatUserError(e, 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    const next = sanitizeOtpInput(text);
    setOtp(next);
    if (next.length === SMS_OTP_LENGTH && !loading) {
      void verifyCode(next);
    }
  };

  const changeNumber = () => {
    setSent(false);
    setOtp('');
    setPhone('+');
    setResendSeconds(0);
    setExpiresSeconds(0);
    setError(null);
  };

  const otpAutoFillProps =
    Platform.OS === 'ios'
      ? { textContentType: 'oneTimeCode' as const, autoComplete: 'one-time-code' as const }
      : { autoComplete: 'sms-otp' as const, importantForAutofill: 'yes' as const };

  return (
    <Screen>
      <ScreenSubtitle>
        Your number is sent in international format. Australian numbers can start with 04… — we add +61
        automatically. iOS will suggest the code above the keyboard when the SMS arrives.
      </ScreenSubtitle>

      {!isSupabaseConfigured ? (
        <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE3_AUTH.md." />
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <AppTextInput
          placeholder="+61412345678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(text) => setPhone(formatPhoneInput(text))}
          editable={!sent && !authDisabled}
          autoComplete="tel"
          textContentType="telephoneNumber"
          accessibilityLabel="Phone number with country code"
          style={styles.input}
        />
        {sent ? (
          <>
            {expiresSeconds > 0 ? (
              <Text style={styles.hint} accessibilityLiveRegion="polite">
                Code expires in {formatOtpCountdown(expiresSeconds)}
              </Text>
            ) : (
              <Text style={styles.hintExpired} accessibilityLiveRegion="polite">
                Code expired — tap Resend code for a new one.
              </Text>
            )}
            <AppTextInput
              ref={otpRef}
              placeholder={`${SMS_OTP_LENGTH}-digit code`}
              keyboardType="number-pad"
              inputMode="numeric"
              value={otp}
              onChangeText={handleOtpChange}
              maxLength={SMS_OTP_LENGTH}
              accessibilityLabel="SMS verification code"
              style={styles.input}
              {...otpAutoFillProps}
            />
            <Button
              title={loading ? 'Verifying...' : 'Verify code'}
              onPress={() => verifyCode()}
              disabled={loading || authDisabled || otp.length < SMS_OTP_LENGTH}
              accessibilityLabel="Verify SMS code"
            />
            <Button
              title={
                loading && resendSeconds <= 0
                  ? 'Sending...'
                  : resendSeconds > 0
                    ? `Resend code in ${formatOtpCountdown(resendSeconds)}`
                    : 'Resend code'
              }
              variant="ghost"
              onPress={resendOtp}
              disabled={loading || authDisabled || resendSeconds > 0}
              accessibilityLabel={
                resendSeconds > 0 ? `Resend code available in ${resendSeconds} seconds` : 'Resend code'
              }
              style={styles.changeNumber}
            />
            <Button
              title="Change number"
              variant="ghost"
              onPress={changeNumber}
              disabled={loading}
              accessibilityLabel="Change phone number"
            />
          </>
        ) : (
          <Button
            title={loading ? 'Sending...' : 'Send code'}
            onPress={sendOtp}
            disabled={loading || authDisabled || phone.length < 4}
            accessibilityLabel="Send SMS verification code"
          />
        )}
      </Card>
    </Screen>
  );
}
