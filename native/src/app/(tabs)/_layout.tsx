import { NativeTabs } from 'expo-router/native-tabs';
import { MiniPlayer } from '../../components/MiniPlayer';
import { colors } from '../../lib/theme';

/* Barra in basso nativa di iOS (in vetro "Liquid Glass" su iOS 26), con il mini player
   come accessorio sopra la barra, come in Musica. */
export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.accent} minimizeBehavior="onScrollDown">
      <NativeTabs.BottomAccessory>
        <MiniPlayer />
      </NativeTabs.BottomAccessory>
      <NativeTabs.Trigger name="(library)">
        <NativeTabs.Trigger.Icon sf="music.note" />
        <NativeTabs.Trigger.Label>Libreria</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="playlists">
        <NativeTabs.Trigger.Icon sf="music.note.list" />
        <NativeTabs.Trigger.Label>Playlist</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="gym">
        <NativeTabs.Trigger.Icon sf="dumbbell.fill" />
        <NativeTabs.Trigger.Label>Palestra</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add">
        <NativeTabs.Trigger.Icon sf="square.and.arrow.down" />
        <NativeTabs.Trigger.Label>Aggiungi</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
