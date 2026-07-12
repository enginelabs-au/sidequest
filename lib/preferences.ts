import { SAME_MODE_ONLY_KEY } from '@/constants/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getSameModeOnlyPreference(): Promise<boolean> {
  const value = await AsyncStorage.getItem(SAME_MODE_ONLY_KEY);
  if (value === null) return true;
  return value === 'true';
}

export async function setSameModeOnlyPreference(value: boolean): Promise<void> {
  await AsyncStorage.setItem(SAME_MODE_ONLY_KEY, value ? 'true' : 'false');
}
