import { Redirect } from 'expo-router';

/** Legacy route — profile lives on the Profile tab. */
export default function MainProfileRedirect() {
  return <Redirect href="/main/tabs/profile" />;
}
