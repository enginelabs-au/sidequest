import { Stack } from 'expo-router';

export default function VenueDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Venue profile' }} />
      <Stack.Screen name="room" options={{ title: 'Venue room' }} />
    </Stack>
  );
}
