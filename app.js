'use strict';

/* ================= Utilità ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const CFG = window.LOOP_CONFIG || {};
const root = document.documentElement;
const stage = $('#stage');
const audio = $('#audio');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wait = ms => new Promise(r => setTimeout(r, ms));
const fmt = s => {
  if (!isFinite(s)) return '0:00';
  s = Math.max(0, Math.floor(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const fmtSize = b => b > 1e9 ? (b / 1e9).toFixed(1).replace('.', ',') + ' GB' : (b / 1e6).toFixed(1).replace('.', ',') + ' MB';
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage non disponibile */ } };

const sw = (w, body, extra = '') => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" ${extra}>${body}</svg>`;
const STROKE = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
const LOOP_PATH = '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/>';
const ICONS = {
  search: sw(17, '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', STROKE + ' stroke-width="2.2"'),
  folder: sw(24, '<path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z"/>', STROKE + ' stroke-width="2"'),
  sync: sw(24, '<path d="M21 12a9 9 0 01-15.5 6.2M3 12A9 9 0 0118.5 5.8M18 2v4h-4M6 22v-4h4"/>', STROKE + ' stroke-width="2.2"'),
  music: sw(26, '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>', STROKE + ' stroke-width="2"'),
  musicLg: sw(44, '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>', STROKE + ' stroke-width="1.8"'),
  down: sw(28, '<path d="M6 9l6 6 6-6"/>', STROKE + ' stroke-width="2.6"'),
  moon: sw(22, '<path d="M20.5 13.2A8.5 8.5 0 1110.8 3.5a6.6 6.6 0 009.7 9.7z"/>', STROKE + ' stroke-width="2"'),
  shuffle: sw(20, '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>', STROKE + ' stroke-width="2.3"'),
  loop: sw(22, LOOP_PATH, STROKE + ' stroke-width="2.3"'),
  prev: sw(38, '<path d="M11.5 12L21 5.5v13zM3 12l8.5-6.5v13z"/>', 'fill="currentColor"'),
  next: sw(38, '<path d="M12.5 12L3 5.5v13zM21 12l-8.5-6.5v13z"/>', 'fill="currentColor"'),
  nextSm: sw(26, '<path d="M12.5 12L3 5.5v13zM21 12l-8.5-6.5v13z"/>', 'fill="currentColor"'),
  playLg: sw(50, '<path d="M7 4.5v15a1 1 0 001.5.86l12.4-7.5a1 1 0 000-1.72L8.5 3.64A1 1 0 007 4.5z"/>', 'fill="currentColor"'),
  pauseLg: sw(50, '<rect x="5.5" y="4" width="4.5" height="16" rx="1.2"/><rect x="14" y="4" width="4.5" height="16" rx="1.2"/>', 'fill="currentColor"'),
  playMd: sw(28, '<path d="M7 4.5v15a1 1 0 001.5.86l12.4-7.5a1 1 0 000-1.72L8.5 3.64A1 1 0 007 4.5z"/>', 'fill="currentColor"'),
  pauseMd: sw(28, '<rect x="5.5" y="4" width="4.5" height="16" rx="1.2"/><rect x="14" y="4" width="4.5" height="16" rx="1.2"/>', 'fill="currentColor"'),
  playSm: sw(18, '<path d="M7 4.5v15a1 1 0 001.5.86l12.4-7.5a1 1 0 000-1.72L8.5 3.64A1 1 0 007 4.5z"/>', 'fill="currentColor"'),
  list: sw(26, '<path d="M4 6h11M4 12h11M4 18h6"/><path d="M19 15V5l3 1.2"/><circle cx="17" cy="16" r="2.2"/>', STROKE + ' stroke-width="2"'),
  listAdd: sw(22, '<path d="M4 6h12M4 12h8M4 18h8"/><path d="M18 14v8M14 18h8"/>', STROKE + ' stroke-width="2.2"'),
  plus: sw(24, '<path d="M12 5v14M5 12h14"/>', STROKE + ' stroke-width="2.6"'),
  back: sw(24, '<path d="M15 5l-7 7 7 7"/>', STROKE + ' stroke-width="2.6"'),
  more: sw(26, '<circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/>', 'fill="currentColor"'),
  chev: sw(18, '<path d="M9 5l7 7-7 7"/>', STROKE + ' stroke-width="2.6"'),
  check: sw(18, '<path d="M5 12.5l4.5 4.5L19 7"/>', STROKE + ' stroke-width="3"'),
  up: sw(20, '<path d="M6 15l6-6 6 6"/>', STROKE + ' stroke-width="2.6"'),
  down: sw(20, '<path d="M6 9l6 6 6-6"/>', STROKE + ' stroke-width="2.6"'),
  spinner: '<svg width="28" height="28" viewBox="0 0 28 28">' +
    Array.from({ length: 8 }, (_, i) => `<rect x="12.75" y="2" width="2.5" height="7" rx="1.25" fill="currentColor" opacity="${((i + 1) / 8).toFixed(2)}" transform="rotate(${i * 45} 14 14)"/>`).join('') + '</svg>'
};
const paintIcons = (r = document) => $$('[data-icon]', r).forEach(el => { el.innerHTML = ICONS[el.dataset.icon] || ''; });

// Attiva gli stati :active su iOS.
document.addEventListener('touchstart', () => {}, { passive: true });

/* ================= Haptic e toast ================= */
// Su iOS 18+ il tocco di un interruttore nativo produce una vibrazione leggera.
const hapticLabel = $('#haptic');
function haptic(strong = false) {
  try {
    if (navigator.vibrate) navigator.vibrate(strong ? 18 : 8);
    else hapticLabel.click();
  } catch { /* non supportato */ }
}
let toastTimer = 0;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2300);
}

/* ================= Copertine e colori ================= */
function hashHue(s) {
  let h = 0;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 2246822507) >>> 0;
  return (h ^ (h >>> 16)) % 360;
}
const fallbackArt = id => {
  const h = hashHue(id);
  return `linear-gradient(135deg, hsl(${h} 70% 56%), hsl(${(h + 70) % 360} 62% 38%))`;
};
const artUrls = new Map();
function artUrl(t) {
  if (!t.art) return null;
  if (!artUrls.has(t.id)) artUrls.set(t.id, URL.createObjectURL(t.art));
  return artUrls.get(t.id);
}
function dropArt(id) {
  if (artUrls.has(id)) URL.revokeObjectURL(artUrls.get(id));
  artUrls.delete(id);
  artData.delete(id);
}
const artNode = (t, cls) => {
  const u = artUrl(t);
  return u ? `<img class="${cls}" src="${u}" alt="" decoding="async">` : `<div class="${cls}" style="background:${fallbackArt(t.id)}"></div>`;
};
function rgbToHs(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  if (!d) return { h: 0, s: 0 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: Math.round((h * 60 + 360) % 360), s: Math.round(s * 100) };
}
async function tintFromBlob(blob) {
  const u = URL.createObjectURL(blob);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
    const c = document.createElement('canvas');
    c.width = c.height = 12;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, 12, 12);
    const d = g.getImageData(0, 0, 12, 12).data;
    let r = 0, gg = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const w = 1 + (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2])) / 24; // privilegia i colori saturi
      r += d[i] * w; gg += d[i + 1] * w; b += d[i + 2] * w; n += w;
    }
    return rgbToHs(r / n, gg / n, b / n);
  } catch { return null; } finally { URL.revokeObjectURL(u); }
}
function applyTint(t) {
  const { h, s } = t.tint || { h: hashHue(t.id), s: 60 };
  player.style.setProperty('--tint1', `hsl(${h} ${clamp(s, 25, 70)}% 36%)`);
  player.style.setProperty('--tint2', `hsl(${(h + 24) % 360} ${clamp(s, 20, 60)}% 17%)`);
}
const artData = new Map();
const blobToDataURL = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = () => r(null); fr.readAsDataURL(b); });
async function artworkFor(t) {
  if (t.art) {
    if (!artData.has(t.id)) artData.set(t.id, await blobToDataURL(t.art));
    const d = artData.get(t.id);
    if (d) return [{ src: d, sizes: '512x512', type: t.art.type || 'image/jpeg' }];
  }
  const h = hashHue(t.id), c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, `hsl(${h} 70% 56%)`);
  grad.addColorStop(1, `hsl(${(h + 70) % 360} 62% 38%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  return [{ src: c.toDataURL('image/png'), sizes: '512x512', type: 'image/png' }];
}

/* ================= Lettura tag (ID3 e MP4) ================= */
const latin1 = b => String.fromCharCode(...b);
const syncsafe = (b, o) => (b[o] & 0x7f) << 21 | (b[o + 1] & 0x7f) << 14 | (b[o + 2] & 0x7f) << 7 | (b[o + 3] & 0x7f);
function decodeText(data) {
  const enc = data[0];
  let bytes = data.subarray(1), label = 'iso-8859-1';
  if (enc === 1) label = bytes[0] === 0xFE && bytes[1] === 0xFF ? 'utf-16be' : 'utf-16le';
  else if (enc === 2) label = 'utf-16be';
  else if (enc === 3) label = 'utf-8';
  try { return new TextDecoder(label).decode(bytes).replace(/^﻿/, '').split('\0')[0].trim(); } catch { return ''; }
}
function parsePic(data, ver) {
  const enc = data[0];
  let i, mime;
  if (ver === 2) {
    mime = latin1(data.subarray(1, 4)).toUpperCase() === 'PNG' ? 'image/png' : 'image/jpeg';
    i = 4;
  } else {
    i = 1;
    while (i < data.length && data[i] !== 0) i++;
    mime = latin1(data.subarray(1, i)).toLowerCase() || 'image/jpeg';
    if (!mime.includes('/')) mime = 'image/' + (mime === 'png' ? 'png' : 'jpeg');
    i++;
  }
  i++; // tipo di immagine
  if (enc === 1 || enc === 2) { while (i + 1 < data.length && !(data[i] === 0 && data[i + 1] === 0)) i += 2; i += 2; }
  else { while (i < data.length && data[i] !== 0) i++; i++; }
  return i < data.length ? new Blob([data.slice(i)], { type: mime }) : null;
}
async function readID3(blob, head) {
  const ver = head[3], flags = head[5], size = syncsafe(head, 6);
  const buf = new Uint8Array(await blob.slice(10, 10 + size).arrayBuffer());
  const dv = new DataView(buf.buffer);
  const out = {};
  let p = 0;
  if (flags & 0x40 && ver > 2) p = ver === 4 ? syncsafe(buf, 0) : dv.getUint32(0) + 4;
  const idLen = ver === 2 ? 3 : 4, hdrLen = ver === 2 ? 6 : 10;
  while (p + hdrLen < buf.length) {
    const id = latin1(buf.subarray(p, p + idLen));
    if (!/^[A-Z0-9]+$/.test(id)) break;
    const fsize = ver === 2 ? (buf[p + 3] << 16 | buf[p + 4] << 8 | buf[p + 5]) : ver === 4 ? syncsafe(buf, p + 4) : dv.getUint32(p + 4);
    const start = p + hdrLen, end = start + fsize;
    if (fsize <= 0 || end > buf.length) break;
    const data = buf.subarray(start, end);
    if (id === 'TIT2' || id === 'TT2') out.title = decodeText(data);
    else if (id === 'TPE1' || id === 'TP1') out.artist = decodeText(data);
    else if ((id === 'APIC' || id === 'PIC') && !out.art) out.art = parsePic(data, ver);
    p = end;
  }
  return out;
}
function mp4Atoms(buf, start, end) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), out = [];
  let p = start;
  while (p + 8 <= end) {
    const size = dv.getUint32(p);
    if (size < 8 || p + size > end) break;
    out.push({ type: latin1(buf.subarray(p + 4, p + 8)), start: p + 8, end: p + size });
    p += size;
  }
  return out;
}
async function readMP4(blob) {
  let off = 0, moov = null;
  while (off + 8 <= blob.size) {
    const h = new DataView(await blob.slice(off, off + 16).arrayBuffer());
    let size = h.getUint32(0), hdr = 8;
    const type = String.fromCharCode(h.getUint8(4), h.getUint8(5), h.getUint8(6), h.getUint8(7));
    if (size === 1) { size = Number(h.getBigUint64(8)); hdr = 16; } else if (size === 0) size = blob.size - off;
    if (size < 8) break;
    if (type === 'moov') { moov = new Uint8Array(await blob.slice(off + hdr, off + size).arrayBuffer()); break; }
    off += size;
  }
  if (!moov) return {};
  const find = (atoms, type) => atoms.find(a => a.type === type);
  const top = mp4Atoms(moov, 0, moov.length);
  const udta = find(top, 'udta');
  let meta = udta && find(mp4Atoms(moov, udta.start, udta.end), 'meta');
  meta = meta || find(top, 'meta');
  if (!meta) return {};
  const ilst = find(mp4Atoms(moov, meta.start + 4, meta.end), 'ilst');
  if (!ilst) return {};
  const out = {}, dv = new DataView(moov.buffer);
  for (const item of mp4Atoms(moov, ilst.start, ilst.end)) {
    const data = find(mp4Atoms(moov, item.start, item.end), 'data');
    if (!data) continue;
    const kind = dv.getUint32(data.start) & 0xffffff, payload = moov.subarray(data.start + 8, data.end);
    if (item.type === '©nam') out.title = new TextDecoder().decode(payload).trim();
    else if (item.type === '©ART') out.artist = new TextDecoder().decode(payload).trim();
    else if (item.type === 'covr') out.art = new Blob([payload.slice()], { type: kind === 14 ? 'image/png' : 'image/jpeg' });
  }
  return out;
}
async function readTags(blob, filename) {
  try {
    const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
    if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) return await readID3(blob, head);
    if (latin1(head.subarray(4, 8)) === 'ftyp' || /\.(m4a|mp4|aac)$/i.test(filename)) return await readMP4(blob);
  } catch { /* tag illeggibili: si usa il nome del file */ }
  return {};
}

/* ================= Database (IndexedDB) ================= */
let dbp;
function db() {
  dbp = dbp || new Promise((res, rej) => {
    const r = indexedDB.open('loop-player', 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('tracks', { keyPath: 'id' });
      r.result.createObjectStore('blobs');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const done = t => new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); });
async function dbAll() { return req((await db()).transaction('tracks').objectStore('tracks').getAll()); }
async function dbBlob(id) { return req((await db()).transaction('blobs').objectStore('blobs').get(id)); }
async function dbPutMeta(meta) { const t = (await db()).transaction('tracks', 'readwrite'); t.objectStore('tracks').put(meta); return done(t); }
async function dbPut(meta, blob) {
  const t = (await db()).transaction(['tracks', 'blobs'], 'readwrite');
  t.objectStore('tracks').put(meta);
  t.objectStore('blobs').put(blob, meta.id);
  return done(t);
}
async function dbDelete(id) {
  const t = (await db()).transaction(['tracks', 'blobs'], 'readwrite');
  t.objectStore('tracks').delete(id);
  t.objectStore('blobs').delete(id);
  return done(t);
}

/* ================= Stato ================= */
const state = {
  tracks: [],
  order: [],
  current: null,
  mode: lsGet('mode', 'one'),        // 'one' | 'all' | 'off'
  shuffle: lsGet('shuffle', false),
  ab: { a: null, b: null },
  query: '',
  editing: false,
  sleepAt: 0,
  playlists: lsGet('playlists', []),
  queue: { pl: lsGet('queuePl', null) },   // playlist da cui proviene la coda (null = libreria)
  plView: null,
  plEdit: false
};
const currentTrack = () => state.tracks.find(t => t.id === state.current);
const sortTracks = () => state.tracks.sort((a, b) => a.title.localeCompare(b.title, 'it', { sensitivity: 'base' }));

function sourceIds() {
  const all = state.tracks.map(t => t.id), p = getPl(state.queue.pl);
  if (p) { const ids = p.ids.filter(id => all.includes(id)); if (ids.length) return ids; }
  state.queue.pl = null;
  return all;
}
function renderSource() {
  const p = getPl(state.queue.pl);
  $('#player .eyebrow').textContent = p ? 'DA ' + p.name.toUpperCase() : 'IN RIPRODUZIONE';
  lsSet('queuePl', p ? p.id : null);
}
function rebuildOrder(keepCurrent = true) {
  const ids = sourceIds();
  if (state.shuffle) {
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    const k = ids.indexOf(state.current);
    if (keepCurrent && k > 0) { ids.splice(k, 1); ids.unshift(state.current); }
  }
  state.order = ids;
  if (state.current) prefetchNext();
}
function parseName(filename) {
  const base = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
  const m = base.match(/^(.+?)\s+-\s+(.+)$/);
  return m ? { artist: m[1].trim(), title: m[2].trim() } : { artist: 'Artista sconosciuto', title: base };
}
function readDuration(blob) {
  return new Promise(res => {
    const a = new Audio(), u = URL.createObjectURL(blob);
    let fired = false;
    const end = d => { if (fired) return; fired = true; URL.revokeObjectURL(u); a.removeAttribute('src'); res(d); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => end(isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => end(0);
    setTimeout(() => end(0), 6000);
    a.src = u;
  });
}
async function addTrack({ id, filename, blob, driveId }) {
  const tags = await readTags(blob, filename);
  const byName = parseName(filename);
  const meta = {
    id, filename, v: 2,
    title: tags.title || byName.title,
    artist: tags.artist || byName.artist,
    art: tags.art || null,
    size: blob.size, driveId: driveId || null, addedAt: Date.now(),
    duration: await readDuration(blob)
  };
  meta.tint = meta.art ? await tintFromBlob(meta.art) : null;
  await dbPut(meta, blob);
  state.tracks.push(meta);
  sortTracks();
  return meta;
}
// Aggiorna i brani importati con la versione precedente (copertine e tag).
async function migrateTags() {
  let changed = false;
  for (const t of state.tracks.filter(x => x.v !== 2)) {
    const blob = await dbBlob(t.id);
    if (!blob) continue;
    const tags = await readTags(blob, t.filename);
    if (tags.title) t.title = tags.title;
    if (tags.artist) t.artist = tags.artist;
    if (tags.art) { t.art = tags.art; t.tint = await tintFromBlob(t.art); }
    t.v = 2;
    await dbPutMeta(t);
    changed = true;
  }
  if (!changed) return;
  sortTracks();
  renderLibrary();
  const t = currentTrack();
  if (t) applyTrackUI(t);
}

/* ================= Navigazione ================= */
let activeView = $('#view-library');
const ptr = $('#ptr');
let ptrArmed = false, ptrBusy = false, touching = false, navTick = false;

const VIEW_TITLES = { library: 'Libreria', playlists: 'Playlist', playlist: 'Playlist', sync: 'Sincronizza' };
function go(name) {
  const next = $('#view-' + name);
  if (next === activeView) { next.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  closeRow();
  activeView.classList.remove('active', 'enter', 'enter-r');
  next.classList.add('active');
  next.classList.remove('enter', 'enter-r');
  void next.offsetWidth;
  next.classList.add(name === 'playlist' ? 'enter-r' : 'enter');
  activeView = next;
  const tab = name === 'playlist' ? 'playlists' : name;
  $$('.tab').forEach(t => {
    const on = t.dataset.go === tab;
    t.classList.toggle('active', on);
    on ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current');
  });
  $('#nav-title').textContent = name === 'playlist' ? (getPl(state.plView)?.name || 'Playlist') : VIEW_TITLES[name];
  if (name === 'playlist') next.scrollTop = 0;
  if (name === 'playlists') renderPlaylists({ animate: true });
  updateNav();
  if (name === 'sync') renderSync();
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-go]');
  if (t) { haptic(); go(t.dataset.go); }
});
function updateNav() {
  const st = activeView.scrollTop;
  stage.style.setProperty('--nav', clamp((st - 30) / 20, 0, 1).toFixed(3));
  if (activeView.id !== 'view-library' || ptrBusy) return;
  const pull = Math.max(0, -st);  // su iOS lo scroll diventa negativo durante il rimbalzo
  ptr.style.opacity = clamp((pull - 12) / 50, 0, 1).toFixed(2);
  ptr.style.transform = `rotate(${pull * 4}deg)`;
  if (pull > 80 && touching) ptrArmed = true;
  else if (pull < 30 && touching) ptrArmed = false;
}
$$('.view').forEach(v => v.addEventListener('scroll', () => {
  if (navTick) return;
  navTick = true;
  requestAnimationFrame(() => { navTick = false; updateNav(); });
}, { passive: true }));
const libView = $('#view-library');
libView.addEventListener('touchstart', () => { touching = true; }, { passive: true });
libView.addEventListener('touchend', () => {
  touching = false;
  if (ptrArmed) { ptrArmed = false; pullSync(); }
}, { passive: true });

/* ================= Elenchi di brani (libreria e playlist) ================= */
const list = $('#track-list');
const plList = $('#pl-list');
let openRow = null, lastSwipe = 0;
const DEL_W = 88;

function rowHtml(t, i, o = {}) {
  const id = esc(t.id), del = o.delLabel || 'Elimina';
  return `
    <div class="row-wrap${o.animate ? ' in' : ''}" data-id="${id}" style="--i:${Math.min(i, 14)}">
      <button class="row-del" data-del="${id}" tabindex="-1" aria-hidden="true">${del}</button>
      <button class="row-main" data-play="${id}">
        ${artNode(t, 'art-sm')}
        <span class="row-text"><span class="title">${esc(t.title)}</span><span class="sub">${esc(t.artist)}</span></span>
        <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="dur">${t.duration ? fmt(t.duration) : ''}</span>
      </button>
      ${o.reorder ? `<span class="mv">
        <button data-mv="up" data-id="${id}" aria-label="Sposta su"${i === 0 ? ' disabled' : ''}>${ICONS.up}</button>
        <button data-mv="down" data-id="${id}" aria-label="Sposta giù"${i === o.count - 1 ? ' disabled' : ''}>${ICONS.down}</button>
      </span>` : ''}
      <button class="edit-del" data-del="${id}" aria-label="${del} ${esc(t.title)}"><span></span></button>
    </div>`;
}
function markPlaying() {
  $$('.row-main').forEach(el => {
    const on = el.dataset.play === state.current;
    el.classList.toggle('playing', on);
    el.classList.toggle('paused', on && audio.paused);
  });
}
function closeRow(row = openRow) {
  if (!row) return;
  const main = $('.row-main', row);
  main.style.transform = '';
  // Nasconde lo sfondo rosso solo a fine animazione di chiusura.
  setTimeout(() => { if (row !== openRow && !main.classList.contains('dragging')) row.classList.remove('swiping'); }, 450);
  if (row === openRow) openRow = null;
}
async function collapseRow(wrap) {
  if (!wrap) return;
  $('.row-main', wrap).style.transform = 'translate3d(-100%,0,0)';
  wrap.style.height = wrap.offsetHeight + 'px';
  void wrap.offsetHeight;
  wrap.classList.add('removing');
  wrap.style.height = '0px';
  await wait(340);
}

// Gesti comuni: tocco, scorrimento a sinistra per eliminare, pressione lunga per il menu.
function bindList(el, cfg) {
  let swp = null, hold = 0;
  const clearHold = () => { clearTimeout(hold); hold = 0; };
  el.addEventListener('click', e => {
    if (performance.now() - lastSwipe < 350) return;
    const mv = e.target.closest('[data-mv]');
    if (mv) { cfg.onMove(mv.dataset.id, mv.dataset.mv); return; }
    const del = e.target.closest('[data-del]');
    if (del) { cfg.onDelete(del.dataset.del); return; }
    const row = e.target.closest('[data-play]');
    if (!row) return;
    if (openRow) { closeRow(); return; }
    if (cfg.editing()) return;
    haptic();
    cfg.onPlay(row.dataset.play);
  });
  el.addEventListener('pointerdown', e => {
    const wrap = e.target.closest('.row-wrap');
    if (!wrap || cfg.editing() || e.target.closest('.row-del') || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (openRow && openRow !== wrap) closeRow();
    swp = { wrap, main: $('.row-main', wrap), x0: e.clientX, y0: e.clientY, base: wrap === openRow ? -DEL_W : 0, x: 0, on: false, id: e.pointerId };
    clearHold();
    if (cfg.onHold) {
      hold = setTimeout(() => {
        hold = 0;
        if (!swp || swp.on) return;
        swp = null;
        lastSwipe = performance.now();
        haptic(true);
        cfg.onHold(wrap.dataset.id);
      }, 520);
    }
  });
  el.addEventListener('pointermove', e => {
    if (!swp || e.pointerId !== swp.id) return;
    const dx = e.clientX - swp.x0, dy = e.clientY - swp.y0;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearHold();
    if (!swp.on) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swp.on = true;
        swp.wrap.classList.add('swiping');
        swp.main.classList.add('dragging');
        try { swp.main.setPointerCapture(e.pointerId); } catch { /* già rilasciato */ }
      } else if (Math.abs(dy) > 10) { swp = null; return; } else return;
    }
    let x = swp.base + dx;
    if (x > 0) x *= 0.15;
    swp.x = x;
    swp.main.style.transform = `translate3d(${x}px,0,0)`;
  });
  const end = cancel => {
    clearHold();
    if (!swp) return;
    const s = swp;
    swp = null;
    if (!s.on) return;
    lastSwipe = performance.now();
    s.main.classList.remove('dragging');
    const w = s.wrap.offsetWidth;
    if (!cancel && s.x < -w * 0.55) { haptic(true); cfg.onDelete(s.wrap.dataset.id); return; }
    if (!cancel && s.x < -DEL_W / 2) { s.main.style.transform = `translate3d(${-DEL_W}px,0,0)`; openRow = s.wrap; haptic(); }
    else closeRow(s.wrap);
  };
  el.addEventListener('pointerup', () => end(false));
  el.addEventListener('pointercancel', () => end(true));
}
document.addEventListener('pointerdown', e => { if (openRow && !openRow.contains(e.target)) closeRow(); }, true);

/* ---------- Libreria ---------- */
function renderLibrary({ animate = false } = {}) {
  const q = state.query.trim().toLowerCase();
  const items = state.tracks.filter(t => !q || (t.title + ' ' + t.artist).toLowerCase().includes(q));
  const has = state.tracks.length > 0;
  if (!has) state.editing = false;
  $('#empty').hidden = has;
  $('#lib-tools').hidden = !has;
  $('#btn-edit').hidden = !has;
  $('#btn-edit').textContent = state.editing ? 'Fine' : 'Modifica';
  list.classList.toggle('editing', state.editing);
  openRow = null;
  list.innerHTML = q && !items.length
    ? `<p class="no-results">Nessun risultato per “${esc(state.query)}”</p>`
    : items.map((t, i) => rowHtml(t, i, { animate })).join('');
  const total = state.tracks.reduce((s, t) => s + (t.duration || 0), 0);
  const n = state.tracks.length;
  $('#count').textContent = has ? `${n} ${n === 1 ? 'brano' : 'brani'} · ${Math.max(1, Math.round(total / 60))} min` : '';
  markPlaying();
}
$('#search').addEventListener('input', e => { state.query = e.target.value; renderLibrary(); });
$('#search').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
$('#btn-edit').addEventListener('click', () => { state.editing = !state.editing; haptic(); renderLibrary(); });
$('#btn-playall').addEventListener('click', () => {
  if (!state.tracks.length) return;
  haptic();
  state.queue.pl = null;
  setShuffle(false, true);
  load(state.order[0]);
});
$('#btn-shuffleall').addEventListener('click', () => {
  if (!state.tracks.length) return;
  haptic();
  state.queue.pl = null;
  state.shuffle = true;
  lsSet('shuffle', true);
  rebuildOrder(false);
  renderShuffle();
  load(state.order[0]);
  toast('Riproduzione casuale');
});

// Avvia un brano scegliendo da dove proviene la coda (libreria o playlist).
function playFrom(id, plId = null) {
  state.queue.pl = plId;
  state.current = id;
  rebuildOrder(true);
  load(id);
}
bindList(list, {
  editing: () => state.editing,
  onPlay: id => {
    if (id === state.current) { if (audio.paused) audio.play(); openPlayer(); return; }
    playFrom(id, null);
  },
  onDelete: id => deleteTrack(id),
  onHold: async id => {
    const t = state.tracks.find(x => x.id === id);
    if (!t) return;
    const k = await actionSheet(t.title, [
      { k: 'pl', label: 'Aggiungi a una playlist…' },
      { k: 'del', label: 'Elimina dalla libreria', danger: true }
    ]);
    if (k === 'pl') addToPlaylistFlow(id);
    else if (k === 'del') deleteTrack(id);
  }
});

async function deleteTrack(id) {
  const t = state.tracks.find(x => x.id === id);
  if (!t) return;
  await collapseRow($(`#track-list .row-wrap[data-id="${CSS.escape(id)}"]`));
  if (id === state.current) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    state.current = null;
    lsSet('last', null);
    closePlayer();
    showMini(false);
  }
  await dbDelete(id);
  dropArt(id);
  state.tracks = state.tracks.filter(x => x.id !== id);
  state.playlists.forEach(p => { p.ids = p.ids.filter(x => x !== id); });
  savePlaylists();
  rebuildOrder();
  renderLibrary();
  if (activeView.id === 'view-playlist') renderPlaylistDetail();
  toast('Brano eliminato');
}

/* ================= Playlist ================= */
const savePlaylists = () => lsSet('playlists', state.playlists);
const getPl = id => state.playlists.find(p => p.id === id);
const plTracks = p => p.ids.map(id => state.tracks.find(t => t.id === id)).filter(Boolean);
const plCount = n => `${n} ${n === 1 ? 'brano' : 'brani'}`;
function plMeta(p) {
  const ts = plTracks(p), min = Math.round(ts.reduce((s, t) => s + (t.duration || 0), 0) / 60);
  return plCount(ts.length) + (ts.length ? ` · ${Math.max(1, min)} min` : '');
}
function plCover(p) {
  const ts = plTracks(p);
  if (!ts.length) return `<div class="pl-cover empty">${ICONS.list}</div>`;
  if (ts.length < 4) return `<div class="pl-cover single">${artNode(ts[0], 'art-fill')}</div>`;
  return `<div class="pl-cover">${ts.slice(0, 4).map(t => artNode(t, 'art-fill')).join('')}</div>`;
}
function pruneLists() {
  const all = new Set(state.tracks.map(t => t.id));
  state.playlists.forEach(p => { p.ids = p.ids.filter(id => all.has(id)); });
  savePlaylists();
}
function renderPlaylists({ animate = false } = {}) {
  const has = state.playlists.length > 0;
  $('#pl-empty').hidden = has;
  $('#pl-grid').innerHTML = !has ? '' :
    `<button class="pl-row pl-new tap" id="row-newpl"><div class="pl-cover empty">${ICONS.plus}</div><span class="row-text"><span class="title" style="color:var(--accent)">Nuova playlist</span></span></button>` +
    state.playlists.map((p, i) => `
      <button class="pl-row${animate ? ' in' : ''}${state.queue.pl === p.id && state.current ? ' playing' : ''}" data-pl="${esc(p.id)}" style="--i:${Math.min(i, 14)}">
        ${plCover(p)}
        <span class="row-text"><span class="title">${esc(p.name)}</span><span class="sub">${plMeta(p)}</span></span>
        <span class="pl-chev">${ICONS.chev}</span>
      </button>`).join('');
}
function renderPlaylistDetail({ animate = false } = {}) {
  const p = getPl(state.plView);
  if (!p) { go('playlists'); return; }
  const ts = plTracks(p), has = ts.length > 0;
  if (!has) state.plEdit = false;
  $('#pl-title').textContent = p.name;
  $('#nav-title').textContent = p.name;
  $('#pl-meta').textContent = plMeta(p);
  $('#pl-tools').hidden = !has;
  $('#btn-pl-edit').hidden = !has;
  $('#btn-pl-edit').textContent = state.plEdit ? 'Fine' : 'Modifica';
  plList.classList.toggle('editing', state.plEdit);
  openRow = null;
  plList.innerHTML = ts.map((t, i) => rowHtml(t, i, { animate, delLabel: 'Rimuovi', reorder: true, count: ts.length })).join('');
  markPlaying();
}
function openPlaylist(id) {
  state.plView = id;
  state.plEdit = false;
  renderPlaylistDetail({ animate: true });
  go('playlist');
}
// Da chiamare dopo ogni modifica al contenuto di una playlist.
function afterPlaylistChange(id) {
  savePlaylists();
  renderPlaylists();
  if (state.plView === id && activeView.id === 'view-playlist') renderPlaylistDetail();
  if (state.queue.pl === id) rebuildOrder();
}

function playPlaylist(id, shuffle) {
  const p = getPl(id);
  if (!p || !plTracks(p).length) { toast('La playlist è vuota'); return; }
  state.queue.pl = id;
  state.shuffle = shuffle;
  lsSet('shuffle', shuffle);
  rebuildOrder(false);
  renderShuffle();
  load(state.order[0]);
  if (shuffle) toast('Riproduzione casuale');
}
async function createPlaylist(ids = []) {
  const name = await promptName({ title: 'Nuova playlist', msg: 'Dai un nome alla playlist.', ok: 'Crea', value: '' });
  if (name === null) return null;
  const p = { id: crypto.randomUUID(), name: name || `Playlist ${state.playlists.length + 1}`, ids: [...ids], created: Date.now() };
  state.playlists.push(p);
  savePlaylists();
  renderPlaylists();
  return p;
}
async function newPlaylistFromView() {
  const p = await createPlaylist();
  if (!p) return;
  openPlaylist(p.id);
  if (state.tracks.length) setTimeout(() => openPicker(p.id), 350);
}
$('#btn-newpl').addEventListener('click', () => { haptic(); newPlaylistFromView(); });
$('#btn-newpl2').addEventListener('click', () => { haptic(); newPlaylistFromView(); });
$('#pl-grid').addEventListener('click', e => {
  if (e.target.closest('#row-newpl')) { haptic(); newPlaylistFromView(); return; }
  const row = e.target.closest('[data-pl]');
  if (row) { haptic(); openPlaylist(row.dataset.pl); }
});
$('#btn-pl-edit').addEventListener('click', () => { state.plEdit = !state.plEdit; haptic(); renderPlaylistDetail(); });
$('#btn-pl-play').addEventListener('click', () => { haptic(); playPlaylist(state.plView, false); });
$('#btn-pl-shuffle').addEventListener('click', () => { haptic(); playPlaylist(state.plView, true); });
$('#btn-pl-add').addEventListener('click', () => { haptic(); openPicker(state.plView); });
$('#btn-pl-more').addEventListener('click', async () => {
  const p = getPl(state.plView);
  if (!p) return;
  haptic();
  const k = await actionSheet(p.name, [
    { k: 'add', label: 'Aggiungi brani' },
    { k: 'ren', label: 'Rinomina playlist' },
    { k: 'del', label: 'Elimina playlist', danger: true }
  ]);
  if (k === 'add') openPicker(p.id);
  else if (k === 'ren') {
    const name = await promptName({ title: 'Rinomina playlist', msg: '', ok: 'Salva', value: p.name });
    if (name) { p.name = name; savePlaylists(); renderPlaylistDetail(); renderPlaylists(); if (state.queue.pl === p.id) renderSource(); }
  } else if (k === 'del') {
    const c = await actionSheet(`Eliminare “${p.name}”? I brani restano nella libreria.`, [{ k: 'ok', label: 'Elimina playlist', danger: true }]);
    if (c !== 'ok') return;
    state.playlists = state.playlists.filter(x => x.id !== p.id);
    savePlaylists();
    if (state.queue.pl === p.id) { state.queue.pl = null; rebuildOrder(); renderSource(); }
    go('playlists');
    toast('Playlist eliminata');
  }
});
bindList(plList, {
  editing: () => state.plEdit,
  onPlay: id => {
    const p = getPl(state.plView);
    if (!p) return;
    if (id === state.current && state.queue.pl === p.id) { if (audio.paused) audio.play(); openPlayer(); return; }
    playFrom(id, p.id);
  },
  onDelete: async id => {
    const p = getPl(state.plView);
    if (!p) return;
    await collapseRow($(`#pl-list .row-wrap[data-id="${CSS.escape(id)}"]`));
    p.ids = p.ids.filter(x => x !== id);
    afterPlaylistChange(p.id);
    toast('Rimosso dalla playlist');
  },
  onMove: (id, dir) => {
    const p = getPl(state.plView);
    if (!p) return;
    const i = p.ids.indexOf(id), j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= p.ids.length) return;
    [p.ids[i], p.ids[j]] = [p.ids[j], p.ids[i]];
    haptic();
    afterPlaylistChange(p.id);
  },
  onHold: async id => {
    const p = getPl(state.plView), t = state.tracks.find(x => x.id === id);
    if (!p || !t) return;
    const k = await actionSheet(t.title, [{ k: 'rm', label: 'Rimuovi dalla playlist', danger: true }]);
    if (k === 'rm') {
      await collapseRow($(`#pl-list .row-wrap[data-id="${CSS.escape(id)}"]`));
      p.ids = p.ids.filter(x => x !== id);
      afterPlaylistChange(p.id);
    }
  }
});

// Aggiunge (o toglie) un brano da una playlist: dal player o con pressione lunga in libreria.
async function addToPlaylistFlow(trackId) {
  if (!trackId) return;
  const k = await actionSheet('Aggiungi a una playlist', [
    { k: '__new', label: 'Nuova playlist…' },
    ...state.playlists.map(p => ({ k: p.id, label: p.name, check: p.ids.includes(trackId) }))
  ]);
  if (!k) return;
  if (k === '__new') {
    const p = await createPlaylist([trackId]);
    if (p) toast(`Aggiunto a “${p.name}”`);
    return;
  }
  const p = getPl(k);
  if (!p) return;
  if (p.ids.includes(trackId)) { p.ids = p.ids.filter(x => x !== trackId); toast(`Rimosso da “${p.name}”`); }
  else { p.ids.push(trackId); toast(`Aggiunto a “${p.name}”`); }
  afterPlaylistChange(p.id);
}
$('#btn-addpl').addEventListener('click', () => { haptic(); addToPlaylistFlow(state.current); });

/* ---------- Selettore dei brani da aggiungere ---------- */
const picker = $('#picker');
let pk = null;
function openPicker(plId) {
  const p = getPl(plId);
  if (!p) return;
  if (!state.tracks.length) { toast('Aggiungi prima dei brani alla libreria'); return; }
  pk = { id: plId, sel: new Set(p.ids) };
  $('#pk-title').textContent = p.name;
  $('#pk-list').innerHTML = state.tracks.map(t => `
    <button class="pick-row${pk.sel.has(t.id) ? ' sel' : ''}" data-id="${esc(t.id)}" role="checkbox" aria-checked="${pk.sel.has(t.id)}">
      ${artNode(t, 'art-sm')}
      <span class="row-text"><span class="title">${esc(t.title)}</span><span class="sub">${esc(t.artist)}</span></span>
      <span class="check">${ICONS.check}</span>
    </button>`).join('');
  $('#pk-list').scrollTop = 0;
  picker.setAttribute('aria-hidden', 'false');
  void picker.offsetWidth;
  picker.classList.add('show');
}
function closePicker() {
  if (!pk) return;
  pk = null;
  picker.classList.remove('show');
  picker.setAttribute('aria-hidden', 'true');
}
$('#pk-list').addEventListener('click', e => {
  const r = e.target.closest('.pick-row');
  if (!r || !pk) return;
  const id = r.dataset.id, on = !pk.sel.has(id);
  on ? pk.sel.add(id) : pk.sel.delete(id);
  r.classList.toggle('sel', on);
  r.setAttribute('aria-checked', String(on));
  haptic();
});
$('#pk-cancel').addEventListener('click', closePicker);
$('#pk-done').addEventListener('click', () => {
  if (!pk) return;
  const p = getPl(pk.id);
  if (p) {
    const kept = p.ids.filter(id => pk.sel.has(id));
    const added = state.tracks.map(t => t.id).filter(id => pk.sel.has(id) && !p.ids.includes(id));
    const removed = p.ids.length - kept.length;
    p.ids = [...kept, ...added];
    afterPlaylistChange(p.id);
    haptic();
    if (added.length) toast(`${added.length} ${added.length === 1 ? 'brano aggiunto' : 'brani aggiunti'}`);
    else if (removed) toast(`${removed} ${removed === 1 ? 'brano rimosso' : 'brani rimossi'}`);
  }
  closePicker();
});

/* ---------- Dialogo con campo di testo (stile iOS) ---------- */
const dlg = $('#dlg');
function promptName({ title, msg, ok, value }) {
  return new Promise(res => {
    const form = $('#dlg-form'), inp = $('#dlg-input');
    $('#dlg-title').textContent = title;
    $('#dlg-msg').textContent = msg || '';
    $('#dlg-ok').textContent = ok;
    inp.value = value || '';
    dlg.hidden = false;
    void dlg.offsetWidth;
    dlg.classList.add('show');
    setTimeout(() => { inp.focus(); inp.select(); }, 140);
    const finish = v => {
      dlg.classList.remove('show');
      setTimeout(() => { dlg.hidden = true; }, 300);
      inp.blur();
      form.onsubmit = null;
      dlg.onclick = null;
      $('#dlg-cancel').onclick = null;
      res(v);
    };
    form.onsubmit = e => { e.preventDefault(); finish(inp.value.trim()); };
    $('#dlg-cancel').onclick = () => finish(null);
    dlg.onclick = e => { if (e.target === dlg) finish(null); };
  });
}

/* ================= Player ================= */
const player = $('#player');
const coverWrap = $('#cover-wrap');
const els = { fill: $('#fill'), miniBar: $('#mini-bar'), cur: $('#t-cur'), rem: $('#t-rem'), scrub: $('#scrubber'), track: $('#scrubber .track') };
let objUrl = null, lastSec = -1, raf = 0, lastSave = 0;

// Il brano successivo viene preparato in anticipo: così, quando finisce il corrente (anche a schermo
// spento), si può cambiare sorgente e riprodurre subito, senza attese asincrone che iOS può sospendere.
let pre = null, preTok = 0;
const dropPre = () => { if (pre) URL.revokeObjectURL(pre.url); pre = null; };
async function prefetchNext() {
  const ord = state.order, cur = state.current, tok = ++preTok;
  if (!cur || ord.length < 2) { dropPre(); return; }
  let n = ord.indexOf(cur) + 1;
  if (n >= ord.length) n = 0;
  const id = ord[n];
  if (pre && pre.id === id) return;
  dropPre();
  let blob = null;
  try { blob = await dbBlob(id); } catch { /* archivio non disponibile */ }
  if (!blob || tok !== preTok) return;
  pre = { id, url: URL.createObjectURL(blob) };
}
function startTrack(t, url, { autoplay = true, at = 0, dir = 0 } = {}) {
  if (objUrl && objUrl !== url) URL.revokeObjectURL(objUrl);
  objUrl = url;
  state.current = t.id;
  state.ab = { a: null, b: null };
  audio.src = url;
  audio.loop = state.mode === 'one';
  if (autoplay) audio.play().catch(() => { /* serve un tocco dell'utente */ });
  if (at > 0) audio.addEventListener('loadedmetadata', () => { audio.currentTime = Math.min(at, audio.duration - 1 || 0); paintProgress(); }, { once: true });
  lastSec = -1;
  renderSource();
  applyTrackUI(t, dir);
  renderAB();
  markPlaying();
  showMini(true);
  updateMediaMeta(t);
  lsSet('last', { id: t.id, t: at });
  paintProgress();
  prefetchNext();
}
async function load(id, opts = {}) {
  const t = state.tracks.find(x => x.id === id);
  if (!t) return;
  let url;
  if (pre && pre.id === id) { url = pre.url; pre = null; }   // già pronto: parte in modo sincrono
  else {
    const blob = await dbBlob(id);
    if (!blob) { toast('File del brano non trovato'); return; }
    url = URL.createObjectURL(blob);
  }
  startTrack(t, url, opts);
}
function applyTrackUI(t, dir = 0) {
  $('#p-title').textContent = t.title;
  $('#p-artist').textContent = t.artist;
  $('#mini-title').textContent = t.title;
  $('#mini-artist').textContent = t.artist;
  $('#cover').innerHTML = artNode(t, 'art-fill');
  $('#mini-art').innerHTML = artNode(t, 'art-xs');
  applyTint(t);
  coverWrap.classList.remove('in-left', 'in-right', 'in');
  void coverWrap.offsetWidth;
  coverWrap.classList.add(dir > 0 ? 'in-right' : dir < 0 ? 'in-left' : 'in');
}
function step(dir, auto = false) {
  const ord = state.order;
  if (!ord.length) return;
  let n = ord.indexOf(state.current) + dir;
  if (n >= ord.length) {
    if (auto && state.mode === 'off') { audio.pause(); audio.currentTime = 0; return; }
    n = 0;
  }
  if (n < 0) n = ord.length - 1;
  load(ord[n], { dir });
}
function prev() {
  if (audio.currentTime > 3) { audio.currentTime = 0; paintProgress(); } else step(-1);
}
function togglePlay() {
  if (!state.current) { if (state.order.length) load(state.order[0]); return; }
  audio.paused ? audio.play().catch(() => {}) : audio.pause();
}

function renderPlayState() {
  const playing = !audio.paused;
  for (const b of [$('#btn-play'), $('#mini-toggle')]) {
    b.classList.toggle('is-playing', playing);
    b.setAttribute('aria-label', playing ? 'Pausa' : 'Play');
  }
  player.classList.toggle('paused', !playing);
  markPlaying();
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}
function paintProgress(c = audio.currentTime) {
  const d = audio.duration, ok = isFinite(d) && d > 0, p = ok ? clamp(c / d, 0, 1) : 0;
  els.fill.style.transform = `scaleX(${p})`;
  els.miniBar.style.transform = `scaleX(${p})`;
  const s = Math.floor(c);
  if (s !== lastSec) {
    lastSec = s;
    els.cur.textContent = fmt(c);
    els.rem.textContent = '-' + fmt(ok ? Math.ceil(d - c) : 0);
    els.scrub.setAttribute('aria-valuemax', ok ? Math.round(d) : 0);
    els.scrub.setAttribute('aria-valuenow', s);
    els.scrub.setAttribute('aria-valuetext', `${fmt(c)} di ${fmt(d)}`);
  }
}
function checkAB() {
  const { a, b } = state.ab;
  if (a !== null && b !== null && audio.currentTime >= b) audio.currentTime = a;
}
// Avanzamento fluido a 60 fps quando l'app è in primo piano.
function tick() {
  raf = 0;
  if (!scrubbing) paintProgress();
  checkAB();
  if (!audio.paused && !document.hidden) raf = requestAnimationFrame(tick);
}
const startTick = () => { if (!raf) raf = requestAnimationFrame(tick); };

audio.addEventListener('play', () => { renderPlayState(); startTick(); });
audio.addEventListener('pause', () => { renderPlayState(); paintProgress(); });
audio.addEventListener('loadedmetadata', () => { lastSec = -1; paintProgress(); renderAB(); });
audio.addEventListener('seeked', () => { if (!scrubbing) paintProgress(); });
audio.addEventListener('error', () => { if (audio.getAttribute('src')) toast('Impossibile riprodurre questo file'); });
audio.addEventListener('ended', () => {
  if (state.mode === 'all') step(1, true);
  else if (state.mode === 'off') step(1, true);
});
// timeupdate continua anche a schermo spento: qui si gestiscono A–B, timer e salvataggio.
audio.addEventListener('timeupdate', () => {
  checkAB();
  checkSleep();
  if (document.hidden) paintProgress();
  const d = audio.duration;
  if ('mediaSession' in navigator && isFinite(d) && d > 0) {
    try { navigator.mediaSession.setPositionState({ duration: d, position: Math.min(audio.currentTime, d), playbackRate: audio.playbackRate || 1 }); } catch { /* non supportato */ }
  }
  const now = Date.now();
  if (now - lastSave > 4000 && state.current) { lastSave = now; lsSet('last', { id: state.current, t: audio.currentTime }); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) { paintProgress(); startTick(); renderSleep(); } });

/* --- Barra di avanzamento trascinabile --- */
let scrubbing = false, sc = null;
els.scrub.addEventListener('pointerdown', e => {
  if (!state.current || !isFinite(audio.duration)) return;
  els.scrub.setPointerCapture(e.pointerId);
  const r = els.track.getBoundingClientRect();
  sc = { x0: e.clientX, t0: audio.currentTime, w: r.width, left: r.left, moved: false, val: audio.currentTime };
  scrubbing = true;
  els.scrub.classList.add('active');
});
els.scrub.addEventListener('pointermove', e => {
  if (!sc) return;
  const dx = e.clientX - sc.x0;
  if (Math.abs(dx) > 4) sc.moved = true;
  if (!sc.moved) return;
  sc.val = clamp(sc.t0 + dx / sc.w * audio.duration, 0, audio.duration);
  paintProgress(sc.val);
});
els.scrub.addEventListener('pointerup', e => {
  if (!sc) return;
  if (!sc.moved) sc.val = clamp((e.clientX - sc.left) / sc.w, 0, 1) * audio.duration;
  audio.currentTime = sc.val;
  paintProgress(sc.val);
  sc = null;
  scrubbing = false;
  els.scrub.classList.remove('active');
});
els.scrub.addEventListener('pointercancel', () => { sc = null; scrubbing = false; els.scrub.classList.remove('active'); paintProgress(); });
els.scrub.addEventListener('keydown', e => {
  if (!state.current) return;
  const d = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
  if (d === undefined && e.key !== 'Home') return;
  e.preventDefault();
  audio.currentTime = e.key === 'Home' ? 0 : clamp(audio.currentTime + d, 0, audio.duration || 0);
  paintProgress();
});

/* --- Apertura del player e trascinamento --- */
let sheetOpen = false;
const setSheet = p => root.style.setProperty('--sheet', p.toFixed(4));
function openPlayer() {
  if (!state.current || sheetOpen) return;
  sheetOpen = true;
  closeRow();
  player.classList.add('live');
  player.setAttribute('aria-hidden', 'false');
  stage.inert = true;
  void player.offsetWidth;   // applica lo stato iniziale prima di animare
  setSheet(1);
  lastSec = -1;
  paintProgress();
  startTick();
  setTimeout(() => $('#btn-close').focus({ preventScroll: true }), 300);
}
function closePlayer() {
  if (!sheetOpen) return;
  sheetOpen = false;
  setSheet(0);
  player.setAttribute('aria-hidden', 'true');
  stage.inert = false;
  setTimeout(() => { if (!sheetOpen) player.classList.remove('live'); }, 520);
}
$('#btn-close').addEventListener('click', () => { haptic(); closePlayer(); });

let pd = null;
player.addEventListener('pointerdown', e => {
  if (e.target.closest('button, .scrubber') || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const now = performance.now();
  pd = { x0: e.clientX, y0: e.clientY, mode: null, id: e.pointerId, onCover: !!e.target.closest('.cover-wrap'),
    h: player.offsetHeight, lastY: e.clientY, lastT: now, vy: 0 };
});
player.addEventListener('pointermove', e => {
  if (!pd || e.pointerId !== pd.id) return;
  const dx = e.clientX - pd.x0, dy = e.clientY - pd.y0;
  if (!pd.mode) {
    if (dy > 6 && dy > Math.abs(dx)) { pd.mode = 'v'; document.body.classList.add('dragging'); }
    else if (pd.onCover && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) { pd.mode = 'h'; coverWrap.classList.add('dragging'); }
    else if (Math.abs(dx) > 6 || dy < -6) { pd = null; return; }
    else return;
    try { player.setPointerCapture(e.pointerId); } catch { /* già rilasciato */ }
  }
  if (pd.mode === 'v') {
    const now = performance.now();
    pd.vy = (e.clientY - pd.lastY) / Math.max(1, now - pd.lastT);
    pd.lastY = e.clientY;
    pd.lastT = now;
    setSheet(1 - Math.max(0, dy) / pd.h);
  } else {
    coverWrap.style.transform = `translate3d(${dx}px,0,0) rotate(${dx / 40}deg)`;
    coverWrap.style.opacity = String(1 - Math.min(0.5, Math.abs(dx) / 500));
  }
});
function endDrag(e, cancel) {
  if (!pd) return;
  const p = pd;
  pd = null;
  if (!p.mode) return;
  const dx = e.clientX - p.x0, dy = e.clientY - p.y0;
  if (p.mode === 'v') {
    document.body.classList.remove('dragging');
    if (!cancel && (dy > p.h * 0.22 || p.vy > 0.55)) closePlayer(); else setSheet(1);
  } else {
    coverWrap.classList.remove('dragging');
    coverWrap.style.transform = '';
    coverWrap.style.opacity = '';
    if (!cancel && Math.abs(dx) > 70) { haptic(); dx < 0 ? step(1) : step(-1); }
  }
}
player.addEventListener('pointerup', e => endDrag(e, false));
player.addEventListener('pointercancel', e => endDrag(e, true));

$('#btn-play').addEventListener('click', () => { haptic(); togglePlay(); });
$('#btn-prev').addEventListener('click', () => { haptic(); prev(); });
$('#btn-next').addEventListener('click', () => { haptic(); step(1); });

/* --- Loop, casuale, A–B --- */
let loopRot = 0;
function renderLoop() {
  const m = state.mode, b = $('#btn-loop');
  b.classList.toggle('on', m !== 'off');
  b.classList.toggle('one-on', m === 'one');
  const txt = m === 'one' ? 'Loop brano' : m === 'all' ? 'Loop tutti' : 'Loop spento';
  $('#loop-text').textContent = txt;
  b.setAttribute('aria-label', txt + ', tocca per cambiare');
}
$('#btn-loop').addEventListener('click', () => {
  state.mode = state.mode === 'one' ? 'all' : state.mode === 'all' ? 'off' : 'one';
  lsSet('mode', state.mode);
  audio.loop = state.mode === 'one';
  loopRot += 180;
  $('#btn-loop svg').style.transform = `rotate(${loopRot}deg)`;
  haptic();
  renderLoop();
});
function renderShuffle() {
  const b = $('#btn-shuffle');
  b.classList.toggle('on', state.shuffle);
  b.setAttribute('aria-pressed', String(state.shuffle));
}
function setShuffle(on, fromStart = false) {
  state.shuffle = on;
  lsSet('shuffle', on);
  rebuildOrder(!fromStart);
  renderShuffle();
}
$('#btn-shuffle').addEventListener('click', () => {
  haptic();
  setShuffle(!state.shuffle);
  toast(state.shuffle ? 'Riproduzione casuale attiva' : 'Riproduzione in ordine');
});
function renderAB() {
  const { a, b } = state.ab, d = audio.duration;
  $('#btn-ab').classList.toggle('on', a !== null);
  const zone = $('#ab-zone'), ready = a !== null && b !== null && isFinite(d) && d > 0;
  zone.hidden = !ready;
  if (ready) { zone.style.left = (a / d * 100) + '%'; zone.style.width = ((b - a) / d * 100) + '%'; }
  $('#ab-text').textContent =
    a === null ? 'Tocca A–B per fissare l’inizio della sezione'
      : b === null ? `A: ${fmt(a)} · tocca A–B per fissare la fine`
        : `Sezione ${fmt(a)} → ${fmt(b)} · tocca A–B per rimuoverla`;
}
$('#btn-ab').addEventListener('click', () => {
  if (!state.current) return;
  const s = state.ab;
  if (s.a === null) s.a = audio.currentTime;
  else if (s.b === null) {
    if (audio.currentTime - s.a < 1) { toast('Sezione troppo corta'); return; }
    s.b = audio.currentTime;
  } else state.ab = { a: null, b: null };
  haptic();
  renderAB();
});

/* --- Timer di spegnimento --- */
let sleepTimer = 0, sleepIv = 0;
function setSleep(min) {
  clearTimeout(sleepTimer);
  state.sleepAt = min ? Date.now() + min * 60000 : 0;
  if (min) sleepTimer = setTimeout(checkSleep, min * 60000 + 250);
  renderSleep();
  toast(min ? `La musica si fermerà tra ${min >= 60 ? (min / 60 + '').replace('.', ',') + (min === 60 ? ' ora' : ' ore') : min + ' minuti'}` : 'Timer disattivato');
}
function checkSleep() {
  if (state.sleepAt && Date.now() >= state.sleepAt) { state.sleepAt = 0; audio.pause(); renderSleep(); }
}
function renderSleep() {
  const on = !!state.sleepAt, left = on ? Math.max(1, Math.ceil((state.sleepAt - Date.now()) / 60000)) : 0;
  const b = $('#btn-timer');
  b.classList.toggle('on', on);
  $('#timer-left').textContent = on ? left + '′' : '';
  b.setAttribute('aria-label', on ? `Timer attivo, ${left} minuti rimanenti` : 'Timer di spegnimento');
  clearInterval(sleepIv);
  if (on) sleepIv = setInterval(renderSleep, 15000);
}
/* --- Menu a comparsa dal basso (action sheet) --- */
const sheetEl = $('#action-sheet'), backdrop = $('#sheet-backdrop');
let sheetDone = null;
function actionSheet(title, items) {
  return new Promise(res => {
    if (sheetDone) sheetDone(null);
    $('#as-title').textContent = title || '';
    $('#as-title').hidden = !title;
    $('#as-items').innerHTML = items.map(it =>
      `<button data-k="${esc(it.k)}"${it.danger ? ' class="danger"' : ''}><span>${esc(it.label)}</span>${it.check ? `<span class="ck">${ICONS.check}</span>` : ''}</button>`).join('');
    backdrop.hidden = false;
    sheetEl.hidden = false;
    void sheetEl.offsetWidth;
    backdrop.classList.add('show');
    sheetEl.classList.add('show');
    sheetDone = k => {
      sheetDone = null;
      backdrop.classList.remove('show');
      sheetEl.classList.remove('show');
      setTimeout(() => { if (!sheetDone) { backdrop.hidden = true; sheetEl.hidden = true; } }, 420);
      res(k);
    };
  });
}
backdrop.addEventListener('click', () => sheetDone && sheetDone(null));
$('#as-cancel').addEventListener('click', () => sheetDone && sheetDone(null));
$('#as-items').addEventListener('click', e => {
  const b = e.target.closest('[data-k]');
  if (!b || !sheetDone) return;
  haptic();
  sheetDone(b.dataset.k);
});
$('#btn-timer').addEventListener('click', async () => {
  haptic();
  const items = [15, 30, 45, 60, 90].map(m => ({ k: String(m), label: m === 60 ? '1 ora' : m === 90 ? '1 ora e mezza' : m + ' minuti' }));
  if (state.sleepAt) items.push({ k: '0', label: 'Disattiva timer', danger: true });
  const k = await actionSheet('Interrompi la riproduzione tra', items);
  if (k !== null) setSleep(+k);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!dlg.hidden) $('#dlg-cancel').click();
  else if (sheetDone) sheetDone(null);
  else if (pk) closePicker();
  else if (sheetOpen) closePlayer();
});

/* --- Mini player --- */
const mini = $('#mini');
let miniSwipe = 0, my = null;
function showMini(on) {
  if (on) {
    if (!mini.hidden && mini.classList.contains('show')) return;
    mini.hidden = false;
    void mini.offsetWidth;
    mini.classList.add('show');
  } else {
    mini.classList.remove('show');
    setTimeout(() => { if (!state.current) mini.hidden = true; }, 600);
  }
}
$('#mini-open').addEventListener('click', () => { if (performance.now() - miniSwipe < 400) return; haptic(); openPlayer(); });
$('#mini-toggle').addEventListener('click', () => { haptic(); togglePlay(); });
$('#mini-next').addEventListener('click', () => { haptic(); step(1); });
mini.addEventListener('pointerdown', e => { my = { y: e.clientY }; });
mini.addEventListener('pointerup', e => {
  if (my && e.clientY - my.y < -24) { miniSwipe = performance.now(); haptic(); openPlayer(); }
  my = null;
});

/* --- Controlli dal Lock Screen --- */
function initMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const set = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch { /* azione non supportata */ } };
  set('play', () => audio.play());
  set('pause', () => audio.pause());
  set('previoustrack', prev);
  set('nexttrack', () => step(1));
  set('seekto', d => { audio.currentTime = d.seekTime; paintProgress(); });
}
async function updateMediaMeta(t) {
  if (!('mediaSession' in navigator)) return;
  const artwork = await artworkFor(t);
  if (state.current !== t.id) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: 'Loop Player', artwork });
}

/* ================= Importazione manuale ================= */
$('#btn-import').addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', async e => {
  const files = [...e.target.files];
  e.target.value = '';
  if (!files.length) return;
  toast(files.length === 1 ? 'Importazione in corso…' : `Importazione di ${files.length} brani…`);
  let n = 0;
  for (const f of files) {
    if (state.tracks.some(t => t.filename === f.name && t.size === f.size)) continue;
    try { await addTrack({ id: crypto.randomUUID(), filename: f.name, blob: f }); n++; } catch { /* file non salvabile */ }
  }
  rebuildOrder();
  go('library');
  renderLibrary({ animate: true });
  renderStorage();
  haptic();
  toast(n ? `${n} ${n === 1 ? 'brano aggiunto' : 'brani aggiunti'}` : 'Nessun brano nuovo');
});

/* ================= Google Drive ================= */
const drive = { token: null, exp: 0, client: null, remote: [], progress: {}, stats: null, busy: false };
const savedToken = lsGet('gtoken', null);
if (savedToken && savedToken.exp > Date.now()) { drive.token = savedToken.t; drive.exp = savedToken.exp; }
const tokenValid = () => !!drive.token && Date.now() < drive.exp;
const loadScript = src => new Promise((res, rej) => {
  if ($(`script[src="${src}"]`)) return res();
  const s = document.createElement('script');
  s.src = src;
  s.onload = res;
  s.onerror = () => rej(new Error('Impossibile caricare l’accesso Google (sei offline?)'));
  document.head.appendChild(s);
});
async function authorize() {
  if (tokenValid()) return drive.token;
  await loadScript('https://accounts.google.com/gsi/client');
  return new Promise((res, rej) => {
    drive.client = drive.client || google.accounts.oauth2.initTokenClient({
      client_id: CFG.GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: () => {}
    });
    drive.client.callback = r => {
      if (r.error) return rej(new Error('Accesso Google annullato o negato'));
      drive.token = r.access_token;
      drive.exp = Date.now() + (r.expires_in - 60) * 1000;
      lsSet('gtoken', { t: drive.token, exp: drive.exp });
      res(drive.token);
    };
    drive.client.error_callback = e => rej(new Error('Accesso Google non riuscito (' + (e.type || 'errore') + ')'));
    drive.client.requestAccessToken({ prompt: '' });
  });
}
async function gfetch(url) {
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + drive.token } });
  if (!r.ok) {
    let why = '';
    try { const j = await r.json(); why = j.error.errors?.[0]?.reason || j.error.status || j.error.message || ''; } catch { /* corpo non leggibile */ }
    if (r.status === 401 || r.status === 403) { drive.token = null; lsSet('gtoken', null); }
    if (r.status === 401) throw new Error('Accesso Google scaduto: tocca di nuovo Sincronizza ora');
    throw new Error('Google Drive ha risposto ' + r.status + (why ? ' (' + why + ')' : ''));
  }
  return r;
}
async function listRemote() {
  const name = (CFG.DRIVE_FOLDER_NAME || 'Loop Player').replace(/'/g, "\\'");
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const fol = await (await gfetch('https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=' + encodeURIComponent(q))).json();
  if (!fol.files.length) throw new Error(`Cartella “${CFG.DRIVE_FOLDER_NAME}” non trovata su Google Drive`);
  // Esplora tutte le cartelle con quel nome e le loro sottocartelle.
  const files = [], queue = fol.files.map(f => f.id), seen = new Set();
  while (queue.length) {
    const folderId = queue.shift();
    if (seen.has(folderId)) continue;
    seen.add(folderId);
    let pageToken = '';
    do {
      const fq = `'${folderId}' in parents and trashed=false`;
      const u = 'https://www.googleapis.com/drive/v3/files?pageSize=1000&fields=nextPageToken,files(id,name,size,mimeType)&q=' +
        encodeURIComponent(fq) + (pageToken ? '&pageToken=' + pageToken : '');
      const page = await (await gfetch(u)).json();
      for (const f of page.files) {
        if (f.mimeType === 'application/vnd.google-apps.folder') queue.push(f.id);
        else files.push(f);
      }
      pageToken = page.nextPageToken || '';
    } while (pageToken);
  }
  const audioFiles = files.filter(f => (f.mimeType || '').startsWith('audio/') || /\.(mp3|m4a|aac|wav|flac|ogg|opus|aif|aiff|mp4)$/i.test(f.name));
  drive.stats = { total: files.length, audio: audioFiles.length, others: files.filter(f => !audioFiles.includes(f)).slice(0, 3).map(f => f.name) };
  return audioFiles;
}
async function download(f, onProgress) {
  const r = await gfetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`);
  const total = +f.size || +r.headers.get('Content-Length') || 0;
  const reader = r.body.getReader(), chunks = [];
  let got = 0;
  for (;;) {
    const { done: end, value } = await reader.read();
    if (end) break;
    chunks.push(value);
    got += value.length;
    if (total) onProgress(got / total);
  }
  return new Blob(chunks, { type: f.mimeType || 'audio/mpeg' });
}
// Restituisce il numero di brani nuovi scaricati, oppure -1 in caso di errore.
async function syncNow() {
  const btn = $('#btn-sync'), err = $('#sync-error');
  if (drive.busy) return 0;
  err.hidden = true;
  if (!CFG.GOOGLE_CLIENT_ID) {
    err.textContent = 'Sincronizzazione non configurata: inserisci il Client ID in config.js (vedi README). Intanto puoi aggiungere file a mano.';
    err.hidden = false;
    return -1;
  }
  drive.busy = true;
  btn.disabled = true;
  btn.classList.add('loading');
  $('#sync-label').textContent = 'Sincronizzazione…';
  let added = 0;
  try {
    await authorize();
    drive.remote = await listRemote();
    const st = drive.stats;
    $('#sync-sub').textContent = `Drive: ${st.audio} file audio su ${st.total} trovati`;
    if (!st.audio) {
      err.textContent = st.total
        ? `Nella cartella ci sono file ma nessuno riconosciuto come audio (es. ${st.others.join(', ')}).`
        : `La cartella “${CFG.DRIVE_FOLDER_NAME}” è vuota o i file non sono ancora stati caricati su Drive.`;
      err.hidden = false;
    }
    const have = new Set(state.tracks.map(t => t.driveId).filter(Boolean));
    const fresh = drive.remote.filter(f => !have.has(f.id));
    drive.progress = Object.fromEntries(fresh.map(f => [f.id, { pct: 0, st: 'In coda', file: f }]));
    renderSync();
    for (const f of fresh) {
      drive.progress[f.id].st = '0%';
      renderSyncProgress();
      try {
        const blob = await download(f, p => { drive.progress[f.id].pct = p; drive.progress[f.id].st = Math.round(p * 100) + '%'; renderSyncProgress(); });
        await addTrack({ id: 'd_' + f.id, filename: f.name, blob, driveId: f.id });
        drive.progress[f.id] = { pct: 1, st: 'Scaricato', file: f, done: true };
        added++;
      } catch {
        drive.progress[f.id] = { pct: 0, st: 'Errore', file: f };
      }
      renderSyncProgress();
    }
    lsSet('lastSync', Date.now());
    if (added) { rebuildOrder(); renderLibrary({ animate: true }); }
    return added;
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
    return -1;
  } finally {
    drive.busy = false;
    btn.disabled = false;
    btn.classList.remove('loading');
    $('#sync-label').textContent = 'Sincronizza ora';
    renderSync();
  }
}
$('#btn-sync').addEventListener('click', async () => {
  haptic();
  const n = await syncNow();
  if (n > 0) toast(`${n} ${n === 1 ? 'nuovo brano' : 'nuovi brani'}`);
  else if (n === 0 && drive.stats?.audio) toast('Libreria già aggiornata');
});
$('#auto-sync').addEventListener('change', e => { haptic(); lsSet('autoSync', e.target.checked); });
async function pullSync() {
  if (ptrBusy) return;
  if (!CFG.GOOGLE_CLIENT_ID) { toast('Sincronizzazione non configurata'); return; }
  ptrBusy = true;
  ptr.style.transform = '';
  ptr.classList.add('refreshing');
  haptic();
  const n = await syncNow();
  ptr.classList.remove('refreshing');
  ptr.style.opacity = '0';
  ptrBusy = false;
  toast(n > 0 ? `${n} ${n === 1 ? 'nuovo brano' : 'nuovi brani'}` : n === 0 ? 'Libreria già aggiornata' : 'Sincronizzazione non riuscita');
}

function renderSyncProgress() {
  $$('[data-pid]').forEach(el => {
    const p = drive.progress[el.dataset.pid];
    if (!p) return;
    $('.bar > div', el).style.width = (p.pct * 100) + '%';
    $('.st', el).textContent = p.st;
    el.classList.toggle('done', !!p.done);
  });
}
function renderSync() {
  const entries = Object.entries(drive.progress);
  $('#new-title').hidden = !entries.length;
  $('#new-title').textContent = `Nuovi brani trovati · ${entries.length}`;
  $('#sync-list').innerHTML = entries.map(([id, p], i) => `
    <div class="sync-item${p.done ? ' done' : ''}" data-pid="${esc(id)}" style="animation-delay:${Math.min(i, 10) * 30}ms">
      <div class="art" style="background:${fallbackArt('d_' + id)}"></div>
      <div class="grow"><span>${esc(p.file.name)}</span><div class="bar"><div style="width:${p.pct * 100}%"></div></div></div>
      <span class="st">${esc(p.st)}</span>
    </div>`).join('');
  const ok = tokenValid();
  $('#sync-badge').textContent = ok ? 'Collegata' : CFG.GOOGLE_CLIENT_ID ? 'Da collegare' : 'Non configurata';
  $('#sync-badge').classList.toggle('on', ok);
  $('#folder-name').textContent = `Cartella “${CFG.DRIVE_FOLDER_NAME || 'Loop Player'}”`;
  const last = lsGet('lastSync', 0);
  $('#last-sync').textContent = (last ? new Date(last).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : 'mai') +
    ` · ${state.tracks.length} brani sul telefono`;
  $('#auto-sync').checked = lsGet('autoSync', false);
  renderStorage();
}
async function renderStorage() {
  const used = state.tracks.reduce((s, t) => s + t.size, 0);
  let quota = 0;
  try { quota = (await navigator.storage.estimate()).quota || 0; } catch { /* non disponibile */ }
  $('#storage-text').textContent = fmtSize(used) + ' di musica';
  $('#storage-bar').style.width = quota ? Math.max(used ? 1 : 0, Math.min(100, used / quota * 100)) + '%' : '0%';
}

/* ================= Avvio ================= */
(async function init() {
  paintIcons();
  initMediaSession();
  try { state.tracks = await dbAll(); } catch { toast('Archivio del telefono non disponibile'); }
  sortTracks();
  pruneLists();
  rebuildOrder();
  renderLibrary({ animate: true });
  renderPlaylists();
  renderSource();
  renderLoop();
  renderShuffle();
  renderSleep();
  renderPlayState();
  const last = lsGet('last', null);
  if (last && state.tracks.some(t => t.id === last.id)) await load(last.id, { autoplay: false, at: last.t || 0 });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) toast('Nuova versione pronta: riapri l’app');
      hadController = true;
    });
  }
  setTimeout(migrateTags, 1200);
  if (lsGet('autoSync', false) && CFG.GOOGLE_CLIENT_ID && tokenValid()) {
    const n = await syncNow();
    if (n > 0) toast(`${n} ${n === 1 ? 'nuovo brano' : 'nuovi brani'}`);
  }
})();
