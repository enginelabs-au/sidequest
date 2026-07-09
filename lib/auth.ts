import { supabase } from '@/lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const extra = Constants.expoConfig?.extra ?? {};
const appScheme = (extra.appScheme as string) ?? 'sidequest';

export const redirectTo = makeRedirectUri({ scheme: appScheme, path: 'auth/callback' });

export function isAuthCallbackUrl(url: string): boolean {
  return url.includes('auth/callback');
}

export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ''));
}

export function normalizePhone(phone: string): string {
  const trimmed = phone.replace(/\s/g, '');
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token) return null;
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
}

export async function signInWithOAuth(provider: 'google' | 'apple') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success' && result.url) {
    return createSessionFromUrl(result.url);
  }
  return null;
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
