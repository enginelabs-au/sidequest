import { supabase } from '@/lib/supabase';
import {
    GoogleSignin,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import type { Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};
const googleWebClientId = (extra.googleWebClientId as string | undefined)?.trim();
const googleIosClientId = (extra.googleIosClientId as string | undefined)?.trim();
const googleAndroidClientId = (extra.googleAndroidClientId as string | undefined)?.trim();

let googleConfigured = false;

/** Call once at app start (or before first Google sign-in). */
export function configureNativeAuth(): void {
  if (!googleWebClientId || googleConfigured) return;
  GoogleSignin.configure({
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId || undefined,
    offlineAccess: false,
  });
  googleConfigured = true;
}

export function isGoogleNativeAuthConfigured(): boolean {
  return !!googleWebClientId;
}

export function isGoogleIosClientConfigured(): boolean {
  return !!googleIosClientId;
}

export function isGoogleAndroidClientConfigured(): boolean {
  return !!googleAndroidClientId;
}

/** Human-readable prerequisite errors before opening native sign-in UI. */
export function getGoogleSignInPrerequisiteError(): string | null {
  if (!googleWebClientId) {
    return 'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env (Google Web OAuth client).';
  }
  if (Platform.OS === 'ios' && !googleIosClientId) {
    return 'Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID to .env, then run: npx expo prebuild --clean --platform ios && npx expo run:ios';
  }
  if (Platform.OS === 'android' && !googleAndroidClientId) {
    return 'Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID to .env and register the Android OAuth client in Google Cloud (package + SHA-1).';
  }
  return null;
}

export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ''));
}

export function normalizePhone(phone: string): string {
  const trimmed = phone.replace(/\s/g, '');
  if (!trimmed) return '+';
  if (trimmed.startsWith('+')) return trimmed;
  // Australian local mobile: 04xxxxxxxx → +614xxxxxxxx
  if (/^0\d{9}$/.test(trimmed)) {
    return `+61${trimmed.slice(1)}`;
  }
  return `+${trimmed.replace(/^\+/, '')}`;
}

export async function signInWithGoogleNative(): Promise<Session | null> {
  const prereq = getGoogleSignInPrerequisiteError();
  if (prereq) throw new Error(prereq);

  configureNativeAuth();

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('Google did not return an ID token. Check your Web client ID in Supabase and .env.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw mapNativeAuthError('google', error);
    return data.session;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google sign-in is already in progress.');
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is unavailable. Update Play Services and try again.');
      }
    }
    throw error;
  }
}

export async function signInWithAppleNative(): Promise<Session | null> {
  if (Platform.OS !== 'ios') {
    throw new Error('Sign in with Apple is only available on iOS.');
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('Sign in with Apple is not available on this device.');
  }

  try {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) throw mapNativeAuthError('apple', error);

    if (credential.fullName) {
      const parts = [
        credential.fullName.givenName,
        credential.fullName.middleName,
        credential.fullName.familyName,
      ].filter((p): p is string => !!p);
      const fullName = parts.join(' ');
      if (fullName) {
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            given_name: credential.fullName.givenName ?? undefined,
            family_name: credential.fullName.familyName ?? undefined,
          },
        });
      }
    }

    return data.session;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'ERR_REQUEST_CANCELED'
    ) {
      return null;
    }
    throw error;
  }
}

function mapNativeAuthError(
  provider: 'google' | 'apple',
  error: { message?: string; code?: string },
): Error {
  const msg = (error.message ?? '').toLowerCase();
  if (msg.includes('nonce')) {
    if (provider === 'google') {
      return new Error(
        'Google sign-in nonce mismatch. In Supabase Dashboard → Auth → Google, enable "Skip nonce check" (required for native iOS Google Sign-In). Then try again.',
      );
    }
    return new Error(
      'Apple sign-in nonce mismatch. Retry sign-in; if it persists, confirm Apple Client IDs in Supabase include au.enginelabs.sidequest.',
    );
  }
  if (provider === 'apple' && (msg.includes('audience') || msg.includes('client id'))) {
    return new Error(
      'Apple sign-in rejected by Supabase. In Dashboard → Auth → Apple → Client IDs, add: au.enginelabs.sidequest (bundle ID), comma-separated with any Services ID.',
    );
  }
  if (provider === 'google' && (msg.includes('audience') || msg.includes('client id') || msg.includes('authorized'))) {
    return new Error(
      'Google sign-in rejected by Supabase. In Dashboard → Auth → Google, add Web + iOS + Android OAuth client IDs under Authorized Client IDs (comma-separated).',
    );
  }
  return new Error(error.message ?? 'Sign in failed');
}

export async function signInWithPhone(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  if (error) throw error;
  return data.session;
}

export async function ensureProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from('profiles').insert({
      id: user.id,
      display_name:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.phone ??
        'Guest',
      avatar_url: user.user_metadata?.avatar_url ?? null,
    });
  }
}
