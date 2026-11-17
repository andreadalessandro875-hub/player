import { Stack } from 'expo-router';
import { largeHeader } from '../../../lib/hooks';

export default function AddStack() {
  return <Stack screenOptions={largeHeader} />;
}
