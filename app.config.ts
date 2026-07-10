import { ConfigContext, ExpoConfig } from 'expo/config';

/** iOS bundle ID + Android applicationId (register in Apple Developer / Google Play). */
const APP_ID = 'au.enginelabs.sidequest';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Side Quest',
  slug: 'sidequest',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: process.env.EXPO_PUBLIC_APP_SCHEME ?? 'sidequest',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: false,
    bundleIdentifier: APP_ID,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Side Quest uses your location to verify you are within 1km of a venue before check-in.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Side Quest uses your location to auto check you out when you leave the venue area.',
    },
  },
  android: {
    package: APP_ID,
    adaptiveIcon: {
      backgroundColor: '#0f0f14',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Side Quest uses your location to auto check you out when you leave the venue.',
        locationWhenInUsePermission:
          'Side Quest uses your location to verify venue proximity.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0f0f14',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    appScheme: process.env.EXPO_PUBLIC_APP_SCHEME ?? 'sidequest',
    privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL,
    termsUrl: process.env.EXPO_PUBLIC_TERMS_URL,
  },
});
