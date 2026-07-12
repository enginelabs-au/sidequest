import { AppHeader } from '@/components/AppHeader';
import { Button, Card, ErrorBanner, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { REPORT_REASONS, submitSafetyReport, type ReportReasonId } from '@/lib/safety';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { devBypassActive } = useAuth();
  const params = useLocalSearchParams<{
    reportedId?: string;
    reportedLabel?: string;
    connectionId?: string;
  }>();

  const reportedId = typeof params.reportedId === 'string' ? params.reportedId : '';
  const reportedLabel =
    typeof params.reportedLabel === 'string' ? params.reportedLabel : 'this user';
  const connectionId =
    typeof params.connectionId === 'string' && params.connectionId ? params.connectionId : null;

  const [reason, setReason] = useState<ReportReasonId | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason || !reportedId) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isSupabaseConfigured && !devBypassActive) {
        await submitSafetyReport({
          reportedId,
          connectionId,
          reason,
          details: details.trim() || undefined,
        });
      }
      Alert.alert('Reported', 'Thank you. Our moderation pipeline will review this.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerPad}>
        <AppHeader title="Report" onBack={() => router.back()} variant="primary" />
      </View>
      <Screen safeTop={false}>
        <Card>
          <Text style={styles.title}>Report user</Text>
          <Text style={styles.subtitle}>Reporting {reportedLabel}</Text>

          <Text style={styles.label}>Reason</Text>
          <View style={styles.reasons}>
            {REPORT_REASONS.map((r) => (
              <Pressable
                key={r.id}
                style={[styles.reasonChip, reason === r.id && styles.reasonChipActive]}
                onPress={() => setReason(r.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: reason === r.id }}
                accessibilityLabel={`Report reason ${r.label}`}
              >
                <Text style={[styles.reasonText, reason === r.id && styles.reasonTextActive]}>
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>
            {reason === 'other' ? 'Details (recommended)' : 'Details (optional)'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="What happened?"
            placeholderTextColor={colors.textMuted}
            value={details}
            onChangeText={setDetails}
            multiline
            editable={!submitting}
            accessibilityLabel="Report details"
          />

          {error ? <ErrorBanner message={error} /> : null}

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => router.back()}
              disabled={submitting}
            />
            <Button
              title={submitting ? 'Submitting…' : 'Submit report'}
              onPress={handleSubmit}
              disabled={!reason || submitting || !reportedId}
            />
          </View>
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerPad: { paddingHorizontal: spacing.md },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  reasonChip: {
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  reasonChipActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  reasonText: { color: colors.textMuted, fontSize: 14 },
  reasonTextActive: { color: colors.text, fontWeight: '600' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    marginBottom: spacing.md,
  },
  actions: { gap: spacing.sm },
});
