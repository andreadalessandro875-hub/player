import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlaylist, setAudioModeAsync, type AudioPlaylist, type AudioPlaylistLoopMode, type AudioPlaylistStatus } from 'expo-audio';
import { artUri, lib, trackUri, type Track } from './library';
import { createStore } from './store';

/* Il motore è la playlist nativa di expo-audio (AVQueuePlayer): il passaggio al brano successivo,
   il loop e i comandi della schermata di blocco funzionano senza passare da JavaScript,
   quindi anche a schermo spento. */

export type LoopMode = 'one' | 'all' | 'off';
const LOOP: Record<LoopMode, AudioPlaylistLoopMode> = { one: 'single', all: 'all', off: 'none' };

export const playback = createStore({
  queue: [] as string[],          // id dei brani nell'ordine di riproduzione
  index: 0,
  currentId: null as string | null,
  playing: false,
  position: 0,
  duration: 0,
  source: null as string | null,  // id della playlist da cui proviene la coda (null = libreria)
  mode: 'one' as LoopMode,
  shuffle: false,
  ab: { a: null as number | null, b: null as number | null },
  sleepAt: 0,
});

let pl: AudioPlaylist | null = null;
const PREFS = 'player.v1';
let lastSave = 0;
let pendingSeek: number | null = null;   // posizione da raggiungere appena il brano è caricato

const trackById = (id: string | null) => lib.get().tracks.find(t => t.id === id);
const shuffled = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const meta = (t: Track) => ({ title: t.title, artist: t.artist, albumTitle: 'Loop', artworkUrl: artUri(t) });

function savePrefs(extra: Record<string, unknown> = {}) {
  const s = playback.get();
  AsyncStorage.setItem(PREFS, JSON.stringify({
    mode: s.mode, shuffle: s.shuffle, source: s.source, queue: s.queue, currentId: s.currentId, position: s.position, ...extra,
  })).catch(() => {});
}

function onStatus(st: AudioPlaylistStatus) {
  if (pendingSeek !== null && st.isLoaded) { const at = pendingSeek; pendingSeek = null; pl?.seekTo(at); return; }
  const s = playback.get();
  const { a, b } = s.ab;
  if (a !== null && b !== null && st.currentTime >= b) pl?.seekTo(a);
  if (s.sleepAt && Date.now() >= s.sleepAt) { pl?.pause(); playback.set({ sleepAt: 0 }); }
  playback.set({ playing: st.playing, position: st.currentTime, duration: st.duration || s.duration });
  if (Date.now() - lastSave > 5000) { lastSave = Date.now(); savePrefs(); }
}

function onTrackChanged({ currentIndex }: { currentIndex: number }) {
  const id = playback.get().queue[currentIndex] ?? null;
  playback.set({ index: currentIndex, currentId: id, ab: { a: null, b: null }, position: 0 });
  const t = trackById(id);
  if (t) pl?.updateLockScreenMetadata(meta(t));
  savePrefs();
}

export async function initPlayer() {
  if (pl) return;
  await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
  let prefs: any = {};
  try { prefs = JSON.parse((await AsyncStorage.getItem(PREFS)) || '{}'); } catch { /* preferenze assenti */ }
  const mode: LoopMode = prefs.mode ?? 'one';
  pl = createAudioPlaylist({ updateInterval: 250, loop: LOOP[mode] });
  pl.addListener('playlistStatusUpdate', onStatus);
  pl.addListener('trackChanged', onTrackChanged);
  playback.set({ mode, shuffle: !!prefs.shuffle });

  // Riprende l'ultima coda in pausa, nella stessa posizione.
  const known = new Set(lib.get().tracks.map(t => t.id));
  const queue: string[] = (prefs.queue ?? []).filter((id: string) => known.has(id));
  if (queue.length && prefs.currentId && known.has(prefs.currentId)) {
    loadQueue(queue, queue.indexOf(prefs.currentId), { source: prefs.source ?? null, autoplay: false, at: prefs.position ?? 0 });
  }
}

function loadQueue(queue: string[], index: number, opts: { source: string | null; autoplay: boolean; at?: number }) {
  if (!pl || !queue.length) return;
  pl.clear();
  for (const id of queue) { const t = trackById(id); if (t) pl.add({ uri: trackUri(t), name: t.title }); }
  const i = Math.max(0, Math.min(index, queue.length - 1));
  pl.skipTo(i);
  pendingSeek = opts.at && opts.at > 1 ? opts.at : null;
  const t = trackById(queue[i]);
  playback.set({ queue, index: i, currentId: queue[i], source: opts.source, ab: { a: null, b: null }, position: opts.at ?? 0, duration: t?.duration ?? 0 });
  if (t) pl.setActiveForLockScreen(true, meta(t), { showNextTrack: true, showPreviousTrack: true });
  if (opts.autoplay) pl.play();
  savePrefs();
}

/** Avvia `startId` dentro la lista `ids` (libreria o playlist). */
export function playList(ids: string[], startId?: string, opts: { source?: string | null; shuffle?: boolean } = {}) {
  if (!ids.length) return;
  const shuffle = opts.shuffle ?? playback.get().shuffle;
  const start = startId ?? (shuffle ? ids[Math.floor(Math.random() * ids.length)] : ids[0]);
  const queue = shuffle ? [start, ...shuffled(ids.filter(id => id !== start))] : ids;
  playback.set({ shuffle });
  loadQueue(queue, queue.indexOf(start), { source: opts.source ?? null, autoplay: true });
}

export function toggle() {
  if (!pl) return;
  if (playback.get().playing) pl.pause(); else pl.play();
}
export const pause = () => pl?.pause();
export function next() { pl?.next(); }
export function previous() {
  if (!pl) return;
  if (playback.get().position > 3) pl.seekTo(0); else pl.previous();
}
export function seek(sec: number) { pl?.seekTo(sec); playback.set({ position: sec }); }

export function setMode(mode: LoopMode) {
  if (pl) pl.loop = LOOP[mode];
  playback.set({ mode });
  savePrefs();
}
export const cycleMode = () => setMode(({ one: 'all', all: 'off', off: 'one' } as const)[playback.get().mode]);

/** Attiva/disattiva la riproduzione casuale tenendo il brano corrente e la sua posizione. */
export function setShuffle(on: boolean) {
  const s = playback.get();
  playback.set({ shuffle: on });
  if (!pl || !s.currentId) { savePrefs(); return; }
  const base = s.source
    ? (lib.get().playlists.find(p => p.id === s.source)?.ids ?? s.queue)
    : lib.get().tracks.map(t => t.id);
  const queue = on ? [s.currentId, ...shuffled(base.filter(id => id !== s.currentId))] : base;
  const wasPlaying = s.playing;
  loadQueue(queue, queue.indexOf(s.currentId), { source: s.source, autoplay: wasPlaying, at: s.position });
}

/** Tocca una volta per fissare A, una seconda per B, una terza per togliere la sezione. */
export function cycleAB(): 'a' | 'b' | 'off' | 'short' {
  const s = playback.get();
  if (s.ab.a === null) { playback.set({ ab: { a: s.position, b: null } }); return 'a'; }
  if (s.ab.b === null) {
    if (s.position - s.ab.a < 1) return 'short';
    playback.set({ ab: { a: s.ab.a, b: s.position } });
    return 'b';
  }
  playback.set({ ab: { a: null, b: null } });
  return 'off';
}

export function setSleep(minutes: number) {
  playback.set({ sleepAt: minutes ? Date.now() + minutes * 60000 : 0 });
}

/** Da chiamare quando un brano viene eliminato dalla libreria. */
export function forgetTrack(id: string) {
  const s = playback.get();
  const i = s.queue.indexOf(id);
  if (i < 0 || !pl) return;
  pl.remove(i);
  const queue = s.queue.filter(x => x !== id);
  if (!queue.length) {
    pl.clearLockScreenControls();
    playback.set({ queue, index: 0, currentId: null, playing: false, position: 0, duration: 0 });
  } else {
    const index = Math.min(i <= s.index ? Math.max(0, s.index - (i < s.index ? 1 : 0)) : s.index, queue.length - 1);
    playback.set({ queue, index, currentId: queue[index] });
  }
  savePrefs();
}
