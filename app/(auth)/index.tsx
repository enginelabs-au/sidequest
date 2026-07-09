import { Button, ErrorBanner, Screen, ScreenSubtitle, ScreenTitle } from '@/components/ui';
import { hasLegalUrls, privacyPolicyUrl, termsUrl } from '@/constants/legal';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ensureProfile, signInWithOAuth } from '@/lib/auth';
import { formatUserError } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export default function AuthScreen() {
  const router = useRouter();
  const { refreshCheckIn } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const authDisabled = !isSupabaseConfigured || !!loading;

  const openUrl = async (url: string | null, label: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      setError(`Could not open ${label}.`);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    setNotice(null);
    setLoading(provider);
    try {
      const session = await signInWithOAuth(provider);
      if (session) {
        await ensureProfile();
        await refreshCheckIn();
        router.replace('/');
      } else {
        setNotice('Sign in cancelled.');
      }
    } catch (e) {
      setError(formatUserError(e, 'Sign in failed'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.brand}>Side Quest</Text>
        <ScreenTitle>The social radar for this moment only.</ScreenTitle>
        <ScreenSubtitle>
          Safer and more private than IRL. Venue-anchored. Time-limited. Invisible until you opt in.
        </ScreenSubtitle>
      </View>

      {!isSupabaseConfigured ? (
        <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE3_AUTH.md." />
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.actions}>
        <Button
          title={loading === 'google' ? 'Signing in...' : 'Continue with Google'}
          onPress={() => handleOAuth('google')}
          disabled={authDisabled}
          accessibilityLabel="Continue with Google"
        />
        {Platform.OS === 'ios' ? (
          <Button
            title={loading === 'apple' ? 'Signing in...' : 'Continue with Apple'}
            variant="secondary"
            onPress={() => handleOAuth('apple')}
            disabled={authDisabled}
            accessibilityLabel="Continue with Apple"
            style={styles.gap}
          />
        ) : null}
        <Button
          title="Continue with phone"
          variant="secondary"
          onPress={() => router.push('/(auth)/phone')}
          disabled={authDisabled}
          accessibilityLabel="Continue with phone number"
          style={styles.gap}
        />
      </View>

      <Text style={styles.footer}>
        By continuing you agree to check out when you leave.
      </Text>
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
          {privacyPolicyUrl && termsUrl ? (
            <Text style={styles.legalSep}> · </Text>
          ) : null}
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
  hero: { flex: 1, justifyContent: 'center' },
  brand: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  actions: { marginBottom: spacing.xl },
  gap: { marginTop: spacing.md },
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
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  legalSep: { color: colors.textMuted, fontSize: 12 },
});
