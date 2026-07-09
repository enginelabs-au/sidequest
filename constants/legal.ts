import Constants from 'expo-constants';

type LegalExtra = {
  privacyPolicyUrl?: string;
  termsUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as LegalExtra;

export const privacyPolicyUrl = extra.privacyPolicyUrl?.trim() || null;
export const termsUrl = extra.termsUrl?.trim() || null;

export function hasLegalUrls(): boolean {
  return !!(privacyPolicyUrl || termsUrl);
}
