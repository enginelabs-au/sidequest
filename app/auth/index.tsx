import { Button, Card, ErrorBanner, Screen } from '@/components/ui';
import { hasLegalUrls, privacyPolicyUrl, termsUrl } from '@/constants/legal';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
    configureNativeAuth,
    ensureProfile,
    getGoogleSignInPrerequisiteError,
    signInWithAppleNative,
    signInWithGoogleNative,
} from '@/lib/auth';
import { formatUserError } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export default function AuthScreen() {
  const router = useRouter();
  const { refreshCheckIn } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const googlePrereq = getGoogleSignInPrerequisiteError();
  const authDisabled = !isSupabaseConfigured || !!loading;

  useEffect(() => {
    configureNativeAuth();
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const openUrl = async (url: string | null, label: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      setError(`Could not open ${label}.`);
    }
  };

  const finishSignIn = async (session: Awaited<ReturnType<typeof signInWithGoogleNative>>) => {
    if (session) {
      await ensureProfile();
      await refreshCheckIn();
      router.replace('/');
    } else {
      setNotice('Sign in cancelled.');
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setNotice(null);
    setLoading('google');
    try {
      await finishSignIn(await signInWithGoogleNative());
    } catch (e) {
      setError(formatUserError(e, 'Google sign in failed'));
    } finally {
      setLoading(null);
    }
  };

  const handleApple = async () => {
    if (authDisabled || loading) return;
    setError(null);
    setNotice(null);
    setLoading('apple');
    try {
      await finishSignIn(await signInWithAppleNative());
    } catch (e) {
      setError(formatUserError(e, 'Apple sign in failed'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Screen>
      <Card style={styles.heroCard}>
        <Text style={styles.brand}>Side Quest</Text>
        <Text style={styles.heroTitle}>Sign up in seconds.</Text>
        <Text style={styles.heroSubtitle}>
          Gmail, Apple, or phone. Venue-anchored. Time-limited. Invisible until you opt in at a venue
          within 1km.
        </Text>
      </Card>

      {!isSupabaseConfigured ? (
        <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE3_AUTH.md." />
      ) : null}
      {googlePrereq ? <ErrorBanner message={googlePrereq} /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Card>
        <Button
          title={loading === 'google' ? 'Signing in...' : 'Continue with Google'}
          onPress={handleGoogle}
          disabled={authDisabled || !!googlePrereq}
          accessibilityLabel="Continue with Google"
        />
        {Platform.OS === 'ios' && appleAvailable ? (
          <View pointerEvents={authDisabled || loading === 'apple' ? 'none' : 'auto'}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={[styles.appleBtn, loading === 'apple' && styles.appleBtnDisabled]}
              onPress={handleApple}
            />
          </View>
        ) : null}
        <Button
          title="Continue with phone"
          variant="secondary"
          onPress={() => router.push('/auth/phone')}
          disabled={authDisabled}
          accessibilityLabel="Continue with phone number"
          style={styles.gap}
        />
      </Card>

      <Text style={styles.footer}>By continuing you agree to check out when you leave.</Text>
      {hasLegalUrls() ? (
        <View style={styles.legalRow}>
          {privacyPolicyUrl ? (
            <Pressable
              onPress={() => openUrl(privacyPolicyUrl, 'Privacy Policy')}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy"
            >
              <Text style={styles.legalLink}>Privacy</Text>
            </Pressable>
          ) : null}
          {privacyPolicyUrl && termsUrl ? <Text style={styles.legalSep}> · </Text> : null}
          {termsUrl ? (
            <Pressable
              onPress={() => openUrl(termsUrl, 'Terms')}
              accessibilityRole="link"
              accessibilityLabel="Terms of Service"
            >
              <Text style={styles.legalLink}>Terms</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text style={styles.footerMuted}>Your wellbeing. Your data.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginTop: spacing.xl },
  brand: {
    color: colors.accentDark,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  gap: { marginTop: spacing.md },
  appleBtn: {
    width: '100%',
    height: 48,
    marginTop: spacing.md,
  },
  appleBtnDisabled: { opacity: 0.6 },
  notice: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontSize: 14,
  },
  footer: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  footerMuted: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  legalLink: {
    color: colors.accentDark,
    fontSize: 12,
    fontWeight: '600',
  },
  legalSep: { color: colors.textMuted, fontSize: 12 },
});
