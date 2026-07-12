import { KeyboardDismissView } from '@/components/KeyboardDismissView';
import { ModeThemeBridge } from '@/components/ModeThemeBridge';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useAuthDeepLink } from '@/hooks/useAuthDeepLink';
import { checkSupabaseHealth } from '@/lib/healthcheck';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutInner() {
  useAuthDeepLink();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    checkSupabaseHealth();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false, title: 'Sign in' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, title: 'Onboarding' }} />
        <Stack.Screen name="main" options={{ headerShown: false, title: 'Side Quest' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <KeyboardDismissView>
          <AuthProvider>
            <ModeThemeBridge />
            <RootLayoutInner />
          </AuthProvider>
        </KeyboardDismissView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
