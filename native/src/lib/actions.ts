import { ActionSheetIOS, Alert } from 'react-native';
import { success } from './haptics';
import { createPlaylist, deleteTrack, lib, toggleInPlaylist, type Track } from './library';
import { forgetTrack } from './player';
import { createStore } from './store';

/* ---------- Avvisi brevi in alto (stile iOS) ---------- */
export const toastStore = createStore({ message: '', key: 0 });
export function toast(message: string) {
  toastStore.set(s => ({ message, key: s.key + 1 }));
}

/* ---------- Menu e richieste native ---------- */
export function actionSheet(o: { title?: string; message?: string; options: string[]; destructive?: number }): Promise<number | null> {
  return new Promise(resolve => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: o.title,
        message: o.message,
        options: [...o.options, 'Annulla'],
        cancelButtonIndex: o.options.length,
        destructiveButtonIndex: o.destructive,
        userInterfaceStyle: 'dark',
        tintColor: '#FFFFFF',
      },
      i => resolve(i === o.options.length ? null : i),
    );
  });
}

export function promptText(title: string, message: string, initial = '', ok = 'Salva'): Promise<string | null> {
  return new Promise(resolve => {
    Alert.prompt(
      title,
      message,
      [
        { text: 'Annulla', style: 'cancel', onPress: () => resolve(null) },
        { text: ok, isPreferred: true, onPress: (v?: string) => resolve((v ?? '').trim()) },
      ],
      'plain-text',
      initial,
      'default',
      { userInterfaceStyle: 'dark' },
    );
  });
}

/* ---------- Azioni comuni ---------- */
export async function newPlaylist(ids: string[] = []) {
  const name = await promptText('Nuova playlist', 'Dai un nome alla playlist.', '', 'Crea');
  if (name === null) return null;
  const p = createPlaylist(name, ids);
  success();
  return p;
}

/** Aggiunge o toglie un brano da una playlist (il segno ✓ indica dove è già presente). */
export async function addToPlaylist(trackId: string) {
  const { playlists } = lib.get();
  const i = await actionSheet({
    title: 'Aggiungi a una playlist',
    options: ['Nuova playlist…', ...playlists.map(p => (p.ids.includes(trackId) ? '✓  ' : '') + p.name)],
  });
  if (i === null) return;
  if (i === 0) {
    const p = await newPlaylist([trackId]);
    if (p) toast(`Aggiunto a “${p.name}”`);
    return;
  }
  const p = playlists[i - 1];
  const added = toggleInPlaylist(p.id, trackId);
  success();
  toast(added ? `Aggiunto a “${p.name}”` : `Rimosso da “${p.name}”`);
}

export async function confirmDeleteTrack(t: Track) {
  const i = await actionSheet({
    title: t.title,
    message: 'Il brano verrà rimosso dall’iPhone e da tutte le playlist.',
    options: ['Elimina dalla libreria'],
    destructive: 0,
  });
  if (i !== 0) return false;
  forgetTrack(t.id);
  deleteTrack(t.id);
  toast('Brano eliminato');
  return true;
}

export async function trackMenu(t: Track) {
  const i = await actionSheet({ title: t.title, message: t.artist, options: ['Aggiungi a una playlist…', 'Elimina dalla libreria'], destructive: 1 });
  if (i === 0) addToPlaylist(t.id);
  else if (i === 1) confirmDeleteTrack(t);
}
