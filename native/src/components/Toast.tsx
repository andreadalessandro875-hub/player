import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toastStore } from '../lib/actions';
import { colors } from '../lib/theme';

/** Avviso a pillola che scende dall'alto e risale da solo dopo un paio di secondi. */
export function Toast() {
  const { message, key } = toastStore.use(s => s);
  const insets = useSafeAreaInsets();
  const y = useSharedValue(-120);
  useEffect(() => {
    if (!key) return;
    y.value = withSpring(0, { damping: 16, stiffness: 180 });
    y.value = withDelay(2200, withTiming(-120, { duration: 260 }));
  }, [key, y]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  if (!key) return null;
  return (
    <Animated.View pointerEvents="none" style={[s.wrap, { top: insets.top + 6 }, st]}>
      <BlurView intensity={60} tint="systemThickMaterialDark" style={s.pill}>
        <Text style={s.text} numberOfLines={1} accessibilityLiveRegion="polite">{message}</Text>
      </BlurView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  pill: { borderRadius: 22, overflow: 'hidden', paddingHorizontal: 20, paddingVertical: 11, maxWidth: '88%' },
  text: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
