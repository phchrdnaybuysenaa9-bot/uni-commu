import { Redirect } from 'expo-router';

export default function SavedScreen() {
  return <Redirect href={{ pathname: '/profile', params: { tab: 'saved' } }} />;
}
