import { Stack } from 'expo-router';
import { largeHeader } from '../../../lib/hooks';

export default function LibraryStack() {
  return <Stack screenOptions={largeHeader} />;
}
