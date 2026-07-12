import { APPEARANCE_KEY, SELECTED_MODE_KEY } from '@/constants/storage';
import {
    darkColors,
    lightColors,
    colors as mutableColors,
    type AppColors,
    type ColorScheme,
} from '@/constants/theme';
import { applyModePrimaryColors } from '@/lib/modeTheme';
import type { IntentMode } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

type ThemeContextValue = {
  scheme: ColorScheme;
  colors: AppColors;
  isDark: boolean;
  activeMode: IntentMode;
  setScheme: (scheme: ColorScheme) => Promise<void>;
  setActiveMode: (mode: IntentMode) => void;
  toggleScheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function baseForScheme(scheme: ColorScheme): AppColors {
  return scheme === 'dark' ? { ...darkColors } : { ...lightColors };
}

function syncMutableColors(scheme: ColorScheme, mode: IntentMode) {
  const merged = applyModePrimaryColors(baseForScheme(scheme), mode, scheme === 'dark');
  Object.assign(mutableColors, merged);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>('dark');
  const [activeMode, setActiveModeState] = useState<IntentMode>('friends');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      AsyncStorage.getItem(APPEARANCE_KEY),
      AsyncStorage.getItem(SELECTED_MODE_KEY),
    ]).then(([appearance, storedMode]) => {
      if (cancelled) return;
      const nextScheme: ColorScheme = appearance === 'light' ? 'light' : 'dark';
      const mode: IntentMode =
        storedMode === 'networking' || storedMode === 'dating' ? storedMode : 'friends';
      setSchemeState(nextScheme);
      setActiveModeState(mode);
      syncMutableColors(nextScheme, mode);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setActiveMode = useCallback(
    (mode: IntentMode) => {
      setActiveModeState(mode);
      syncMutableColors(scheme, mode);
    },
    [scheme],
  );

  const setScheme = useCallback(
    async (next: ColorScheme) => {
      setSchemeState(next);
      syncMutableColors(next, activeMode);
      await AsyncStorage.setItem(APPEARANCE_KEY, next);
    },
    [activeMode],
  );

  const toggleScheme = useCallback(async () => {
    await setScheme(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setScheme]);

  const colors = useMemo(
    () => applyModePrimaryColors(baseForScheme(scheme), activeMode, scheme === 'dark'),
    [scheme, activeMode],
  );

  const value = useMemo(
    () => ({
      scheme,
      colors,
      isDark: scheme === 'dark',
      activeMode,
      setScheme,
      setActiveMode,
      toggleScheme,
    }),
    [scheme, colors, activeMode, setScheme, setActiveMode, toggleScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      scheme: 'dark',
      colors: applyModePrimaryColors({ ...darkColors }, 'friends', true),
      isDark: true,
      activeMode: 'friends',
      setScheme: async () => {},
      setActiveMode: () => {},
      toggleScheme: async () => {},
    };
  }
  return ctx;
}

/** Root screen background style — use on tab/screen containers. */
export function useScreenBackgroundStyle() {
  const { colors } = useTheme();
  return useMemo(() => ({ flex: 1 as const, backgroundColor: colors.background }), [colors]);
}
