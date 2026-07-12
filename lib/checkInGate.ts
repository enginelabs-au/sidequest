import { Alert } from 'react-native';

export const CHECK_IN_REQUIRED_TITLE = 'Check in first';
export const CHECK_IN_REQUIRED_MESSAGE =
  'Check in at a venue on the map before waving or messaging others.';

export function promptCheckInRequired(navigateToMap?: () => void): void {
  Alert.alert(CHECK_IN_REQUIRED_TITLE, CHECK_IN_REQUIRED_MESSAGE, [
    { text: 'Not now', style: 'cancel' },
    ...(navigateToMap
      ? [{ text: 'Go to Map', onPress: navigateToMap }]
      : []),
  ]);
}
