import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import { createStore } from './store';

/* Scheda di allenamento: sezione indipendente dalla musica.
   Per cambiare la scheda modifica l'elenco GYM_PLAN. */

export type Exercise = { n: string; s: number; r: string; rest: number; note: string };
export type GymDay = { key: string; day: string; tag: string; title: string; desc: string; ex: Exercise[] };

// Rotazione: si alternano i giorni nell'ordine dell'elenco.
export const GYM_PLAN: GymDay[] = [
  {
    key: 'g1', day: 'Upper 1', tag: 'Spinta', title: 'Upper Body',
    desc: 'Spinta orizzontale/inclinata + trazione orizzontale.',
    ex: [
      { n: 'Panca Piana con Manubri', s: 4, r: '6-8', rest: 150, note: 'Esercizio cardine di spinta orizzontale per il petto e i tricipiti.' },
      { n: 'Rematore su panca inclinata (manubri o bilanciere)', s: 4, r: '8-10', rest: 120, note: 'Trazione orizzontale per lo spessore della schiena, isolando la lombare.' },
      { n: 'Chest Press Inclinata (macchina o manubri su panca inclinata)', s: 3, r: '8-10', rest: 105, note: 'Focus sulla parte clavicolare/alta del petto.' },
      { n: 'Pulley basso (triangolo o sbarra stretta)', s: 3, r: '10-12', rest: 90, note: 'Trazione orizzontale complementare per il gran dorsale e romboidi.' },
      { n: 'Shoulder Press a macchina', s: 3, r: '8-10', rest: 105, note: 'Spinta verticale per i deltoidi anteriori e laterali.' },
      { n: 'Alzate laterali con manubri', s: 3, r: '12-15', rest: 60, note: 'Isolamento puro per il capo laterale del deltoide.' },
    ],
  },
  {
    key: 'l1', day: 'Lower 1', tag: 'Quadricipiti', title: 'Quadricipiti + Bicipiti',
    desc: 'Focus quadricipiti con richiamo femorali, poi bicipiti.',
    ex: [
      { n: 'Squat con Bilanciere (o Hack Squat)', s: 4, r: '6-8', rest: 150, note: 'Quadricipiti, carico pesante.' },
      { n: 'Leg Press 45°', s: 3, r: '10-12', rest: 120, note: 'Quadricipiti.' },
      { n: 'Affondi camminati con manubri', s: 3, r: '12 passi totali', rest: 90, note: 'Quadricipiti e glutei.' },
      { n: 'Leg Curl seduto o sdraiato (richiamo)', s: 3, r: '12-15', rest: 75, note: 'Femorali: focus su contrazione e pompaggio, senza sfinirsi.' },
      { n: 'Curl con Bilanciere EZ', s: 3, r: '10-12', rest: 75, note: 'Bicipiti.' },
      { n: 'Hammer Curl con manubri', s: 3, r: '12', rest: 75, note: 'Bicipiti.' },
      { n: 'Calf Machine seduto', s: 4, r: '15', rest: 60, note: 'Polpacci.' },
    ],
  },
  {
    key: 'g2', day: 'Upper 2', tag: 'Dorso', title: 'Upper Body',
    desc: 'Senza bicipiti e tricipiti.',
    ex: [
      { n: 'Lat Machine (presa larga o inversa) o Trazioni alla sbarra', s: 4, r: '8-10', rest: 120, note: 'Trazione verticale fondamentale per la larghezza del dorso.' },
      { n: 'Panca Inclinata con Bilanciere o Chest Press orizzontale a macchina', s: 3, r: '8-10', rest: 120, note: "Variazione dell'angolo di spinta rispetto alla panca piana con manubri dell'Upper 1." },
      { n: 'Rematore con Bilanciere a busto flesso o T-Bar Row', s: 3, r: '8-10', rest: 105, note: 'Trazione orizzontale pesante per lo spessore della schiena.' },
      { n: 'Lento Avanti con Manubri da seduto', s: 3, r: '8-10', rest: 105, note: "Spinta verticale libera per le spalle, diversa dalla shoulder press a macchina dell'Upper 1." },
      { n: 'Croci ai cavi alti o bassi o Pectoral Machine', s: 3, r: '12-15', rest: 75, note: 'Isolamento del petto in allungamento/contrazione.' },
      { n: 'Face Pull ai cavi o Reverse Fly (alzate posteriori a 90°)', s: 3, r: '12-15', rest: 60, note: 'Cuffia dei rotatori e deltoidi posteriori per postura e salute della spalla.' },
    ],
  },
  {
    key: 'l2', day: 'Lower 2', tag: 'Femorali', title: 'Femorali/Glutei + Tricipiti',
    desc: 'Focus femorali e glutei con richiamo quadricipiti, poi tricipiti.',
    ex: [
      { n: 'Stacco Rumeno (bilanciere o manubri)', s: 4, r: '8', rest: 150, note: 'Femorali, carico pesante.' },
      { n: 'Hip Thrust', s: 3, r: '8-10', rest: 120, note: 'Glutei e femorali.' },
      { n: 'Bulgarian Split Squat', s: 3, r: '10 per gamba', rest: 90, note: 'Femorali e glutei.' },
      { n: 'Leg Extension (richiamo)', s: 3, r: '12-15', rest: 75, note: 'Quadricipiti: isolamento puro per rifinire e pompare il muscolo a fine seduta.' },
      { n: 'Pushdown ai cavi con corda', s: 3, r: '10-12', rest: 75, note: 'Tricipiti.' },
      { n: 'French Press con manubri su panca', s: 3, r: '10-12', rest: 75, note: 'Tricipiti.' },
      { n: 'Calf Machine in piedi', s: 4, r: '12', rest: 60, note: 'Polpacci.' },
    ],
  },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type GymData = {
  done: Record<string, Record<string, 1>>;   // giorno → "esercizio-serie" spuntate
  doneDate: Record<string, string>;          // giorno → data delle spunte (si azzerano il giorno dopo)
  kg: Record<string, string>;                // esercizio → ultimo peso usato
  last?: { key: string; date: string };      // ultimo allenamento, per proporre il giorno successivo
};

export const gym = createStore({
  data: { done: {}, doneDate: {}, kg: {} } as GymData,
  rest: null as null | { end: number; total: number; label: string },
});

const KEY = 'gym.v1';
const save = () => { AsyncStorage.setItem(KEY, JSON.stringify(gym.get().data)).catch(() => {}); };

export async function loadGym() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) gym.set({ data: { done: {}, doneDate: {}, kg: {}, ...JSON.parse(raw) } });
  } catch { /* dati assenti */ }
}

/** Serie spuntate oggi per un giorno della scheda. */
export function doneFor(data: GymData, key: string): Record<string, 1> {
  return data.doneDate[key] === today() ? data.done[key] ?? {} : {};
}

/** Giorno proposto: oggi resta quello già iniziato, altrimenti il successivo della rotazione. */
export function suggestedDay(data: GymData) {
  const i = data.last ? GYM_PLAN.findIndex(p => p.key === data.last!.key) : -1;
  if (i < 0) return GYM_PLAN[0].key;
  if (data.last!.date === today()) return data.last!.key;
  return GYM_PLAN[(i + 1) % GYM_PLAN.length].key;
}

export function toggleSet(dayKey: string, id: string) {
  const data = gym.get().data;
  const cur = { ...doneFor(data, dayKey) };
  const on = !cur[id];
  if (on) cur[id] = 1; else delete cur[id];
  gym.set({
    data: {
      ...data,
      done: { ...data.done, [dayKey]: cur },
      doneDate: { ...data.doneDate, [dayKey]: today() },
      last: on ? { key: dayKey, date: today() } : data.last,
    },
  });
  save();
  return on;
}

export function resetDay(dayKey: string) {
  const data = gym.get().data;
  gym.set({ data: { ...data, done: { ...data.done, [dayKey]: {} } } });
  save();
}

export function setKg(exercise: string, value: string) {
  const data = gym.get().data;
  const kg = { ...data.kg };
  if (value) kg[exercise] = value; else delete kg[exercise];
  gym.set({ data: { ...data, kg } });
  save();
}

/* ---------- Timer di recupero ---------- */
let restTimer: ReturnType<typeof setInterval> | null = null;
let onRestDone: (() => void) | null = null;
const ding = createAudioPlayer(require('../../assets/sounds/rest-done.wav'));

export function startRest(seconds: number, label: string, done?: () => void) {
  onRestDone = done ?? null;
  gym.set({ rest: { end: Date.now() + seconds * 1000, total: seconds, label } });
  if (restTimer) clearInterval(restTimer);
  restTimer = setInterval(checkRest, 250);
}
export function adjustRest(deltaSec: number) {
  const r = gym.get().rest;
  if (!r) return;
  const end = Math.max(Date.now(), r.end + deltaSec * 1000);
  gym.set({ rest: { ...r, end, total: Math.max(r.total, Math.ceil((end - Date.now()) / 1000)) } });
}
export function stopRest(finished = false) {
  if (restTimer) clearInterval(restTimer);
  restTimer = null;
  if (!gym.get().rest) return;
  gym.set({ rest: null });
  if (finished) {
    try { ding.seekTo(0); ding.play(); } catch { /* audio non disponibile */ }
    onRestDone?.();
  }
}
function checkRest() {
  const r = gym.get().rest;
  if (r && Date.now() >= r.end) stopRest(true);
}
