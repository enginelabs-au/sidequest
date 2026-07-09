import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useTooltipFlag(key: string) {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(`tooltip:${key}`).then((value) => {
      if (!value) setVisible(true);
      setReady(true);
    });
  }, [key]);

  const dismiss = async () => {
    await AsyncStorage.setItem(`tooltip:${key}`, '1');
    setVisible(false);
  };

  return { visible: ready && visible, dismiss, ready };
}
