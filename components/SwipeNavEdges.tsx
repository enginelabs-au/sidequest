import { canGoForward, consumeForward, recordBackFrom } from '@/lib/navHistory';
import { usePathname, useRouter } from 'expo-router';
import { useRef } from 'react';
import { Dimensions, PanResponder, View } from 'react-native';

const SWIPE_RATIO = 0.35;

export function SwipeNavEdges() {
  const router = useRouter();
  const pathname = usePathname();
  const width = Dimensions.get('window').width;
  const threshold = width * SWIPE_RATIO;

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        const horizontal = Math.abs(g.dx) > Math.abs(g.dy) * 1.4;
        if (!horizontal || Math.abs(g.dx) < 14) return false;

        // Full-screen forward swipe (right → left) when history allows it.
        if (g.dx < 0 && canGoForward()) return true;

        // Back swipe (left → right): supplement native gesture from the left edge.
        const fromLeft = g.moveX < 56 && g.dx > 14;
        return fromLeft && router.canGoBack();
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx >= threshold && router.canGoBack()) {
          recordBackFrom(pathnameRef.current);
          router.back();
          return;
        }
        if (g.dx <= -threshold && canGoForward()) {
          const next = consumeForward();
          if (next) router.push(next as never);
        }
      },
    }),
  ).current;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 1,
      }}
      pointerEvents="box-none"
      {...panResponder.panHandlers}
    />
  );
}
