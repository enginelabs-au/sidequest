import { MainTabBar } from '@/components/MainTabBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs } from 'expo-router';

export default function MainTabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.onPurple,
        tabBarInactiveTintColor: colors.tabBarInactive,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="activity" options={{ title: 'Alerts' }} />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Tabs.Screen name="checkins" options={{ title: 'Check-ins' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="inbox" options={{ href: null, title: 'Inbox' }} />
      <Tabs.Screen name="discovery" options={{ href: null }} />
      <Tabs.Screen name="connections" options={{ href: null }} />
    </Tabs>
  );
}
