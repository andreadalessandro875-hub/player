import { StyleSheet, View } from 'react-native';
import type { Track } from '../lib/library';
import { colors } from '../lib/theme';
import { Artwork, Icon } from './ui';

/** Copertina della playlist: la prima copertina, oppure un mosaico 2×2 dalla quarta in su. */
export function PlaylistCover({ tracks, size }: { tracks: Track[]; size: number }) {
  if (!tracks.length) {
    return (
      <View style={[s.box, { width: size, height: size }, s.empty]}>
        <Icon name="music.note.list" size={size * 0.4} color={colors.muted} />
      </View>
    );
  }
  if (tracks.length < 4) return <Artwork track={tracks[0]} size={size} />;
  const half = size / 2;
  return (
    <View style={[s.box, s.grid, { width: size, height: size }]}>
      {tracks.slice(0, 4).map(t => <Artwork key={t.id} track={t} size={half} radius={0} />)}
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderRadius: 8, overflow: 'hidden', backgroundColor: colors.raised },
  empty: { alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
