import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlaylistCover } from '../../../components/PlaylistCover';
import { TrackRow } from '../../../components/TrackRow';
import { Bouncy, Icon, PlayShuffleRow } from '../../../components/ui';
import { actionSheet, promptText, toast } from '../../../lib/actions';
import { success, tap } from '../../../lib/haptics';
import { deletePlaylist, lib, playlistTracks, updatePlaylist, type Track } from '../../../lib/library';
import { playback, playList, toggle } from '../../../lib/player';
import { colors } from '../../../lib/theme';

export default function PlaylistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlist = lib.use(s => s.playlists.find(p => p.id === id));
  const tracks = lib.use(s => s.tracks);
  const currentId = playback.use(s => s.currentId);
  const playing = playback.use(s => s.playing);
  const source = playback.use(s => s.source);

  const list = useMemo(() => (playlist ? playlistTracks(playlist, tracks) : []), [playlist, tracks]);
  const ids = useMemo(() => list.map(t => t.id), [list]);
  const minutes = Math.max(1, Math.round(list.reduce((s, t) => s + t.duration, 0) / 60));

  const onPress = useCallback((t: Track) => {
    const s = playback.get();
    if (t.id === s.currentId && s.source === id) {
      if (!s.playing) toggle();
      router.push('/player');
      return;
    }
    playList(ids, t.id, { source: id });
  }, [ids, id]);

  const move = (t: Track, dir: -1 | 1) => {
    if (!playlist) return;
    const arr = [...playlist.ids];
    const i = arr.indexOf(t.id), j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    updatePlaylist(playlist.id, { ids: arr });
  };
  const remove = (t: Track) => {
    if (!playlist) return;
    updatePlaylist(playlist.id, { ids: playlist.ids.filter(x => x !== t.id) });
    toast('Rimosso dalla playlist');
  };
  const rowMenu = async (t: Track) => {
    const i = await actionSheet({ title: t.title, options: ['Sposta su', 'Sposta giù', 'Rimuovi dalla playlist'], destructive: 2 });
    if (i === 0) move(t, -1);
    else if (i === 1) move(t, 1);
    else if (i === 2) remove(t);
  };
  const more = async () => {
    if (!playlist) return;
    tap();
    const i = await actionSheet({ title: playlist.name, options: ['Aggiungi brani', 'Rinomina playlist', 'Elimina playlist'], destructive: 2 });
    if (i === 0) router.push(`/pick/${playlist.id}`);
    else if (i === 1) {
      const name = await promptText('Rinomina playlist', '', playlist.name);
      if (name) { updatePlaylist(playlist.id, { name }); success(); }
    } else if (i === 2) {
      const c = await actionSheet({ title: `Eliminare “${playlist.name}”?`, message: 'I brani restano nella libreria.', options: ['Elimina playlist'], destructive: 0 });
      if (c === 0) { router.back(); deletePlaylist(playlist.id); toast('Playlist eliminata'); }
    }
  };

  if (!playlist) return <Stack.Screen options={{ title: '' }} />;

  return (
    <>
      <Stack.Screen
        options={{
          title: playlist.name,
          headerLargeTitleEnabled: false,
          headerRight: () => (
            <Pressable onPress={more} hitSlop={10} accessibilityLabel="Altre azioni">
              <Icon name="ellipsis.circle" size={22} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={s.head}>
          <PlaylistCover tracks={list} size={200} />
          <Text style={s.name} numberOfLines={2}>{playlist.name}</Text>
          <Text style={s.meta}>{list.length} {list.length === 1 ? 'brano' : 'brani'}{list.length ? ` · ${minutes} min` : ''}</Text>
        </View>
        <View style={s.pad}>
          {list.length > 0 && (
            <PlayShuffleRow onPlay={() => playList(ids, undefined, { source: id, shuffle: false })} onShuffle={() => playList(ids, undefined, { source: id, shuffle: true })} />
          )}
          <Bouncy style={s.add} onPress={() => router.push(`/pick/${playlist.id}`)} label="Aggiungi brani">
            <Icon name="plus.circle.fill" size={22} />
            <Text style={s.addText}>Aggiungi brani</Text>
          </Bouncy>
        </View>
        {list.map(t => (
          <TrackRow
            key={t.id}
            track={t}
            current={t.id === currentId && source === id}
            playing={playing}
            deleteLabel="Rimuovi"
            onPress={onPress}
            onLongPress={rowMenu}
            onDelete={remove}
          />
        ))}
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  head: { alignItems: 'center', paddingTop: 12, paddingHorizontal: 20, gap: 6 },
  name: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  meta: { color: colors.muted, fontSize: 15, marginBottom: 10 },
  pad: { paddingHorizontal: 20 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48 },
  addText: { color: colors.text, fontSize: 17, fontWeight: '500' },
});
