import { TAB_BAR_BODY_HEIGHT } from '@/constants/tabBar';
import { spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bottom padding so scroll content clears the floating tab bar. */
export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BODY_HEIGHT + Math.max(insets.bottom, spacing.sm);
}
