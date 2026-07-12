import { SwipeNavEdges } from '@/components/SwipeNavEdges';
import { LoadingState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNavHistoryTracker } from '@/hooks/useNavHistoryTracker';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

function OnboardingStack() {
  useNavHistoryTracker();

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="venue" options={{ title: 'Social Radar', headerShown: false }} />
        <Stack.Screen name="mode" options={{ title: 'Open To', headerShown: false }} />
        <Stack.Screen name="check-in" options={{ title: 'My Quest Profile', headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'My profile', headerShown: false }} />
        <Stack.Screen name="peer/[userId]" options={{ title: 'Profile', headerShown: false }} />
      </Stack>
      <SwipeNavEdges />
    </View>
  );
}

export default function OnboardingLayout() {
  const { session, checkIn, loading, devBypassActive } = useAuth();

  if (loading) return <LoadingState />;
  if (!session && !devBypassActive) return <Redirect href="/auth" />;
  if (checkIn) return <Redirect href="/main/tabs/home" />;

  return <OnboardingStack />;
}
