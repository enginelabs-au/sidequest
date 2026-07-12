import { AppIcon } from '@/components/AppIcon';
import { ModePhotoTag } from '@/components/ModePhotoTag';
import { WavePhotoTag } from '@/components/WavePhotoTag';
import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { IntentMode } from '@/types/database';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  userId: string;
  displayName: string;
  mode: IntentMode;
  checkedIn?: boolean;
  waved?: boolean;
  onPress: () => void;
  onWave?: () => void;
  onMessage?: () => void;
  onProfile?: () => void;
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function RoomPeerCard({
  displayName,
  mode,
  checkedIn = true,
  waved,
  onPress,
  onWave,
  onMessage,
  onProfile,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          overflow: 'hidden',
          margin: spacing.xs,
          ...shadows.card,
        },
        photo: {
          height: 120,
          backgroundColor: colors.purpleMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        photoInitials: {
          fontSize: 36,
          fontWeight: '800',
          color: colors.purpleDark,
        },
        body: { padding: spacing.sm, gap: spacing.xs },
        name: { color: colors.text, fontSize: 15, fontWeight: '800' },
        status: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
        actions: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: spacing.xs,
          gap: spacing.xs,
        },
        actionBtn: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: spacing.xs,
          borderRadius: radius.sm,
        },
        actionBtnPrimary: {
          backgroundColor: colors.purple,
          borderRadius: radius.sm,
        },
        actionLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
        actionLabelPrimary: { fontSize: 9, fontWeight: '700', color: colors.onPurple, marginTop: 2 },
      }),
    [colors],
  );

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, ${mode} mode`}
    >
      <View style={styles.photo}>
        <Text style={styles.photoInitials}>{initials(displayName)}</Text>
        {checkedIn ? <ModePhotoTag mode={mode} size="medium" /> : null}
        {waved ? <WavePhotoTag size="medium" /> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.status}>{checkedIn ? 'Checked in' : mode}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={onWave} hitSlop={6}>
            <AppIcon name="wave" size={16} color={colors.iconMuted} />
            <Text style={styles.actionLabel}>Wave</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onMessage} hitSlop={6}>
            <AppIcon name="message" size={16} color={colors.onPurple} />
            <Text style={styles.actionLabelPrimary}>Message</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={onProfile} hitSlop={6}>
            <AppIcon name="profile" size={16} color={colors.iconMuted} />
            <Text style={styles.actionLabel}>Profile</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
