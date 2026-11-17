import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { impact } from '../lib/haptics';
import type { Track } from '../lib/library';
import { colors, fmtTime } from '../lib/theme';
import { Artwork, Equalizer, Icon } from './ui';

type Props = {
  track: Track;
  current: boolean;
  playing: boolean;
  deleteLabel: string;
  onPress: (t: Track) => void;
  onLongPress: (t: Track) => void;
  onDelete: (t: Track) => void;
};

/** Riga di un brano: tocco per riprodurre, pressione lunga per il menu, scorrimento a sinistra per eliminare. */
export const TrackRow = memo(function TrackRow({ track, current, playing, deleteLabel, onPress, onLongPress, onDelete }: Props) {
  return (
    <ReanimatedSwipeable
      friction={1.6}
      rightThreshold={60}
      overshootRight={false}
      renderRightActions={(_p, _t, methods) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${deleteLabel} ${track.title}`}
          style={s.del}
          onPress={() => { impact(true); methods.close(); onDelete(track); }}
        >
          <Icon name="trash" size={20} color="#fff" />
          <Text style={s.delText}>{deleteLabel}</Text>
        </Pressable>
      )}
    >
      <Pressable
        onPress={() => onPress(track)}
        onLongPress={() => { impact(); onLongPress(track); }}
        delayLongPress={380}
        style={({ pressed }) => [s.row, pressed && s.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${track.title}, ${track.artist}`}
      >
        <Artwork track={track} size={52} />
        <View style={s.text}>
          <Text style={[s.title, current && s.titleOn]} numberOfLines={1}>{track.title}</Text>
          <Text style={s.sub} numberOfLines={1}>{track.artist}</Text>
        </View>
        {current ? <Equalizer playing={playing} /> : <Text style={s.dur}>{track.duration ? fmtTime(track.duration) : ''}</Text>}
      </Pressable>
    </ReanimatedSwipeable>
  );
});

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 7, backgroundColor: colors.bg },
  pressed: { backgroundColor: '#151517' },
  text: { flex: 1, minWidth: 0, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, paddingVertical: 9 },
  title: { color: colors.text, fontSize: 17, fontWeight: '500' },
  titleOn: { fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 15 },
  dur: { color: colors.muted, fontSize: 15, fontVariant: ['tabular-nums'], minWidth: 36, textAlign: 'right' },
  del: { width: 92, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', gap: 4 },
  delText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
