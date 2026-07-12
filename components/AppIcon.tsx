import { colors } from '@/constants/theme';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export type AppIconName =
  | 'home'
  | 'homeFilled'
  | 'mapPin'
  | 'checkins'
  | 'checkinsFilled'
  | 'profileFilled'
  | 'bellFilled'
  | 'back'
  | 'menu'
  | 'settings'
  | 'edit'
  | 'profile'
  | 'wave'
  | 'waveOff'
  | 'message'
  | 'map'
  | 'inbox'
  | 'activity'
  | 'discovery'
  | 'connections'
  | 'recenter'
  | 'location'
  | 'fire'
  | 'reply'
  | 'request'
  | 'lock'
  | 'bell'
  | 'tag'
  | 'bookmark';

type IconDef = {
  ios: string;
  android: string;
  fallback: string;
};

const ICONS: Record<AppIconName, IconDef> = {
  back: { ios: 'chevron.left', android: 'chevron_left', fallback: '‹' },
  home: { ios: 'house', android: 'home', fallback: '⌂' },
  homeFilled: { ios: 'house.fill', android: 'home', fallback: '⌂' },
  mapPin: { ios: 'mappin', android: 'location_on', fallback: '•' },
  checkins: { ios: 'building.2', android: 'apartment', fallback: '▣' },
  checkinsFilled: { ios: 'building.2.fill', android: 'apartment', fallback: '▣' },
  profileFilled: { ios: 'person.fill', android: 'person', fallback: '●' },
  bellFilled: { ios: 'bell.fill', android: 'notifications', fallback: '◌' },
  menu: { ios: 'line.3.horizontal', android: 'menu', fallback: '≡' },
  settings: { ios: 'gearshape', android: 'settings', fallback: '⚙' },
  edit: { ios: 'square.and.pencil', android: 'edit', fallback: '✎' },
  profile: { ios: 'person', android: 'person', fallback: '○' },
  wave: { ios: 'hand.wave', android: 'waving_hand', fallback: '⌇' },
  waveOff: { ios: 'hand.wave.slash', android: 'front_hand', fallback: '⌇̸' },
  message: { ios: 'bubble.left', android: 'chat', fallback: '◻' },
  map: { ios: 'map', android: 'map', fallback: '◎' },
  inbox: { ios: 'tray.fill', android: 'inbox', fallback: '▭' },
  activity: { ios: 'bell', android: 'notifications', fallback: '◌' },
  discovery: { ios: 'sparkles', android: 'auto_awesome', fallback: '✦' },
  connections: { ios: 'person.2', android: 'group', fallback: '∥' },
  recenter: { ios: 'location.circle', android: 'my_location', fallback: '◎' },
  location: { ios: 'mappin', android: 'location_on', fallback: '•' },
  fire: { ios: 'flame', android: 'whatshot', fallback: '△' },
  reply: { ios: 'arrowshape.turn.up.left', android: 'reply', fallback: '↩' },
  request: { ios: 'person.badge.plus', android: 'person_add', fallback: '+' },
  lock: { ios: 'lock', android: 'lock', fallback: '◆' },
  bell: { ios: 'bell', android: 'notifications', fallback: '◌' },
  tag: { ios: 'tag', android: 'sell', fallback: '⌁' },
  bookmark: { ios: 'bookmark', android: 'bookmark', fallback: '⊡' },
};

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

function MinimalFallback({ glyph, size, color }: { glyph: string; size: number; color: string }) {
  return (
    <Text style={[styles.fallback, { fontSize: size * 0.82, color, lineHeight: size }]}>{glyph}</Text>
  );
}

/** Single-color minimal icon — SF Symbols on iOS, Material Symbols on Android. */
export function AppIcon({ name, size = 20, color = colors.iconMuted, style }: Props) {
  const def = ICONS[name];

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <SymbolView
        name={{ ios: def.ios, android: def.android, web: def.android } as SymbolViewProps['name']}
        size={size}
        tintColor={color}
        weight={Platform.OS === 'ios' ? 'regular' : undefined}
        fallback={<MinimalFallback glyph={def.fallback} size={size} color={color} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  fallback: { fontWeight: '300', textAlign: 'center' },
});
