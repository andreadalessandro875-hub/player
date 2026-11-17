import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Artwork, Bouncy, Icon } from '../components/ui';
import { actionSheet, addToPlaylist, toast } from '../lib/actions';
import { impact, tap } from '../lib/haptics';
import { useNow } from '../lib/hooks';
import { artUri, lib } from '../lib/library';
import { cycleAB, cycleMode, next, playback, previous, seek, setShuffle, setSleep, toggle } from '../lib/player';
import { colors, fallbackGrays, fmtTime } from '../lib/theme';

const LOOP_UI = {
  one: { icon: 'repeat.1', label: 'Loop brano' },
  all: { icon: 'repeat', label: 'Loop tutti' },
  off: { icon: 'repeat', label: 'Loop spento' },
} as const;

export default function Player() {
  const st = playback.use(s => s);
  const tracks = lib.use(s => s.tracks);
  const playlists = lib.use(s => s.playlists);
  const track = tracks.find(t => t.id === st.currentId);
  const source = playlists.find(p => p.id === st.source);
  const insets = useSafeAreaInsets();
  const now = useNow(st.sleepAt > 0, 15000);
  const [scrub, setScrub] = useState<number | null>(null);

  // Copertina che si rimpicciolisce con un rimbalzo quando metti in pausa, come in Musica.
  const scale = useSharedValue(st.playing ? 1 : 0.82);
  useEffect(() => { scale.value = withSpring(st.playing ? 1 : 0.82, { damping: 14, stiffness: 160 }); }, [st.playing, scale]);
  const coverStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => { if (!track) router.back(); }, [track]);
  if (!track) return null;

  const duration = st.duration || track.duration || 0;
  const pos = scrub ?? st.position;
  const art = artUri(track);
  const [g1] = fallbackGrays(track.id);
  const loop = LOOP_UI[st.mode];
  const sleepLeft = st.sleepAt ? Math.max(1, Math.ceil((st.sleepAt - now) / 60000)) : 0;
  const { a, b } = st.ab;
  const abText = a === null ? 'Tocca A–B per fissare l’inizio della sezione'
    : b === null ? `A: ${fmtTime(a)} · tocca A–B per fissare la fine`
      : `Sezione ${fmtTime(a)} → ${fmtTime(b)} · tocca A–B per rimuoverla`;

  const sleepMenu = async () => {
    tap();
    const opts = ['15 minuti', '30 minuti', '45 minuti', '1 ora', '1 ora e mezza'];
    const mins = [15, 30, 45, 60, 90];
    const i = await actionSheet({ title: 'Interrompi la riproduzione tra', options: st.sleepAt ? [...opts, 'Disattiva timer'] : opts, destructive: st.sleepAt ? opts.length : undefined });
    if (i === null) return;
    if (i === opts.length) { setSleep(0); toast('Timer disattivato'); return; }
    setSleep(mins[i]);
    toast(`La musica si fermerà tra ${opts[i]}`);
  };

  return (
    <View style={s.screen}>
      {/* Sfondo: la copertina sfocata, scurita per leggere bene i testi */}
      {art ? (
        <Image source={{ uri: art }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={60} transition={400} />
      ) : (
        <LinearGradient colors={[g1, '#000']} style={StyleSheet.absoluteFill} />
      )}
      <View style={[StyleSheet.absoluteFill, s.shade]} />

      <View style={[s.inner, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.top}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Chiudi il player"><Icon name="chevron.down" size={22} /></Pressable>
          <Text style={s.eyebrow} numberOfLines={1}>{source ? `DA ${source.name.toUpperCase()}` : 'IN RIPRODUZIONE'}</Text>
          <View style={s.topRight}>
            <Pressable onPress={() => { tap(); addToPlaylist(track.id); }} hitSlop={8} accessibilityLabel="Aggiungi a una playlist">
              <Icon name="text.badge.plus" size={22} />
            </Pressable>
            <Pressable onPress={sleepMenu} hitSlop={8} style={s.sleepBtn} accessibilityLabel={sleepLeft ? `Timer attivo, ${sleepLeft} minuti` : 'Timer di spegnimento'}>
              <Icon name={sleepLeft ? 'moon.fill' : 'moon'} size={20} />
              {!!sleepLeft && <Text style={s.sleepText}>{sleepLeft}′</Text>}
            </Pressable>
          </View>
        </View>

        <Animated.View style={[s.coverWrap, coverStyle]}>
          {art ? <Image source={{ uri: art }} style={s.cover} contentFit="cover" transition={250} /> : <Artwork track={track} radius={14} style={s.cover} />}
        </Animated.View>

        <View style={s.meta}>
          <Text style={s.title} numberOfLines={1}>{track.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{track.artist}</Text>
        </View>

        <View>
          {a !== null && b !== null && duration > 0 && (
            <View pointerEvents="none" style={[s.abZone, { left: `${(a / duration) * 100}%`, width: `${((b - a) / duration) * 100}%` }]} />
          )}
          <Slider
            style={s.slider}
            minimumValue={0}
            maximumValue={Math.max(duration, 1)}
            value={pos}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="rgba(255,255,255,0.25)"
            thumbTintColor="#FFFFFF"
            onSlidingStart={() => setScrub(st.position)}
            onValueChange={v => setScrub(v)}
            onSlidingComplete={v => { seek(v); setScrub(null); }}
            accessibilityLabel="Posizione nel brano"
          />
          <View style={s.times}>
            <Text style={s.time}>{fmtTime(pos)}</Text>
            <Text style={s.time}>-{fmtTime(Math.max(0, duration - pos))}</Text>
          </View>
        </View>

        <View style={s.transport}>
          <Bouncy onPress={previous} label="Brano precedente" style={s.tBtn}><Icon name="backward.fill" size={34} /></Bouncy>
          <Bouncy onPress={() => { impact(); toggle(); }} haptic={false} label={st.playing ? 'Pausa' : 'Riproduci'} style={s.tBtnBig}>
            <Icon name={st.playing ? 'pause.fill' : 'play.fill'} size={48} />
          </Bouncy>
          <Bouncy onPress={next} label="Brano successivo" style={s.tBtn}><Icon name="forward.fill" size={34} /></Bouncy>
        </View>

        <View style={s.chips}>
          <Bouncy style={[s.chip, s.chipSq, st.shuffle && s.chipOn]} onPress={() => setShuffle(!st.shuffle)} label={st.shuffle ? 'Riproduzione casuale attiva' : 'Riproduzione casuale'}>
            <Icon name="shuffle" size={18} color={st.shuffle ? colors.onAccent : colors.text} />
          </Bouncy>
          <Bouncy style={[s.chip, s.chipWide, st.mode !== 'off' && s.chipOn]} onPress={cycleMode} label={`${loop.label}, tocca per cambiare`}>
            <Icon name={loop.icon} size={18} color={st.mode !== 'off' ? colors.onAccent : colors.text} />
            <Text style={[s.chipText, st.mode !== 'off' && s.chipTextOn]}>{loop.label}</Text>
          </Bouncy>
          <Bouncy
            style={[s.chip, s.chipSq, a !== null && s.chipOn]}
            onPress={() => { if (cycleAB() === 'short') toast('Sezione troppo corta'); }}
            label="Loop di una sezione A–B"
          >
            <Text style={[s.chipText, a !== null && s.chipTextOn]}>A–B</Text>
          </Bouncy>
        </View>
        <Text style={s.abText}>{abText}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  shade: { backgroundColor: 'rgba(0,0,0,0.55)' },
  inner: { flex: 1, paddingHorizontal: 26, paddingTop: 14, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 },
  eyebrow: { flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginHorizontal: 12 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  sleepBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sleepText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  coverWrap: { alignSelf: 'center', width: '100%', aspectRatio: 1, maxWidth: 380, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 16 } },
  cover: { width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden' },
  meta: { gap: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  artist: { color: 'rgba(255,255,255,0.7)', fontSize: 19 },
  slider: { width: '100%', height: 34 },
  abZone: { position: 'absolute', top: 15, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1, borderColor: '#fff' },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  tBtn: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  tBtnBig: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: 10 },
  chip: { height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chipSq: { width: 48 },
  chipWide: { flex: 1 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  chipTextOn: { color: colors.onAccent },
  abText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' },
});
