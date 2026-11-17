import { router, Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TrackRow } from '../../../components/TrackRow';
import { EmptyState, PlayShuffleRow, styles as ui } from '../../../components/ui';
import { confirmDeleteTrack, trackMenu } from '../../../lib/actions';
import { lib, type Track } from '../../../lib/library';
import { playback, playList, toggle } from '../../../lib/player';
import { colors } from '../../../lib/theme';

export default function Library() {
  const tracks = lib.use(s => s.tracks);
  const currentId = playback.use(s => s.currentId);
  const playing = playback.use(s => s.playing);
  const [query, setQuery] = useState('');

  const ids = useMemo(() => tracks.map(t => t.id), [tracks]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tracks.filter(t => `${t.title} ${t.artist}`.toLowerCase().includes(q)) : tracks;
  }, [tracks, query]);
  const minutes = useMemo(() => Math.max(1, Math.round(tracks.reduce((s, t) => s + t.duration, 0) / 60)), [tracks]);

  const onPress = useCallback((t: Track) => {
    const s = playback.get();
    if (t.id === s.currentId && s.source === null) {
      if (!s.playing) toggle();
      router.push('/player');
      return;
    }
    playList(ids, t.id, { source: null });
  }, [ids]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Libreria',
          headerSearchBarOptions: {
            placeholder: 'Cerca nei tuoi brani',
            onChangeText: e => setQuery(e.nativeEvent.text),
            onCancelButtonPress: () => setQuery(''),
            hideWhenScrolling: true,
            tintColor: colors.accent,
            textColor: colors.text,
          },
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 140 }}>
        {tracks.length === 0 ? (
          <EmptyState
            icon="music.note"
            title="La tua libreria è vuota"
            text="Importa brani dall’app File, da una cartella di Google Drive o dal PC."
            action="Aggiungi brani"
            onAction={() => router.navigate('/add')}
          />
        ) : (
          <>
            {!query && (
              <View style={s.pad}>
                <PlayShuffleRow onPlay={() => playList(ids, undefined, { source: null, shuffle: false })} onShuffle={() => playList(ids, undefined, { source: null, shuffle: true })} />
              </View>
            )}
            {shown.map(t => (
              <TrackRow
                key={t.id}
                track={t}
                current={t.id === currentId}
                playing={playing}
                deleteLabel="Elimina"
                onPress={onPress}
                onLongPress={trackMenu}
                onDelete={confirmDeleteTrack}
              />
            ))}
            {query && !shown.length && <Text style={s.noResults}>Nessun risultato per “{query}”</Text>}
            {!query && <Text style={ui.sectionNote}>{tracks.length} {tracks.length === 1 ? 'brano' : 'brani'} · {minutes} min</Text>}
          </>
        )}
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  noResults: { color: colors.muted, textAlign: 'center', paddingTop: 40, fontSize: 15 },
});
