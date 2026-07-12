import { Card } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  message: string;
  onDismiss: () => void;
  children?: ReactNode;
};

export function TooltipOverlay({ title, message, onDismiss, children }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { flex: 1 },
        backdrop: {
          ...StyleSheet.absoluteFill,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          padding: spacing.lg,
        },
        card: { marginBottom: 0 },
        title: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
          marginBottom: spacing.sm,
        },
        message: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: spacing.lg,
        },
        button: {
          backgroundColor: colors.accent,
          borderRadius: 16,
          paddingVertical: spacing.md,
          alignItems: 'center',
        },
        buttonText: {
          color: colors.accentOnButton,
          fontWeight: '700',
          fontSize: 16,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      {children}
      <View style={styles.backdrop} accessibilityViewIsModal>
        <Card style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable
            style={styles.button}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss tooltip"
          >
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </Card>
      </View>
    </View>
  );
}
