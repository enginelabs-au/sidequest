import { useAuth } from '@/contexts/AuthContext';
import { useCheckInGate } from '@/hooks/useCheckInGate';
import { formatUserError } from '@/lib/errors';
import { sendWave, unwaveUser } from '@/lib/waves';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

type WaveTarget = {
  user_id: string;
  display_name: string;
};

export function useWaveAction() {
  const router = useRouter();
  const { user } = useAuth();
  const { ensureCheckedIn } = useCheckInGate();
  const [waveAnimVisible, setWaveAnimVisible] = useState(false);
  const [wavedIds, setWavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const markWavedLocal = useCallback((userId: string) => {
    setWavedIds((prev) => new Set(prev).add(userId));
  }, []);

  const markUnwavedLocal = useCallback((userId: string) => {
    setWavedIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const waveAt = useCallback(
    async (target: WaveTarget, opts?: { goToInbox?: boolean; onAdvanced?: () => void }) => {
      if (!user) return;
      if (!ensureCheckedIn()) return;
      setLoading(true);
      try {
        const fromName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          'You';
        await sendWave({
          fromUserId: user.id,
          fromDisplayName: fromName,
          toUserId: target.user_id,
          toDisplayName: target.display_name,
        });
        markWavedLocal(target.user_id);
        setWaveAnimVisible(true);
        opts?.onAdvanced?.();
        if (opts?.goToInbox !== false) {
          setTimeout(() => {
            router.push('/main/tabs/inbox');
          }, 700);
        }
      } catch (e) {
        Alert.alert('Could not wave', formatUserError(e, 'Try again in a moment.'));
      } finally {
        setLoading(false);
      }
    },
    [user, ensureCheckedIn, markWavedLocal, router],
  );

  const unwaveAt = useCallback(
    async (target: WaveTarget) => {
      if (!user) return;
      setLoading(true);
      try {
        await unwaveUser(target.user_id);
        markUnwavedLocal(target.user_id);
      } catch (e) {
        Alert.alert('Could not un-wave', formatUserError(e, 'Try again in a moment.'));
      } finally {
        setLoading(false);
      }
    },
    [user, markUnwavedLocal],
  );

  const onWaveAnimComplete = useCallback(() => setWaveAnimVisible(false), []);

  return {
    waveAt,
    unwaveAt,
    waveAnimVisible,
    onWaveAnimComplete,
    wavedIds,
    setWavedIds,
    loading,
  };
}
