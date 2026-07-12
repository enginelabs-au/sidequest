import { SELECTED_MODE_KEY } from '@/constants/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { IntentMode } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect } from 'react';

/** Syncs check-in / saved Open To mode into ThemeContext so accent colours follow the active mode. */
export function ModeThemeBridge() {
  const { checkIn } = useAuth();
  const { setActiveMode } = useTheme();

  const syncMode = useCallback(async () => {
    if (checkIn?.mode) {
      setActiveMode(checkIn.mode);
      return;
    }
    const stored = await AsyncStorage.getItem(SELECTED_MODE_KEY);
    const mode: IntentMode =
      stored === 'networking' || stored === 'dating' ? stored : 'friends';
    setActiveMode(mode);
  }, [checkIn?.mode, setActiveMode]);

  useEffect(() => {
    syncMode();
  }, [syncMode]);

  return null;
}
