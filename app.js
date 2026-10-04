'use strict';

/* ---------- utilità ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const CFG = window.LOOP_CONFIG || {};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = s => {
  if (!isFinite(s)) return '0:00';
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const fmtSize = b => b > 1e9 ? (b / 1e9).toFixed(1) + ' GB' : (b / 1e6).toFixed(1) + ' MB';
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage non disponibile */ } };

const ICONS = {
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  folder: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z"/></svg>',
  sync: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 01-15.5 6.2M3 12A9 9 0 0118.5 5.8M18 2v4h-4M6 22v-4h4"/></svg>',
  music: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
  down: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  prev: '<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9.5 12z"/></svg>',
  next: '<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l10.5-7z"/></svg>',
  play: '<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  loop: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/></svg>',
  trash: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
};
const paintIcons = () => $$('[data-icon]').forEach(el => { el.innerHTML = ICONS[el.dataset.icon] || ''; });

// Copertina generata dal nome del brano (gradiente stabile).
function artStyle(seed) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `linear-gradient(135deg, hsl(${h % 360} 70% 55%), hsl(${(h + 70) % 360} 65% 40%))`;
}
function artDataURL(seed) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, `hsl(${h % 360} 70% 55%)`);
  grad.addColorStop(1, `hsl(${(h + 70) % 360} 65% 40%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return cv.toDataURL('image/png');
}

/* ---------- database (IndexedDB) ---------- */
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
async function dbAll() { return req((await db()).transaction('tracks').objectStore('tracks').getAll()); }
async function dbBlob(id) { return req((await db()).transaction('blobs').objectStore('blobs').get(id)); }
async function dbPut(meta, blob) {
  const t = (await db()).transaction(['tracks', 'blobs'], 'readwrite');
  t.objectStore('tracks').put(meta);
  t.objectStore('blobs').put(blob, meta.id);
  return new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); });
}
async function dbDelete(id) {
  const t = (await db()).transaction(['tracks', 'blobs'], 'readwrite');
  t.objectStore('tracks').delete(id);
  t.objectStore('blobs').delete(id);
  return new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); });
}

/* ---------- stato ---------- */
const state = {
  tracks: [],
  current: null,
  mode: lsGet('mode', 'one'),     // 'one' | 'all' | 'off'
  ab: { a: null, b: null },
  query: '',
  editing: false,
  seeking: false
};
const audio = $('#audio');
let objUrl = null;

function parseName(filename) {
  const base = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
  const m = base.match(/^(.+?)\s+-\s+(.+)$/);
  return m ? { artist: m[1].trim(), title: m[2].trim() } : { artist: 'Artista sconosciuto', title: base };
}
function readDuration(blob) {
  return new Promise(res => {
    const a = new Audio();
    const u = URL.createObjectURL(blob);
    const done = d => { URL.revokeObjectURL(u); res(d); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => done(isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => done(0);
    setTimeout(() => done(0), 6000);
    a.src = u;
  });
}
async function addTrack({ id, filename, blob, driveId }) {
  const { title, artist } = parseName(filename);
  const meta = { id, filename, title, artist, size: blob.size, driveId: driveId || null, duration: await readDuration(blob), addedAt: Date.now() };
  await dbPut(meta, blob);
  state.tracks.push(meta);
  sortTracks();
}
const sortTracks = () => state.tracks.sort((a, b) => a.title.localeCompare(b.title, 'it'));

/* ---------- navigazione ---------- */
function go(view) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.go === view));
  if (view === 'sync') renderSync();
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-go]');
  if (t) go(t.dataset.go);
});

/* ---------- libreria ---------- */
function renderLibrary() {
  const q = state.query.trim().toLowerCase();
  const list = state.tracks.filter(t => !q || (t.title + ' ' + t.artist).toLowerCase().includes(q));
  $('#empty').hidden = state.tracks.length > 0;
  $('#btn-edit').hidden = state.tracks.length === 0;
  $('#btn-edit').textContent = state.editing ? 'Fine' : 'Modifica';
  $('#track-list').innerHTML = list.map(t => `
    <div class="row ${t.id === state.current ? 'playing' : ''}" data-id="${esc(t.id)}">
      <button class="row" data-play="${esc(t.id)}" aria-label="Riproduci ${esc(t.title)}">
        <div class="art" style="background:${artStyle(t.id)}"></div>
        <div class="grow left"><span class="title">${esc(t.title)}</span><span class="sub">${esc(t.artist)}</span></div>
        <span class="dur">${t.duration ? fmt(t.duration) : ''}</span>
      </button>
      ${state.editing ? `<button class="del" data-del="${esc(t.id)}" aria-label="Rimuovi ${esc(t.title)}">${ICONS.trash}</button>` : ''}
    </div>`).join('');
}
$('#search').addEventListener('input', e => { state.query = e.target.value; renderLibrary(); });
$('#btn-edit').addEventListener('click', () => { state.editing = !state.editing; renderLibrary(); });
$('#track-list').addEventListener('click', async e => {
  const p = e.target.closest('[data-play]');
  const d = e.target.closest('[data-del]');
  if (p) { play(p.dataset.play); openPlayer(); }
  if (d) {
    const id = d.dataset.del;
    if (id === state.current) { audio.pause(); audio.removeAttribute('src'); state.current = null; renderPlayer(); }
    await dbDelete(id);
    state.tracks = state.tracks.filter(t => t.id !== id);
    renderLibrary();
  }
});

/* ---------- player ---------- */
const ctl = i => state.tracks.findIndex(t => t.id === state.current) + i;
const currentTrack = () => state.tracks.find(t => t.id === state.current);

async function play(id) {
  const t = state.tracks.find(x => x.id === id);
  if (!t) return;
  const blob = await dbBlob(id);
  if (!blob) return;
  if (objUrl) URL.revokeObjectURL(objUrl);
  objUrl = URL.createObjectURL(blob);
  state.current = id;
  state.ab = { a: null, b: null };
  audio.src = objUrl;
  audio.loop = state.mode === 'one';
  setMediaSession(t);
  renderLibrary();
  renderPlayer();
  try { await audio.play(); } catch { /* serve un tocco dell'utente */ }
}
function step(dir) {
  if (!state.tracks.length) return;
  const i = state.tracks.findIndex(t => t.id === state.current);
  let n = i + dir;
  if (n < 0 || n >= state.tracks.length) n = (n + state.tracks.length) % state.tracks.length;
  play(state.tracks[n].id);
}
function togglePlay() {
  if (!state.current) { if (state.tracks.length) play(state.tracks[0].id); return; }
  audio.paused ? audio.play() : audio.pause();
}
audio.addEventListener('ended', () => {
  const i = state.tracks.findIndex(t => t.id === state.current);
  if (state.mode === 'all') step(1);
  else if (state.mode === 'off' && i < state.tracks.length - 1) step(1);
});
audio.addEventListener('play', renderTransport);
audio.addEventListener('pause', renderTransport);
audio.addEventListener('loadedmetadata', renderTime);
audio.addEventListener('timeupdate', () => {
  const { a, b } = state.ab;
  if (a !== null && b !== null && audio.currentTime >= b) audio.currentTime = a;
  renderTime();
});

function renderTransport() {
  const icon = audio.paused ? ICONS.play : ICONS.pause;
  $('#btn-play').innerHTML = icon;
  $('#btn-play').setAttribute('aria-label', audio.paused ? 'Play' : 'Pausa');
  $('#mini-toggle').innerHTML = icon.replace(/width="34" height="34"/, 'width="26" height="26"');
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';
}
function renderTime() {
  const d = audio.duration, c = audio.currentTime;
  if (!state.seeking) {
    $('#seek').max = isFinite(d) ? d : 100;
    $('#seek').value = c;
    $('#seek').style.setProperty('--p', isFinite(d) && d ? (c / d * 100) + '%' : '0%');
  }
  $('#t-cur').textContent = fmt(c);
  $('#t-rem').textContent = '-' + fmt(isFinite(d) ? d - c : 0);
  if ('mediaSession' in navigator && isFinite(d) && d > 0) {
    try { navigator.mediaSession.setPositionState({ duration: d, position: Math.min(c, d), playbackRate: 1 }); } catch { /* non supportato */ }
  }
}
function renderPlayer() {
  const t = currentTrack();
  $('#mini').hidden = !t;
  $('#p-title').textContent = t ? t.title : '—';
  $('#p-artist').textContent = t ? t.artist : '—';
  $('#mini-title').textContent = t ? t.title : '—';
  const bg = t ? artStyle(t.id) : 'var(--raised)';
  $('#cover').style.background = bg;
  $('#mini-art').style.background = bg;
  const m = state.mode;
  const btn = $('#btn-loop');
  btn.classList.toggle('on', m !== 'off');
  btn.classList.toggle('one-on', m === 'one');
  $('#loop-text').textContent = m === 'one' ? 'Loop brano' : m === 'all' ? 'Loop libreria' : 'Loop spento';
  $('#mini-mode').textContent = m === 'one' ? 'Loop brano singolo' : m === 'all' ? 'Loop libreria' : 'Loop spento';
  btn.setAttribute('aria-label', $('#loop-text').textContent + ', tocca per cambiare');
  renderAB();
  renderTransport();
  renderTime();
}
function renderAB() {
  const { a, b } = state.ab;
  const d = audio.duration;
  $('#btn-ab').classList.toggle('on', a !== null);
  const zone = $('#ab-zone');
  const ready = a !== null && b !== null && isFinite(d) && d > 0;
  zone.hidden = !ready;
  if (ready) { zone.style.left = (a / d * 100) + '%'; zone.style.width = ((b - a) / d * 100) + '%'; }
  $('#ab-text').textContent =
    a === null ? 'Tocca A–B per fissare l’inizio della sezione'
      : b === null ? `A: ${fmt(a)} · tocca A–B per fissare la fine`
        : `Sezione A–B: ${fmt(a)} → ${fmt(b)} · tocca per rimuoverla`;
}
$('#btn-ab').addEventListener('click', () => {
  if (!state.current) return;
  const s = state.ab;
  if (s.a === null) s.a = audio.currentTime;
  else if (s.b === null) {
    if (audio.currentTime - s.a < 1) return;   // sezione troppo corta
    s.b = audio.currentTime;
  } else state.ab = { a: null, b: null };
  renderAB();
});
$('#btn-loop').addEventListener('click', () => {
  state.mode = state.mode === 'one' ? 'all' : state.mode === 'all' ? 'off' : 'one';
  lsSet('mode', state.mode);
  audio.loop = state.mode === 'one';
  renderPlayer();
});
$('#btn-play').addEventListener('click', togglePlay);
$('#mini-toggle').addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
$('#btn-prev').addEventListener('click', () => (audio.currentTime > 3 ? (audio.currentTime = 0) : step(-1)));
$('#btn-next').addEventListener('click', () => step(1));
$('#seek').addEventListener('input', e => {
  state.seeking = true;
  const v = +e.target.value;
  $('#t-cur').textContent = fmt(v);
  e.target.style.setProperty('--p', (audio.duration ? v / audio.duration * 100 : 0) + '%');
});
$('#seek').addEventListener('change', e => { audio.currentTime = +e.target.value; state.seeking = false; });

function openPlayer() { $('#player').classList.add('open'); $('#player').setAttribute('aria-hidden', 'false'); }
function closePlayer() { $('#player').classList.remove('open'); $('#player').setAttribute('aria-hidden', 'true'); }
$('#mini').addEventListener('click', openPlayer);
$('#btn-close').addEventListener('click', closePlayer);

function setMediaSession(t) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: t.title, artist: t.artist, album: 'Loop Player',
    artwork: [{ src: artDataURL(t.id), sizes: '256x256', type: 'image/png' }]
  });
  const set = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch { /* azione non supportata */ } };
  set('play', () => audio.play());
  set('pause', () => audio.pause());
  set('previoustrack', () => step(-1));
  set('nexttrack', () => step(1));
  set('seekto', d => { audio.currentTime = d.seekTime; });
  set('seekbackward', () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
  set('seekforward', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
}

/* ---------- importazione manuale ---------- */
$('#btn-import').addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', async e => {
  const files = [...e.target.files];
  e.target.value = '';
  for (const f of files) {
    if (state.tracks.some(t => t.filename === f.name && t.size === f.size)) continue;
    await addTrack({ id: crypto.randomUUID(), filename: f.name, blob: f });
  }
  renderLibrary();
  renderStorage();
  go('library');
});

/* ---------- Google Drive ---------- */
const drive = { token: null, exp: 0, client: null, remote: [], progress: {} };
const loadScript = src => new Promise((res, rej) => {
  if ($(`script[src="${src}"]`)) return res();
  const s = document.createElement('script');
  s.src = src; s.onload = res; s.onerror = () => rej(new Error('Impossibile caricare lo script di accesso Google (sei offline?)'));
  document.head.appendChild(s);
});
async function authorize() {
  if (drive.token && Date.now() < drive.exp) return drive.token;
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
      res(drive.token);
    };
    drive.client.error_callback = e => rej(new Error('Accesso Google non riuscito (' + (e.type || 'errore') + ')'));
    drive.client.requestAccessToken({ prompt: '' });
  });
}
async function gfetch(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { Authorization: 'Bearer ' + drive.token } });
  if (!r.ok) {
    let why = '';
    try { const j = await r.json(); why = j.error.errors?.[0]?.reason || j.error.status || j.error.message || ''; } catch { /* corpo non leggibile */ }
    if (r.status === 403) drive.token = null;   // forza un nuovo consenso al prossimo tentativo
    throw new Error('Google Drive ha risposto ' + r.status + (why ? ' (' + why + ')' : ''));
  }
  return r;
}
async function listRemote() {
  const name = (CFG.DRIVE_FOLDER_NAME || 'Loop Player').replace(/'/g, "\\'");
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const fol = await (await gfetch('https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=' + encodeURIComponent(q))).json();
  if (!fol.files.length) throw new Error(`Cartella “${CFG.DRIVE_FOLDER_NAME}” non trovata su Google Drive`);
  const files = [];
  let pageToken = '';
  do {
    const fq = `'${fol.files[0].id}' in parents and trashed=false`;
    const u = 'https://www.googleapis.com/drive/v3/files?pageSize=1000&fields=nextPageToken,files(id,name,size,mimeType)&q=' +
      encodeURIComponent(fq) + (pageToken ? '&pageToken=' + pageToken : '');
    const page = await (await gfetch(u)).json();
    files.push(...page.files);
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return files.filter(f => (f.mimeType || '').startsWith('audio/') || /\.(mp3|m4a|aac|wav|flac)$/i.test(f.name));
}
async function download(f, onProgress) {
  const r = await gfetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`);
  const total = +f.size || +r.headers.get('Content-Length') || 0;
  const reader = r.body.getReader();
  const chunks = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    if (total) onProgress(got / total);
  }
  return new Blob(chunks, { type: f.mimeType || 'audio/mpeg' });
}
async function syncNow() {
  const btn = $('#btn-sync'), err = $('#sync-error');
  err.hidden = true;
  if (!CFG.GOOGLE_CLIENT_ID) {
    err.textContent = 'Sincronizzazione non configurata: inserisci il Client ID in config.js (vedi README). Intanto puoi aggiungere file a mano.';
    err.hidden = false;
    return;
  }
  btn.disabled = true;
  try {
    await authorize();
    drive.remote = await listRemote();
    const have = new Set(state.tracks.map(t => t.driveId).filter(Boolean));
    const fresh = drive.remote.filter(f => !have.has(f.id));
    drive.progress = Object.fromEntries(fresh.map(f => [f.id, { pct: 0, st: 'In coda', file: f }]));
    renderSync();
    for (const f of fresh) {
      drive.progress[f.id].st = '0%';
      renderSync();
      try {
        const blob = await download(f, p => { drive.progress[f.id].pct = p; drive.progress[f.id].st = Math.round(p * 100) + '%'; renderSyncProgress(); });
        await addTrack({ id: 'd_' + f.id, filename: f.name, blob, driveId: f.id });
        drive.progress[f.id] = { pct: 1, st: 'Scaricato', file: f };
      } catch (e) {
        drive.progress[f.id] = { pct: 0, st: 'Errore', file: f };
      }
      renderSync();
      renderLibrary();
    }
    lsSet('lastSync', Date.now());
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
    renderSync();
    renderStorage();
  }
}
$('#btn-sync').addEventListener('click', syncNow);
$('#auto-sync').addEventListener('change', e => lsSet('autoSync', e.target.checked));

function renderSyncProgress() {
  $$('[data-pid]').forEach(el => {
    const p = drive.progress[el.dataset.pid];
    if (!p) return;
    $('.bar > div', el).style.width = (p.pct * 100) + '%';
    $('.st', el).textContent = p.st;
  });
}
function renderSync() {
  const entries = Object.entries(drive.progress);
  $('#new-title').hidden = !entries.length;
  $('#new-title').textContent = `Nuovi brani trovati · ${entries.length}`;
  $('#sync-list').innerHTML = entries.map(([id, p]) => `
    <div class="sync-item" data-pid="${esc(id)}">
      <div class="art row" style="background:${artStyle('d_' + id)};width:44px;height:44px;border-radius:8px;min-height:0;flex:none"></div>
      <div class="grow"><span>${esc(p.file.name)}</span><div class="bar"><div style="width:${p.pct * 100}%"></div></div></div>
      <span class="st">${esc(p.st)}</span>
    </div>`).join('');
  const ok = !!drive.token && Date.now() < drive.exp;
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
  $('#storage-bar').style.width = quota ? Math.min(100, used / quota * 100) + '%' : '0%';
}

/* ---------- avvio ---------- */
(async function init() {
  paintIcons();
  state.tracks = await dbAll();
  sortTracks();
  renderLibrary();
  renderPlayer();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  // Con "Sincronizza all'apertura" attivo, sincronizza solo se il token è ancora valido (altrimenti serve un tocco).
  if (lsGet('autoSync', false) && CFG.GOOGLE_CLIENT_ID && drive.token) syncNow();
})();
