import { UserProfileScreen } from '@/components/UserProfileScreen';
import { useRouter } from 'expo-router';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  return <UserProfileScreen onBack={() => router.back()} />;
}
