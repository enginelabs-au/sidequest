import { NOTIFY_DELAY_SECONDS } from '@/constants/notify';

type TimerRecord = {
  id: string;
  deadline: number;
  durationSec: number;
  onComplete: () => void;
  intervalId: ReturnType<typeof setInterval>;
};

const timers = new Map<string, TimerRecord>();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function waveNotifyTimerId(peerUserId: string): string {
  return `wave:${peerUserId}`;
}

export function chatNotifyTimerId(connectionId: string): string {
  return `chat:${connectionId}`;
}

export function getNotifyTimerState(
  id: string,
  durationSec = NOTIFY_DELAY_SECONDS,
): { state: 'idle' | 'pending'; remaining: number } {
  const record = timers.get(id);
  if (!record) {
    return { state: 'idle', remaining: durationSec };
  }
  const remaining = Math.max(0, Math.ceil((record.deadline - Date.now()) / 1000));
  return { state: 'pending', remaining };
}

export function isNotifyTimerPending(id: string): boolean {
  return timers.has(id);
}

export function subscribeNotifyTimers(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function finishTimer(id: string): void {
  const record = timers.get(id);
  if (!record) return;
  clearInterval(record.intervalId);
  const onComplete = record.onComplete;
  timers.delete(id);
  emit();
  onComplete();
}

export function startNotifyTimer(
  id: string,
  durationSec: number,
  onComplete: () => void,
): void {
  cancelNotifyTimer(id);
  const deadline = Date.now() + durationSec * 1000;
  const intervalId = setInterval(() => {
    const record = timers.get(id);
    if (!record) return;
    if (Date.now() >= record.deadline) {
      finishTimer(id);
    } else {
      emit();
    }
  }, 250);

  timers.set(id, { id, deadline, durationSec, onComplete, intervalId });
  emit();
}

export function cancelNotifyTimer(id: string): void {
  const record = timers.get(id);
  if (!record) return;
  clearInterval(record.intervalId);
  timers.delete(id);
  emit();
}

export function sendNowNotifyTimer(id: string): void {
  if (!timers.has(id)) return;
  finishTimer(id);
}
