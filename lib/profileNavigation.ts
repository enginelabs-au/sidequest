import { routes } from '@/lib/routes';

type ProfileRouter = {
  push: (href: {
    pathname: '/main/peer/[userId]' | '/onboarding/peer/[userId]';
    params: { userId: string };
  }) => void;
};

export function publicProfilePath(
  checkedIn: boolean,
): '/main/peer/[userId]' | '/onboarding/peer/[userId]' {
  return checkedIn ? routes.mainPeer : routes.onboardingPeer;
}

export function navigateToPublicProfile(
  router: ProfileRouter,
  userId: string,
  opts?: { checkedIn?: boolean },
): void {
  const checkedIn = opts?.checkedIn ?? true;
  router.push({
    pathname: publicProfilePath(checkedIn),
    params: { userId },
  });
}
