import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { TAB_BAR_BODY_HEIGHT } from '@/constants/tabBar';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabKey = 'home' | 'activity' | 'map' | 'checkins' | 'profile';

const TAB_ORDER: TabKey[] = ['home', 'activity', 'map', 'checkins', 'profile'];

const TAB_LABELS: Record<Exclude<TabKey, 'map'>, string> = {
  home: 'Home',
  activity: 'Alerts',
  checkins: 'Check-ins',
  profile: 'Profile',
};

type TabIconDef = { default: AppIconName; focused: AppIconName };

const TAB_ICONS: Record<Exclude<TabKey, 'map'>, TabIconDef> = {
  home: { default: 'home', focused: 'homeFilled' },
  activity: { default: 'bell', focused: 'bellFilled' },
  checkins: { default: 'checkins', focused: 'checkinsFilled' },
  profile: { default: 'profile', focused: 'profileFilled' },
};

export function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const tabBarColor = colors.tabBar;
  const activeRouteName = state.routes[state.index]?.name;
  const isMapTab = activeRouteName === 'map';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          backgroundColor: isMapTab ? 'transparent' : colors.background,
        },
        wrap: {
          backgroundColor: tabBarColor,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingTop: spacing.md,
          overflow: 'visible',
          ...Platform.select({
            ios: { borderCurve: 'continuous' as const },
            default: {},
          }),
        },
        bevelEdge: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: colors.accentDark,
          opacity: 0.22,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          ...Platform.select({
            ios: { borderCurve: 'continuous' as const },
            default: {},
          }),
        },
        bar: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          paddingHorizontal: spacing.xs,
          minHeight: 52,
          overflow: 'visible',
        },
        tab: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 3,
          paddingBottom: 4,
          minWidth: 0,
        },
        mapSlot: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end',
          overflow: 'visible',
        },
        mapFabOuter: {
          marginTop: -34,
          marginBottom: 2,
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: tabBarColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        mapFab: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.coral,
          alignItems: 'center',
          justifyContent: 'center',
        },
        mapFabFocused: {
          backgroundColor: colors.coralDark,
        },
        label: {
          fontSize: 9,
          fontWeight: '700',
          color: colors.tabBarInactive,
          letterSpacing: 0.1,
          maxWidth: '100%',
          textAlign: 'center',
        },
        labelFocused: {
          color: colors.onPurple,
        },
      }),
    [tabBarColor, colors, isMapTab],
  );

  const bottomPad = Math.max(insets.bottom, spacing.sm);

  return (
    <View style={[styles.outer, { paddingBottom: bottomPad, minHeight: TAB_BAR_BODY_HEIGHT + bottomPad }]}>
      <View style={[styles.wrap, { paddingBottom: 0 }]}>
        <View style={styles.bevelEdge} pointerEvents="none" />
        <View style={styles.bar}>
        {TAB_ORDER.map((tabKey) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tabKey);
          if (routeIndex < 0) return null;

          const route = state.routes[routeIndex];
          const focused = state.index === routeIndex;
          const isMap = tabKey === 'map';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isMap) {
            return (
              <Pressable
                key={tabKey}
                onPress={onPress}
                style={styles.mapSlot}
                accessibilityRole="button"
                accessibilityLabel="Map"
                accessibilityState={{ selected: focused }}
              >
                <View style={styles.mapFabOuter}>
                  <View style={[styles.mapFab, focused && styles.mapFabFocused]}>
                    <AppIcon name="mapPin" size={30} color={colors.onPurple} />
                  </View>
                </View>
              </Pressable>
            );
          }

          const label = TAB_LABELS[tabKey as Exclude<TabKey, 'map'>];
          const icons = TAB_ICONS[tabKey as Exclude<TabKey, 'map'>];

          return (
            <Pressable
              key={tabKey}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              <AppIcon
                name={focused ? icons.focused : icons.default}
                size={22}
                color={focused ? colors.iconOnPurpleActive : colors.iconOnPurple}
              />
              <Text
                style={[styles.label, focused && styles.labelFocused]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
        </View>
      </View>
    </View>
  );
}
