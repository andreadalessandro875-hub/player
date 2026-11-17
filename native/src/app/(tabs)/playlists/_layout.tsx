import { Stack } from 'expo-router';
import { largeHeader } from '../../../lib/hooks';

export default function PlaylistsStack() {
  return <Stack screenOptions={largeHeader} />;
}
