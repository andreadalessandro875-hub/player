import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { tap } from '../lib/haptics';
import { artUri, type Track } from '../lib/library';
import { colors, fallbackGrays } from '../lib/theme';

export function Icon({ name, size = 22, color = colors.text, weight }: {
  name: SymbolViewProps['name']; size?: number; color?: string; weight?: SymbolViewProps['weight'];
}) {
  return <SymbolView name={name} size={size} tintColor={color} weight={weight} style={{ width: size, height: size }} />;
}

/** Copertina del brano, oppure un riquadro grigio con una nota se il file non ne ha. */
export function Artwork({ track, size, radius = 8, style }: { track?: Track | null; size?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const box: ViewStyle = { width: size ?? '100%', height: size ?? '100%', borderRadius: radius, overflow: 'hidden' };
  const uri = track ? artUri(track) : undefined;
  if (uri) {
    return (
      <View style={[box, style]}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} recyclingKey={track!.id} />
      </View>
    );
  }
  const [a, b] = fallbackGrays(track?.id ?? 'vuoto');
  return (
    <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[box, styles.center, style]}>
      <Icon name="music.note" size={Math.max(14, (size ?? 260) * 0.34)} color="rgba(255,255,255,0.55)" />
    </LinearGradient>
  );
}

function EqBar({ delay, duration, playing }: { delay: number; duration: number; playing: boolean }) {
  const v = useSharedValue(0.35);
  useEffect(() => {
    if (playing) v.value = withDelay(delay, withRepeat(withTiming(1, { duration }), -1, true));
    else { cancelAnimation(v); v.value = withTiming(0.35, { duration: 200 }); }
  }, [playing, delay, duration, v]);
  const st = useAnimatedStyle(() => ({ transform: [{ scaleY: v.value }] }));
  return <Animated.View style={[styles.eqBar, st]} />;
}
/** Equalizzatore animato accanto al brano in riproduzione. */
export function Equalizer({ playing }: { playing: boolean }) {
  return (
    <View style={styles.eq} accessibilityLabel={playing ? 'In riproduzione' : 'In pausa'}>
      <EqBar delay={0} duration={420} playing={playing} />
      <EqBar delay={120} duration={300} playing={playing} />
      <EqBar delay={60} duration={480} playing={playing} />
      <EqBar delay={200} duration={360} playing={playing} />
    </View>
  );
}

/** Pulsante con piccolo rimbalzo alla pressione, come nelle app di sistema. */
export function Bouncy({ onPress, onLongPress, style, children, label, disabled, haptic = true }: {
  onPress?: () => void; onLongPress?: () => void; style?: StyleProp<ViewStyle>; children: React.ReactNode;
  label?: string; disabled?: boolean; haptic?: boolean;
}) {
  const s = useSharedValue(1);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPressIn={() => { s.value = withSpring(0.94, { damping: 18, stiffness: 400 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
      onPress={() => { if (haptic) tap(); onPress?.(); }}
      onLongPress={onLongPress}
      hitSlop={6}
    >
      <Animated.View style={[style, st, disabled && { opacity: 0.4 }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Coppia di pulsanti "Riproduci" / "Casuale" in cima a libreria e playlist. */
export function PlayShuffleRow({ onPlay, onShuffle }: { onPlay: () => void; onShuffle: () => void }) {
  return (
    <View style={styles.quick}>
      <Bouncy style={styles.pill} onPress={onPlay} label="Riproduci">
        <Icon name="play.fill" size={16} />
        <Text style={styles.pillText}>Riproduci</Text>
      </Bouncy>
      <Bouncy style={styles.pill} onPress={onShuffle} label="Riproduzione casuale">
        <Icon name="shuffle" size={16} />
        <Text style={styles.pillText}>Casuale</Text>
      </Bouncy>
    </View>
  );
}

export function EmptyState({ icon, title, text, action, onAction }: {
  icon: SymbolViewProps['name']; title: string; text: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIco}><Icon name={icon} size={38} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {action && (
        <Bouncy style={styles.primary} onPress={onAction} label={action}>
          <Text style={styles.primaryText}>{action}</Text>
        </Bouncy>
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  eq: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14, width: 22, justifyContent: 'flex-end' },
  eqBar: { width: 3, height: 14, borderRadius: 1.5, backgroundColor: colors.accent, transformOrigin: 'bottom' },
  quick: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 8 },
  pill: { flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pillText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIco: { width: 88, height: 88, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 18, marginBottom: 6 },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 21, textAlign: 'center', marginBottom: 22 },
  primary: { height: 50, paddingHorizontal: 28, borderRadius: 25, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
  sectionNote: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 18 },
});
