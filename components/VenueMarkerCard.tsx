import { AppIcon } from '@/components/AppIcon';
import { Card } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { Venue } from '@/types/database';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  venue: Venue;
  count: number;
  googleActivityLabel?: string;
  googleActivityColor?: string;
  selected?: boolean;
  checkInEligible?: boolean;
  onPress: () => void;
};

export function VenueMarkerCard({
  venue,
  count,
  googleActivityLabel,
  googleActivityColor: activityColor,
  selected,
  checkInEligible,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: 132,
          marginBottom: 0,
          marginRight: spacing.sm,
          borderWidth: 2,
          borderColor: 'transparent',
        },
        selected: {
          borderColor: colors.purple,
          backgroundColor: colors.purpleMuted,
        },
        checkInEligible: {
          borderColor: colors.coral,
          backgroundColor: colors.card,
        },
        checkInBadge: {
          alignSelf: 'flex-start',
          backgroundColor: colors.coral,
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 2,
          marginBottom: spacing.xs,
        },
        checkInBadgeText: {
          color: colors.onPurple,
          fontSize: 9,
          fontWeight: '900',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        name: {
          color: colors.text,
          fontSize: 12,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        },
        count: { color: colors.purple, fontSize: 11, fontWeight: '700', marginTop: spacing.xs },
        countEligible: { color: colors.coral },
        google: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2 },
      }),
    [colors],
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${count} checked in${checkInEligible ? ', check in available' : ''}`}
    >
      <Card style={[styles.card, checkInEligible && styles.checkInEligible, selected && styles.selected]} padded>
        {checkInEligible ? (
          <View style={styles.checkInBadge}>
            <Text style={styles.checkInBadgeText}>Check in</Text>
          </View>
        ) : (
          <AppIcon name={count >= 10 ? 'fire' : 'connections'} size={16} color={colors.iconMuted} />
        )}
        <Text style={styles.name} numberOfLines={1}>
          {venue.name}
        </Text>
        <Text style={[styles.count, checkInEligible && styles.countEligible]}>{count} checked-in</Text>
        {googleActivityLabel ? (
          <Text style={[styles.google, activityColor ? { color: activityColor } : null]} numberOfLines={1}>
            Google · {googleActivityLabel}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}
