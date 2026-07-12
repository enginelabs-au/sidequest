import { Stack } from 'expo-router';

export default function VenueLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Social Radar' }} />
      <Stack.Screen name="[venueId]" options={{ title: 'Venue' }} />
    </Stack>
  );
}
