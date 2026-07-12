import { AppIcon } from '@/components/AppIcon';
import { AppTextInput, Card } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function RoomMessageBar({
  value,
  onChangeText,
  onSend,
  disabled,
  placeholder = 'Say something...',
}: Props) {
  const { colors } = useTheme();
  const canSend = !disabled && value.trim().length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: { marginBottom: 0 },
        row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
        leadingIcon: { marginBottom: spacing.sm },
        input: {
          flex: 1,
          marginBottom: 0,
          borderRadius: radius.full,
          paddingVertical: spacing.sm + 2,
        },
        sendBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        sendDisabled: { opacity: 0.45 },
        sendIcon: { color: colors.accentOnButton, fontSize: 18, fontWeight: '800' },
      }),
    [colors],
  );

  return (
    <Card style={styles.bar} padded>
      <View style={styles.row}>
        <AppIcon name="message" size={18} color={colors.iconMuted} style={styles.leadingIcon} />
        <AppTextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          editable={!disabled}
          accessibilityLabel="Message input"
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          style={[styles.sendBtn, !canSend && styles.sendDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>
    </Card>
  );
}
