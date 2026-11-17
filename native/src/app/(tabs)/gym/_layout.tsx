import { Stack } from 'expo-router';
import { largeHeader } from '../../../lib/hooks';

export default function GymStack() {
  return <Stack screenOptions={largeHeader} />;
}
