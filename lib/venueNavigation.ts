import type { IntentMode } from '@/types/database';

type VenueNavParams = {
  venueId: string;
  count?: string;
  totalCount?: string;
  sameModeOnly?: string;
  mode?: IntentMode;
};

type VenueDetailPath =
  | '/main/venue/[venueId]'
  | '/onboarding/venue/[venueId]';

type VenueRoomPath =
  | '/main/tabs/home'
  | '/onboarding/venue/[venueId]/room';

export function venueDetailRoute(
  params: VenueNavParams,
  checkedIn: boolean,
): { pathname: VenueDetailPath; params: VenueNavParams } {
  return {
    pathname: checkedIn ? '/main/venue/[venueId]' : '/onboarding/venue/[venueId]',
    params,
  };
}

/** Same discovery deck as Home — main tab when checked in; onboarding preview before check-in. */
export function venueRoomRoute(
  checkedIn: boolean,
  params?: { venueId: string; mode?: IntentMode },
): VenueRoomPath | { pathname: VenueRoomPath; params: { venueId: string; mode?: IntentMode } } {
  if (checkedIn) return '/main/tabs/home';
  if (!params?.venueId) return '/onboarding/venue/[venueId]/room';
  return {
    pathname: '/onboarding/venue/[venueId]/room',
    params: { venueId: params.venueId, mode: params.mode },
  };
}

export function mapHomeRoute(_checkedIn?: boolean): '/main/tabs/map' {
  return '/main/tabs/map';
}

export function appHomeRoute(checkedIn: boolean): '/main/tabs/home' | '/main/tabs/map' {
  return checkedIn ? '/main/tabs/home' : '/main/tabs/map';
}
