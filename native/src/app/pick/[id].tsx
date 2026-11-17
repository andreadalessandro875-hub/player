import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Artwork, Icon } from '../../components/ui';
import { toast } from '../../lib/actions';
import { success, tap } from '../../lib/haptics';
import { lib, updatePlaylist } from '../../lib/library';
import { colors } from '../../lib/theme';

/** Elenco della libreria con le spunte: aggiunge o toglie brani dalla playlist. */
export default function PickTracks() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlist = lib.use(s => s.playlists.find(p => p.id === id));
  const tracks = lib.use(s => s.tracks);
  const [sel, setSel] = useState(() => new Set(playlist?.ids ?? []));
  const insets = useSafeAreaInsets();

  const done = () => {
    if (playlist) {
      const kept = playlist.ids.filter(x => sel.has(x));
      const added = tracks.map(t => t.id).filter(x => sel.has(x) && !playlist.ids.includes(x));
      const removed = playlist.ids.length - kept.length;
      updatePlaylist(playlist.id, { ids: [...kept, ...added] });
      success();
      if (added.length) toast(added.length === 1 ? '1 brano aggiunto' : `${added.length} brani aggiunti`);
      else if (removed) toast(removed === 1 ? '1 brano rimosso' : `${removed} brani rimossi`);
    }
    router.back();
  };

  return (
    <View style={s.screen}>
      <View style={s.head}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={s.link}>Annulla</Text></Pressable>
        <Text style={s.title} numberOfLines={1}>{playlist?.name ?? 'Playlist'}</Text>
        <Pressable onPress={done} hitSlop={10}><Text style={[s.link, s.bold]}>Fine</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {tracks.length === 0 && <Text style={s.empty}>La libreria è vuota: aggiungi prima dei brani.</Text>}
        {tracks.map(t => {
          const on = sel.has(t.id);
          return (
            <Pressable
              key={t.id}
              style={({ pressed }) => [s.row, pressed && s.pressed]}
              onPress={() => {
                tap();
                setSel(prev => { const n = new Set(prev); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; });
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${t.title}, ${t.artist}`}
            >
              <Artwork track={t} size={48} />
              <View style={s.text}>
                <Text style={s.tTitle} numberOfLines={1}>{t.title}</Text>
                <Text style={s.sub} numberOfLines={1}>{t.artist}</Text>
              </View>
              <View style={[s.check, on && s.checkOn]}>{on && <Icon name="checkmark" size={14} color={colors.onAccent} weight="bold" />}</View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0D' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  link: { color: colors.accent, fontSize: 17 },
  bold: { fontWeight: '700' },
  title: { color: colors.text, fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  empty: { color: colors.muted, textAlign: 'center', padding: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 8 },
  pressed: { backgroundColor: '#18181A' },
  text: { flex: 1, minWidth: 0, gap: 2 },
  tTitle: { color: colors.text, fontSize: 16, fontWeight: '500' },
  sub: { color: colors.muted, fontSize: 14 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
