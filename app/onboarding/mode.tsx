import { AppHeader } from '@/components/AppHeader';
import { ModeCard } from '@/components/ModeCard';
import { TooltipOverlay } from '@/components/TooltipOverlay';
import {
    Button,
    Card,
    ErrorBanner,
    Screen,
    ScreenSubtitle,
    ToggleRow,
} from '@/components/ui';
import { INVISIBLE_PREF_KEY, SELECTED_MODE_KEY, SELECTED_VENUE_KEY } from '@/constants/storage';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useTooltipFlag } from '@/hooks/useTooltipFlag';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { IntentMode } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const MODES: IntentMode[] = ['friends', 'networking', 'dating'];

export default function ModeScreen() {
  const router = useRouter();
  const { venueId: venueIdParam } = useLocalSearchParams<{ venueId?: string }>();
  const { visible: tooltipVisible, dismiss: dismissTooltip } = useTooltipFlag('mode');
  const { setActiveMode } = useTheme();
  const [mode, setMode] = useState<IntentMode>('friends');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(INVISIBLE_PREF_KEY).then((v) => {
      if (v !== null) setVisible(v !== 'true');
    });
    AsyncStorage.getItem(SELECTED_MODE_KEY).then((stored) => {
      if (stored && MODES.includes(stored as IntentMode)) {
        setMode(stored as IntentMode);
        setActiveMode(stored as IntentMode);
      }
    });
  }, [setActiveMode]);

  const persistVisible = async (value: boolean) => {
    setVisible(value);
    await AsyncStorage.setItem(INVISIBLE_PREF_KEY, value ? 'false' : 'true');
  };

  const persistMode = async (value: IntentMode) => {
    setMode(value);
    setActiveMode(value);
    await AsyncStorage.setItem(SELECTED_MODE_KEY, value);
  };

  const confirmCheckIn = async () => {
    const venueId =
      typeof venueIdParam === 'string' ? venueIdParam : await AsyncStorage.getItem(SELECTED_VENUE_KEY);
    if (!venueId) {
      router.replace('/onboarding/venue');
      return;
    }

    await AsyncStorage.setItem(SELECTED_MODE_KEY, mode);
    router.push({
      pathname: '/onboarding/check-in',
      params: { venueId, mode },
    });
  };

  const content = (
    <Screen scroll>
      <AppHeader title="Open To" onBack={() => router.back()} />
      <ScreenSubtitle>
        Choose your mode before checking in — you will only see others in the same mode.
      </ScreenSubtitle>

      {!isSupabaseConfigured ? (
        <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE5_CHECKIN.md." />
      ) : null}

      <View style={styles.modeList}>
        {MODES.map((m) => (
          <ModeCard
            key={m}
            mode={m}
            selected={mode === m}
            onPress={() => persistMode(m)}
            layout="vertical"
          />
        ))}
      </View>

      <Card>
        <ToggleRow
          label="Visible to others"
          sublabel="On by default — turn off to browse the map invisibly"
          value={visible}
          onValueChange={persistVisible}
        />
      </Card>

      <Button
        title="Confirm & check in"
        onPress={confirmCheckIn}
        accessibilityLabel="Confirm mode and check in"
        style={styles.confirmBtn}
      />
      {!visible ? (
        <ScreenSubtitle>
          You&apos;re browsing invisibly on the map — you can still check in; turn visibility on when you want
          others to see you.
        </ScreenSubtitle>
      ) : null}
    </Screen>
  );

  if (tooltipVisible) {
    return (
      <TooltipOverlay
        title="Pick your mode"
        message="Select friends, networking, or dating before checking in. You only discover people in the same mode. Visibility is on by default — turn it off to stay hidden on the map."
        onDismiss={dismissTooltip}
      >
        {content}
      </TooltipOverlay>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  modeList: { marginBottom: spacing.md },
  confirmBtn: { marginTop: spacing.md },
});
