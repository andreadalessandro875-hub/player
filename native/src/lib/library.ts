import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { createStore } from './store';
import { parseName, readTags } from './tags';

export type Track = {
  id: string;
  file: string;        // nome del file audio nella cartella privata della libreria
  title: string;
  artist: string;
  duration: number;
  size: number;
  art?: string;        // nome del file della copertina, se presente
  origin: string;      // "nome|dimensione" del file importato, per non importarlo due volte
  addedAt: number;
};
export type Playlist = { id: string; name: string; ids: string[]; created: number };

export const AUDIO_EXT = /\.(mp3|m4a|aac|wav|aif|aiff|caf|flac|alac|mp4)$/i;

export const lib = createStore({ ready: false, tracks: [] as Track[], playlists: [] as Playlist[] });

/* ---------- Cartelle ----------
   La libreria vive in Library/Application Support (invisibile nell'app File).
   La cartella Documenti invece è visibile come "Loop" nell'app File e nel PC (Dispositivi Apple):
   i file audio messi lì vengono importati automaticamente. */
const base = () => new Directory(Paths.document.parentDirectory, 'Library', 'Application Support', 'LoopPlayer');
const musicDir = () => new Directory(base(), 'music');
const artDir = () => new Directory(base(), 'art');
export const inboxDir = () => Paths.document;

function ensureDirs() {
  for (const d of [musicDir(), artDir()]) if (!d.exists) d.create({ intermediates: true });
}
export const trackUri = (t: Track) => new File(musicDir(), t.file).uri;
export const artUri = (t: Track) => (t.art ? new File(artDir(), t.art).uri : undefined);

/* ---------- Salvataggio ---------- */
const KEY = 'library.v1';
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const { tracks, playlists } = lib.get();
    AsyncStorage.setItem(KEY, JSON.stringify({ tracks, playlists })).catch(() => {});
  }, 300);
}
const byTitle = (a: Track, b: Track) => a.title.localeCompare(b.title, 'it', { sensitivity: 'base' });

export async function loadLibrary() {
  ensureDirs();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    // scarta i brani il cui file non esiste più
    const tracks: Track[] = (data.tracks ?? []).filter((t: Track) => new File(musicDir(), t.file).exists);
    const ids = new Set(tracks.map(t => t.id));
    const playlists: Playlist[] = (data.playlists ?? []).map((p: Playlist) => ({ ...p, ids: p.ids.filter(id => ids.has(id)) }));
    lib.set({ ready: true, tracks: tracks.sort(byTitle), playlists });
  } catch {
    lib.set({ ready: true });
  }
}

/* ---------- Importazione ---------- */
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const extOf = (name: string) => (name.match(/\.[^.]+$/)?.[0] ?? '.mp3').toLowerCase();
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// Durata letta da un lettore temporaneo, rilasciato subito dopo.
async function probeDuration(uri: string) {
  const p = createAudioPlayer({ uri });
  try {
    for (let i = 0; i < 40; i++) {
      if (p.isLoaded && p.duration > 0) return p.duration;
      await wait(100);
    }
    return 0;
  } finally {
    p.remove();
  }
}

const originOf = (f: File) => `${f.name.toLowerCase()}|${f.size}`;
export const isKnown = (f: File) => lib.get().tracks.some(t => t.origin === originOf(f));

/** Copia (o sposta) un file audio nella libreria e ne legge tag, copertina e durata. */
export async function importFile(src: File, opts: { move?: boolean } = {}): Promise<Track | null> {
  ensureDirs();
  if (!AUDIO_EXT.test(src.name)) return null;
  const origin = originOf(src);
  if (lib.get().tracks.some(t => t.origin === origin)) {
    if (opts.move) { try { src.delete(); } catch { /* già rimosso */ } }
    return null;
  }
  const id = newId();
  const dest = new File(musicDir(), id + extOf(src.name));
  if (opts.move) await src.move(dest); else await src.copy(dest);

  const tags = await readTags(dest);
  const byName = parseName(src.name);
  let art: string | undefined;
  if (tags.art?.bytes.length) {
    try {
      const f = new File(artDir(), `${id}.${tags.art.ext}`);
      f.create({ overwrite: true });
      f.write(tags.art.bytes);
      art = f.name;
    } catch { /* copertina non salvabile */ }
  }
  const track: Track = {
    id,
    file: dest.name,
    title: tags.title || byName.title,
    artist: tags.artist || byName.artist,
    duration: await probeDuration(dest.uri),
    size: dest.size,
    art,
    origin,
    addedAt: Date.now(),
  };
  lib.set(s => ({ tracks: [...s.tracks, track].sort(byTitle) }));
  persist();
  return track;
}

function audioFilesIn(dir: Directory, depth = 0): File[] {
  const out: File[] = [];
  for (const item of dir.list()) {
    if (item instanceof File) { if (AUDIO_EXT.test(item.name)) out.push(item); }
    else if (depth < 3 && item.name !== '.Trash') out.push(...audioFilesIn(item, depth + 1));
  }
  return out;
}

/** File messi nella cartella "Loop" (app File o PC): vengono spostati nella libreria. */
export async function importInbox(onProgress?: (done: number, total: number) => void) {
  let files: File[] = [];
  try { files = audioFilesIn(inboxDir()); } catch { return 0; }
  let added = 0;
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, files.length);
    try { if (await importFile(files[i], { move: true })) added++; } catch { /* file non importabile */ }
  }
  onProgress?.(files.length, files.length);
  return added;
}

/** Cartella scelta dall'utente (es. "Loop Player" su Google Drive nell'app File): importa solo i brani nuovi. */
export async function syncFolder(dir: Directory, onProgress?: (done: number, total: number, name: string) => void) {
  const files = audioFilesIn(dir).filter(f => !isKnown(f));
  let added = 0;
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, files.length, files[i].name);
    try { if (await importFile(files[i])) added++; } catch { /* file non scaricabile */ }
  }
  onProgress?.(files.length, files.length, '');
  return { found: files.length, added };
}

export function deleteTrack(id: string) {
  const t = lib.get().tracks.find(x => x.id === id);
  if (!t) return;
  try { new File(musicDir(), t.file).delete(); } catch { /* già rimosso */ }
  if (t.art) { try { new File(artDir(), t.art).delete(); } catch { /* già rimosso */ } }
  lib.set(s => ({
    tracks: s.tracks.filter(x => x.id !== id),
    playlists: s.playlists.map(p => ({ ...p, ids: p.ids.filter(x => x !== id) })),
  }));
  persist();
}

export const libraryBytes = () => lib.get().tracks.reduce((s, t) => s + t.size, 0);

/* ---------- Playlist ---------- */
export function createPlaylist(name: string, ids: string[] = []) {
  const p: Playlist = { id: newId(), name: name.trim() || `Playlist ${lib.get().playlists.length + 1}`, ids, created: Date.now() };
  lib.set(s => ({ playlists: [...s.playlists, p] }));
  persist();
  return p;
}
export function updatePlaylist(id: string, patch: Partial<Omit<Playlist, 'id'>>) {
  lib.set(s => ({ playlists: s.playlists.map(p => (p.id === id ? { ...p, ...patch } : p)) }));
  persist();
}
export function deletePlaylist(id: string) {
  lib.set(s => ({ playlists: s.playlists.filter(p => p.id !== id) }));
  persist();
}
export function toggleInPlaylist(plId: string, trackId: string) {
  const p = lib.get().playlists.find(x => x.id === plId);
  if (!p) return false;
  const has = p.ids.includes(trackId);
  updatePlaylist(plId, { ids: has ? p.ids.filter(x => x !== trackId) : [...p.ids, trackId] });
  return !has;
}
export const playlistTracks = (p: Playlist, tracks: Track[]) =>
  p.ids.map(id => tracks.find(t => t.id === id)).filter((t): t is Track => !!t);
