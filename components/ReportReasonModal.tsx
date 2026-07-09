import { Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { REPORT_REASONS, type ReportReasonId } from '@/lib/safety';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  reportedLabel?: string;
  onClose: () => void;
  onSubmit: (reason: ReportReasonId, details?: string) => Promise<void>;
};

export function ReportReasonModal({ visible, reportedLabel, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState<ReportReasonId | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setDetails('');
      setSubmitting(false);
      setError(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(reason, details.trim() || undefined);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Report user</Text>
          {reportedLabel ? (
            <Text style={styles.subtitle}>Reporting {reportedLabel}</Text>
          ) : null}
          <Text style={styles.label}>Reason</Text>
          <View style={styles.reasons}>
            {REPORT_REASONS.map((r) => (
              <Pressable
                key={r.id}
                style={[styles.reasonChip, reason === r.id && styles.reasonChipActive]}
                onPress={() => setReason(r.id)}
                accessibilityRole="button"
                accessibilityLabel={`Report reason ${r.label}`}
                accessibilityState={{ selected: reason === r.id }}
              >
                <Text
                  style={[styles.reasonText, reason === r.id && styles.reasonTextActive]}
                >
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
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={onClose}
              disabled={submitting}
              accessibilityLabel="Cancel report"
            />
            <Button
              title={submitting ? 'Submitting...' : 'Submit report'}
              onPress={handleSubmit}
              disabled={!reason || submitting}
              accessibilityLabel="Submit report"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonChipActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  reasonText: { color: colors.textMuted, fontSize: 14 },
  reasonTextActive: { color: colors.text, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  actions: { gap: spacing.sm },
});
