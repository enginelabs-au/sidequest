import { NOTIFY_DELAY_SECONDS } from '@/constants/notify';
import {
  cancelNotifyTimer,
  getNotifyTimerState,
  sendNowNotifyTimer,
  startNotifyTimer,
  subscribeNotifyTimers,
} from '@/lib/notifyTimerService';
import { useCallback, useEffect, useState } from 'react';

export type NotifyTimerState = 'idle' | 'pending';

export function formatNotifyRemaining(seconds: number): string {
  return `0:${Math.max(0, seconds).toString().padStart(2, '0')}`;
}

/** Subscribes to a background notify timer that survives screen unmount. */
export function useNotifyTimer(timerId: string, durationSec = NOTIFY_DELAY_SECONDS) {
  const [, tick] = useState(0);

  useEffect(() => subscribeNotifyTimers(() => tick((n) => n + 1)), []);

  const snapshot = getNotifyTimerState(timerId, durationSec);

  const start = useCallback(
    (onComplete: () => void) => {
      startNotifyTimer(timerId, durationSec, onComplete);
    },
    [timerId, durationSec],
  );

  const cancel = useCallback(() => {
    cancelNotifyTimer(timerId);
  }, [timerId]);

  const sendNow = useCallback(() => {
    sendNowNotifyTimer(timerId);
  }, [timerId]);

  return {
    state: snapshot.state,
    remaining: snapshot.remaining,
    start,
    cancel,
    sendNow,
    formatted: formatNotifyRemaining(snapshot.remaining),
  };
}
