import {
  AppTextInput,
  Button,
  Card,
  ErrorBanner,
  Screen,
  ScreenSubtitle,
  ScreenTitle,
} from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  ensureProfile,
  isValidE164Phone,
  normalizePhone,
  signInWithPhone,
  verifyPhoneOtp,
} from '@/lib/auth';
import { formatUserError } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { refreshCheckIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authDisabled = !isSupabaseConfigured;

  const normalizedPhone = normalizePhone(phone);

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isValidE164Phone(normalizedPhone)) {
        setError('Enter a valid number with country code (e.g. +61412345678).');
        return;
      }
      await signInWithPhone(normalizedPhone);
      setSent(true);
    } catch (e) {
      setError(formatUserError(e, 'Failed to send code'));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    setError(null);
    try {
      await verifyPhoneOtp(normalizedPhone, otp);
      await ensureProfile();
      await refreshCheckIn();
      router.replace('/');
    } catch (e) {
      setError(formatUserError(e, 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  const changeNumber = () => {
    setSent(false);
    setOtp('');
    setError(null);
  };

  return (
    <Screen>
      <ScreenTitle>Phone sign in</ScreenTitle>
      <ScreenSubtitle>Enter your number with country code (e.g. +61...).</ScreenSubtitle>

      {!isSupabaseConfigured ? (
        <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE3_AUTH.md." />
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <AppTextInput
          placeholder="+61..."
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          editable={!sent && !authDisabled}
          accessibilityLabel="Phone number with country code"
          style={styles.input}
        />
        {sent ? (
          <>
            <AppTextInput
              placeholder="6-digit code"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              accessibilityLabel="SMS verification code"
              style={styles.input}
            />
            <Button
              title={loading ? 'Verifying...' : 'Verify code'}
              onPress={verify}
              disabled={loading || authDisabled || otp.length < 6}
              accessibilityLabel="Verify SMS code"
            />
            <Button
              title="Change number"
              variant="ghost"
              onPress={changeNumber}
              disabled={loading}
              accessibilityLabel="Change phone number"
              style={styles.changeNumber}
            />
          </>
        ) : (
          <Button
            title={loading ? 'Sending...' : 'Send code'}
            onPress={sendOtp}
            disabled={loading || authDisabled || !phone}
            accessibilityLabel="Send SMS verification code"
          />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: spacing.md },
  changeNumber: { marginTop: spacing.sm },
});
