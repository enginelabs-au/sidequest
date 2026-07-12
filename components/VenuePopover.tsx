import { Card } from '@/components/ui';
import { VibeMeter } from '@/components/VibeMeter';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import type { Venue } from '@/types/database';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  venue: Venue;
  count: number;
};

export function VenuePopover({ venue, count }: Props) {
  return (
    <Card style={styles.popover} padded>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🧭</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{venue.name}</Text>
          <VibeMeter count={count} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  popover: {
    marginBottom: 0,
    ...shadows.soft,
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  copy: { flex: 1 },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
