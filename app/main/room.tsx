import { Redirect } from 'expo-router';

/** Legacy route — room deck lives on the Home tab. */
export default function RoomScreen() {
  return <Redirect href="/main/tabs/home" />;
}
