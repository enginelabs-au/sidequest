import { RoomFeedScreen } from '@/components/RoomFeedScreen';
import { useRouter } from 'expo-router';

/** Venue View Room — same discovery deck as Home tab. */
export default function VenueRoomScreen() {
  const router = useRouter();
  return <RoomFeedScreen title="Home" onBack={() => router.back()} />;
}
