import { Button, Card } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { DELETE_ACCOUNT_CONFIRM_PHRASE } from '@/lib/deleteAccount';
import { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';

type Step = 'warning' | 'confirm';

type Props = {
  visible: boolean;
  deleting?: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
};

export function DeleteAccountModal({
  visible,
  deleting,
  onClose,
  onConfirmDelete,
}: Props) {
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('warning');
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    if (!visible) {
      setStep('warning');
      setPhrase('');
    }
  }, [visible]);

  const phraseOk =
    phrase.trim().toLowerCase() === DELETE_ACCOUNT_CONFIRM_PHRASE.toLowerCase();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          padding: spacing.lg,
        },
        card: { gap: spacing.md },
        title: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '800',
        },
        body: {
          color: colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
        },
        warning: {
          color: colors.dangerDark,
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '600',
        },
        phraseLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '700',
        },
        phraseBox: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
          backgroundColor: colors.borderLight,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.sm,
          overflow: 'hidden',
        },
        input: {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          color: colors.text,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          fontSize: 16,
        },
        actions: { gap: spacing.sm, marginTop: spacing.xs },
      }),
    [colors],
  );

  const handleClose = () => {
    if (deleting) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <Card style={styles.card} padded>
          {step === 'warning' ? (
            <>
              <Text style={styles.title}>Delete your account?</Text>
              <Text style={styles.body}>
                Are you sure you wish to delete your account? This permanently removes your
                profile, check-ins, messages, and connections. This cannot be undone.
              </Text>
              <View style={styles.actions}>
                <Button
                  title="Delete Account"
                  variant="danger"
                  onPress={() => setStep('confirm')}
                  disabled={!!deleting}
                  accessibilityLabel="Continue to account deletion confirmation"
                />
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={handleClose}
                  disabled={!!deleting}
                  accessibilityLabel="Cancel account deletion"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Confirm deletion</Text>
              <Text style={styles.warning}>
                Your account and all associated data will be permanently deleted with no chance
                of recovery.
              </Text>
              <Text style={styles.phraseLabel}>
                Type this exactly to confirm:
              </Text>
              <Text style={styles.phraseBox}>{DELETE_ACCOUNT_CONFIRM_PHRASE}</Text>
              <TextInput
                style={styles.input}
                value={phrase}
                onChangeText={setPhrase}
                placeholder="Type here"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!deleting}
                accessibilityLabel="Type delete account to confirm"
              />
              <View style={styles.actions}>
                <Button
                  title={deleting ? 'Deleting…' : 'DELETE'}
                  variant="danger"
                  onPress={onConfirmDelete}
                  disabled={!phraseOk || !!deleting}
                  accessibilityLabel="Permanently delete account"
                />
                <Button
                  title="CANCEL"
                  variant="ghost"
                  onPress={handleClose}
                  disabled={!!deleting}
                  accessibilityLabel="Cancel account deletion"
                />
              </View>
            </>
          )}
        </Card>
      </View>
    </Modal>
  );
}
