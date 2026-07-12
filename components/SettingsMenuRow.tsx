import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { colors, spacing } from '@/constants/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  icon: AppIconName;
  label: string;
  onPress: () => void;
};

export function SettingsMenuRow({ icon, label, onPress }: Props) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AppIcon name={icon} size={20} color={colors.text} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
