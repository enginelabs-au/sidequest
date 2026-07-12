import { Card } from '@/components/ui';
import { isDevTestVenueCheckInEnabled } from '@/constants/devVenues';
import { colors, radius, spacing, VENUE_MAX_DISTANCE_KM } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  withinRange?: boolean;
  devTestVenue?: boolean;
  style?: object;
};

export function ProximityPill({ withinRange = true, devTestVenue = false, style }: Props) {
  const ivyTesting = devTestVenue && isDevTestVenueCheckInEnabled();

  return (
    <View style={[styles.wrap, style]}>
      <Card style={styles.pill} padded={false}>
        <Text style={styles.icon}>📍</Text>
        <View>
          <Text style={styles.label}>{ivyTesting ? 'The Ivy' : 'Proximity lock'}</Text>
          <Text style={styles.value}>
            {ivyTesting
              ? 'Check in anywhere'
              : withinRange
                ? `Within ${VENUE_MAX_DISTANCE_KM}km`
                : 'Out of range'}
          </Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: 0,
    borderRadius: radius.full,
  },
  icon: { fontSize: 16 },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
