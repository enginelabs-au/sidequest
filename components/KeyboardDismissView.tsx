import { StyleSheet, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

/**
 * Layout shell only — do not wrap in TouchableWithoutFeedback here;
 * that intercepts ScrollView gestures and makes venue/profile screens hard to scroll.
 */
export function KeyboardDismissView({ children }: Props) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
