import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { adjustRest, gym, stopRest } from '../lib/gym';
import { tap } from '../lib/haptics';
import { useNow } from '../lib/hooks';
import { lib } from '../lib/library';
import { next, playback, toggle } from '../lib/player';
import { colors, fmtTime } from '../lib/theme';
import { Artwork, Icon } from './ui';

/** Accessorio sopra la barra in basso: timer di recupero (se attivo) oppure il brano in riproduzione. */
export function MiniPlayer() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const rest = gym.use(s => s.rest);
  const now = useNow(!!rest);
  const currentId = playback.use(s => s.currentId);
  const playing = playback.use(s => s.playing);
  const track = lib.use(s => s.tracks).find(t => t.id === currentId);
  const inline = placement === 'inline';

  if (rest) {
    const left = Math.max(0, Math.ceil((rest.end - now) / 1000));
    return (
      <View style={s.row} accessibilityLabel={`Recupero, ${left} secondi`}>
        <Icon name="timer" size={20} />
        <View style={s.text}>
          {!inline && <Text style={s.sub} numberOfLines={1}>{rest.label}</Text>}
          <Text style={[s.title, s.mono]}>{fmtTime(left)}</Text>
        </View>
        {!inline && (
          <Pressable style={s.btn} onPress={() => { tap(); adjustRest(-15); }} accessibilityLabel="Togli 15 secondi">
            <Text style={s.btnText}>−15</Text>
          </Pressable>
        )}
        <Pressable style={s.btn} onPress={() => { tap(); adjustRest(15); }} accessibilityLabel="Aggiungi 15 secondi">
          <Text style={s.btnText}>+15</Text>
        </Pressable>
        <Pressable style={s.btn} onPress={() => { tap(); stopRest(); }} accessibilityLabel="Termina il recupero">
          <Icon name="xmark" size={16} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      style={s.row}
      onPress={() => { if (track) { tap(); router.push('/player'); } }}
      accessibilityRole="button"
      accessibilityLabel={track ? `In riproduzione: ${track.title}. Apri il player` : 'Nessun brano in riproduzione'}
    >
      <Artwork track={track} size={inline ? 28 : 36} radius={6} />
      <View style={s.text}>
        <Text style={s.title} numberOfLines={1}>{track ? track.title : 'Non in riproduzione'}</Text>
        {!inline && track && <Text style={s.sub} numberOfLines={1}>{track.artist}</Text>}
      </View>
      {track && (
        <>
          <Pressable style={s.btn} onPress={() => { tap(); toggle(); }} accessibilityLabel={playing ? 'Pausa' : 'Riproduci'}>
            <Icon name={playing ? 'pause.fill' : 'play.fill'} size={20} />
          </Pressable>
          {!inline && (
            <Pressable style={s.btn} onPress={() => { tap(); next(); }} accessibilityLabel="Brano successivo">
              <Icon name="forward.fill" size={20} />
            </Pressable>
          )}
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  text: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: colors.muted, fontSize: 13 },
  mono: { fontVariant: ['tabular-nums'], fontSize: 17 },
  btn: { minWidth: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
