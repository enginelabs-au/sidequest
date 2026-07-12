import { onPathChange, resetNavHistory } from '@/lib/navHistory';
import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

export function useNavHistoryTracker() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      resetNavHistory(pathname);
      initialized.current = true;
      return;
    }
    onPathChange(pathname);
  }, [pathname]);
}
