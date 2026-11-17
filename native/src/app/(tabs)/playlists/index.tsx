import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlaylistCover } from '../../../components/PlaylistCover';
import { EmptyState, Icon } from '../../../components/ui';
import { newPlaylist } from '../../../lib/actions';
import { tap } from '../../../lib/haptics';
import { lib, playlistTracks } from '../../../lib/library';
import { playback } from '../../../lib/player';
import { colors } from '../../../lib/theme';

async function createAndOpen() {
  const p = await newPlaylist();
  if (!p) return;
  router.push(`/playlists/${p.id}`);
  if (lib.get().tracks.length) setTimeout(() => router.push(`/pick/${p.id}`), 450);
}

export default function Playlists() {
  const playlists = lib.use(s => s.playlists);
  const tracks = lib.use(s => s.tracks);
  const source = playback.use(s => s.source);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Playlist',
          headerRight: () => (
            <Pressable onPress={() => { tap(); createAndOpen(); }} hitSlop={10} accessibilityLabel="Nuova playlist">
              <Icon name="plus" size={22} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 140 }}>
        {playlists.length === 0 ? (
          <EmptyState
            icon="music.note.list"
            title="Nessuna playlist"
            text="Crea una playlist per raggruppare i brani da ascoltare insieme, anche in loop."
            action="Crea playlist"
            onAction={createAndOpen}
          />
        ) : (
          playlists.map(p => {
            const list = playlistTracks(p, tracks);
            const min = Math.round(list.reduce((s, t) => s + t.duration, 0) / 60);
            return (
              <Pressable
                key={p.id}
                onPress={() => { tap(); router.push(`/playlists/${p.id}`); }}
                style={({ pressed }) => [s.row, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${p.name}, ${list.length} brani`}
              >
                <PlaylistCover tracks={list} size={60} />
                <View style={s.text}>
                  <Text style={[s.title, source === p.id && s.on]} numberOfLines={1}>{p.name}</Text>
                  <Text style={s.sub}>{list.length} {list.length === 1 ? 'brano' : 'brani'}{list.length ? ` · ${Math.max(1, min)} min` : ''}</Text>
                </View>
                <Icon name="chevron.right" size={14} color={colors.muted} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 8 },
  pressed: { backgroundColor: '#151517' },
  text: { flex: 1, minWidth: 0, gap: 3 },
  title: { color: colors.text, fontSize: 17, fontWeight: '500' },
  on: { fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 15 },
});
