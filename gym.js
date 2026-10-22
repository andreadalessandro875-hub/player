'use strict';
/* ================= Palestra: scheda di allenamento =================
   Sezione indipendente dalla musica, tenuta in un file a parte per poterla spostare facilmente.
   Usa gli aiuti globali di app.js ($, esc, fmt, lsGet, lsSet, haptic, toast, ICONS, actionSheet). */

const GYM_PLAN = [
  {
    key: 'tue', dow: 2, day: 'Martedì', short: 'Mar', tag: 'Lower A', title: 'Lower A + Tricipiti',
    desc: 'Focus sulla spinta delle gambe. Avrai ben 3 giorni di riposo alle spalle, quindi sarai al massimo delle energie.',
    ex: [
      { n: 'Leg Press 45°', s: 4, r: '8', rest: 120, note: 'Discesa profonda e controllata, non staccare il sedere.' },
      { n: 'Affondi Bulgari (manubri)', s: 3, r: '10 per gamba', rest: 90, note: 'Busto leggermente avanti per enfatizzare anche i glutei.' },
      { n: 'Leg Extension', s: 3, r: '12-15', rest: 60, note: 'Trattieni 1 secondo di contrazione di picco in alto.' },
      { n: 'Calf Machine (in piedi)', s: 4, r: '15', rest: 60, note: 'Scendi al massimo, fermati 1 secondo in allungamento.' },
      { n: 'Pushdown con corda', s: 3, r: '12', rest: 90, note: 'Gomiti stretti al corpo, apri la corda alla fine del movimento.' },
      { n: 'Tricipiti dietro nuca (manubrio o cavo)', s: 2, r: '12', rest: 60, note: 'Ottimo per allungare il capo lungo del tricipite.' }
    ]
  },
  {
    key: 'thu', dow: 4, day: 'Giovedì', short: 'Gio', tag: 'Upper A', title: 'Upper A (Focus Spinta)',
    desc: 'Sessione dedicata alla spinta della parte alta e alla larghezza delle spalle.',
    ex: [
      { n: 'Panca Piana (bilanciere o manubri)', s: 4, r: '8', rest: 120, note: 'Scapole addotte (chiuse), tocca il petto e spingi forte.' },
      { n: 'Lat Machine avanti (presa prona)', s: 4, r: '8-10', rest: 120, note: 'Tira portando la sbarra verso la parte alta del petto.' },
      { n: 'Lento Avanti (manubri su panca a 75°)', s: 3, r: '8-10', rest: 90, note: 'Gomiti leggermente chiusi in avanti (piano scapolare).' },
      { n: 'Croci ai cavi alti', s: 3, r: '12', rest: 60, note: 'Focus sul pompaggio del petto, incrocia leggermente le mani.' },
      { n: 'Alzate Laterali ai cavi', s: 3, r: '12', rest: 60, note: 'Cavo basso dietro la schiena. Tensione costante sul capo laterale.' }
    ]
  },
  {
    key: 'sat', dow: 6, day: 'Sabato', short: 'Sab', tag: 'Lower B', title: 'Lower B + Bicipiti',
    desc: 'Focus sulla catena posteriore (femorali e glutei). Ottimo da fare di sabato perché hai tempo di recuperare senza la fretta dei giorni lavorativi.',
    ex: [
      { n: 'Stacco Rumeno (bilanciere o manubri)', s: 4, r: '8', rest: 120, note: 'Spingi il bacino indietro. Schiena dritta, senti stirare i femorali.' },
      { n: 'Hip Thrust (bilanciere o macchina)', s: 3, r: '10-12', rest: 90, note: 'Blocca la contrazione dei glutei in alto per 1 secondo.' },
      { n: 'Leg Curl (seduto o sdraiato)', s: 3, r: '12', rest: 60, note: 'Controlla la fase eccentrica (discesa del peso).' },
      { n: 'Abductor Machine', s: 3, r: '15-20', rest: 60, note: 'Busto leggermente inclinato in avanti per isolare i glutei.' },
      { n: 'Curl alternato con manubri', s: 3, r: '12', rest: 90, note: 'Ruota il palmo della mano verso l\'alto durante la salita.' },
      { n: 'Hammer Curl', s: 2, r: '12', rest: 60, note: 'Presa a "martello" (palmi che si guardano). Focus avambracci.' }
    ]
  },
  {
    key: 'sun', dow: 0, day: 'Domenica', short: 'Dom', tag: 'Upper B', title: 'Upper B (Focus Trazione)',
    desc: 'Le gambe oggi riposano. Ci concentriamo sulla schiena e sulla parte posteriore e laterale delle spalle (effetto 3D).',
    ex: [
      { n: 'Rematore con manubrio (o T-Bar)', s: 4, r: '8', rest: 120, note: 'Tira portando il manubrio verso l\'anca, non verso la spalla.' },
      { n: 'Panca Inclinata 30° (manubri)', s: 4, r: '10', rest: 120, note: 'Focus sul petto alto e deltoide anteriore.' },
      { n: 'Pulley Basso (presa stretta o barra)', s: 3, r: '10-12', rest: 90, note: 'Petto in fuori, chiudi forte le scapole quando arrivi alla pancia.' },
      { n: 'Alzate Laterali con manubri', s: 4, r: '12-15', rest: 60, note: 'Spalle basse. Spingi i manubri verso l\'esterno, non verso l\'alto.' },
      { n: 'Face Pull (cavo alto con corda)', s: 4, r: '15', rest: 60, note: 'Tira la corda verso la fronte, allargando i gomiti all\'indietro.' }
    ]
  }
];

// Stato salvato sul telefono: serie fatte (si azzerano da sole il giorno dopo) e ultimo peso per esercizio.
const gym = { sel: null, data: lsGet('gym', { done: {}, doneDate: {}, kg: {} }), rest: null };
const gymToday = () => new Date().toLocaleDateString('sv-SE');   // AAAA-MM-GG, ora locale
const gymSave = () => lsSet('gym', gym.data);
const gymDay = () => GYM_PLAN.find(p => p.key === gym.sel);
const restLabel = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function gymDone(key) {
  if (gym.data.doneDate[key] !== gymToday()) { gym.data.done[key] = {}; gym.data.doneDate[key] = gymToday(); }
  return gym.data.done[key];
}
// Oggi se è un giorno di allenamento, altrimenti il prossimo.
function gymDefaultDay() {
  const dow = new Date().getDay();
  let best = GYM_PLAN[0], dist = 8;
  for (const p of GYM_PLAN) { const d = (p.dow - dow + 7) % 7; if (d < dist) { dist = d; best = p; } }
  return best.key;
}

function renderGym() {
  if (!gym.sel) gym.sel = gymDefaultDay();
  const d = gymDay(), done = gymDone(d.key), dow = new Date().getDay();
  $('#gym-seg').innerHTML = GYM_PLAN.map(p => `
    <button class="seg-btn${p.key === d.key ? ' on' : ''}" data-day="${p.key}" aria-pressed="${p.key === d.key}">
      <span class="seg-d">${p.short}</span><span class="seg-t">${p.tag}</span>
      ${p.dow === dow ? '<i class="seg-today" aria-label="oggi"></i>' : ''}
    </button>`).join('');
  $('#gym-day').innerHTML = `
    <h2 class="gym-title">${esc(d.day)} · ${esc(d.title)}</h2>
    <p class="gym-desc">${esc(d.desc)}</p>
    <div id="gym-prog" class="gym-prog"></div>
    <div class="ex-list">${d.ex.map((e, i) => {
      const kg = gym.data.kg[e.n] || '';
      const complete = Array.from({ length: e.s }, (_, j) => done[`${i}-${j}`]).every(Boolean);
      return `
      <article class="ex${complete ? ' done' : ''}" data-ex="${i}" style="--i:${i}">
        <div class="ex-head">
          <span class="ex-num">${i + 1}</span>
          <div class="ex-main"><h3>${esc(e.n)}</h3><p class="ex-meta">${e.s} × ${esc(e.r)} · recupero ${restLabel(e.rest)}</p></div>
          <span class="ex-check" aria-hidden="true">${ICONS.check}</span>
        </div>
        <div class="ex-row">
          <div class="sets">${Array.from({ length: e.s }, (_, j) => {
            const on = !!done[`${i}-${j}`];
            return `<button class="set${on ? ' on' : ''}" data-set="${i}-${j}" aria-pressed="${on}" aria-label="Serie ${j + 1} di ${e.s}">${j + 1}</button>`;
          }).join('')}</div>
          <label class="kg"><input type="text" inputmode="decimal" enterkeyhint="done" placeholder="—" value="${esc(kg)}" data-kg="${esc(e.n)}" aria-label="Peso per ${esc(e.n)}"><span>kg</span></label>
        </div>
        <p class="ex-note">${esc(e.note)}</p>
      </article>`;
    }).join('')}</div>`;
  renderGymProgress();
}
function renderGymProgress() {
  const d = gymDay(), done = gymDone(d.key);
  const total = d.ex.reduce((s, e) => s + e.s, 0);
  const n = d.ex.reduce((s, e, i) => s + Array.from({ length: e.s }, (_, j) => done[`${i}-${j}`] ? 1 : 0).reduce((a, b) => a + b, 0), 0);
  $('#gym-prog').innerHTML = `
    <div class="between"><span>${n} di ${total} serie</span><span class="muted">${Math.round(n / total * 100)}%</span></div>
    <div class="bar"><div style="width:${n / total * 100}%"></div></div>`;
  return { n, total };
}

const gymView = $('#view-gym');
gymView.addEventListener('click', e => {
  const dayBtn = e.target.closest('[data-day]');
  if (dayBtn) {
    if (dayBtn.dataset.day === gym.sel) return;
    haptic();
    gym.sel = dayBtn.dataset.day;
    renderGym();
    return;
  }
  const setBtn = e.target.closest('[data-set]');
  if (!setBtn) return;
  const d = gymDay(), done = gymDone(d.key), id = setBtn.dataset.set, on = !done[id];
  if (on) done[id] = 1; else delete done[id];
  gymSave();
  haptic();
  setBtn.classList.toggle('on', on);
  setBtn.setAttribute('aria-pressed', String(on));
  const i = +id.split('-')[0], ex = d.ex[i];
  const complete = Array.from({ length: ex.s }, (_, j) => done[`${i}-${j}`]).every(Boolean);
  setBtn.closest('.ex').classList.toggle('done', complete);
  const { n, total } = renderGymProgress();
  if (!on) return;
  if (n === total) { endRest(false); toast('Allenamento completato'); return; }
  startRest(ex.rest, ex.n);
});
gymView.addEventListener('input', e => {
  const inp = e.target.closest('[data-kg]');
  if (!inp) return;
  const v = inp.value.replace(/[^\d.,]/g, '').slice(0, 6);
  if (v !== inp.value) inp.value = v;
  if (v) gym.data.kg[inp.dataset.kg] = v; else delete gym.data.kg[inp.dataset.kg];
  gymSave();
});
gymView.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest('[data-kg]')) e.target.blur(); });
$('#gym-reset').addEventListener('click', async () => {
  const d = gymDay();
  if (!d) return;
  haptic();
  const k = await actionSheet(`Azzerare le serie di ${d.day.toLowerCase()}? I pesi restano salvati.`, [{ k: 'ok', label: 'Azzera serie', danger: true }]);
  if (k !== 'ok') return;
  gym.data.done[d.key] = {};
  gymSave();
  endRest(false);
  renderGym();
});

/* ---------- Timer di recupero ---------- */
// Basato su un orario di fine, quindi resta preciso anche se il telefono va in standby.
const restEl = $('#rest');
const REST_C = 2 * Math.PI * 16;
let restIv = 0, actx = null;
function startRest(sec, label) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch { actx = null; }
  gym.rest = { end: Date.now() + sec * 1000, total: sec, label };
  $('#rest-label').textContent = label;
  restEl.hidden = false;
  void restEl.offsetWidth;
  restEl.classList.add('show');
  clearInterval(restIv);
  restIv = setInterval(tickRest, 250);
  tickRest();
}
function tickRest() {
  const r = gym.rest;
  if (!r) return;
  const left = Math.max(0, r.end - Date.now());
  $('#rest-time').textContent = restLabel(Math.ceil(left / 1000));
  $('#rest-arc').style.strokeDashoffset = String(REST_C * (1 - left / (r.total * 1000)));
  if (left <= 0) endRest(true);
}
function endRest(finished) {
  clearInterval(restIv);
  if (!gym.rest) return;
  gym.rest = null;
  restEl.classList.remove('show');
  setTimeout(() => { if (!gym.rest) restEl.hidden = true; }, 450);
  if (finished) { beep(); haptic(true); toast('Recupero finito: prossima serie'); }
}
// Due brevi toni per avvisare che il recupero è finito (si mescolano alla musica).
function beep() {
  if (!actx) return;
  try {
    const t = actx.currentTime;
    for (const o of [0, 0.22]) {
      const os = actx.createOscillator(), g = actx.createGain();
      os.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t + o);
      g.gain.exponentialRampToValueAtTime(0.25, t + o + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o + 0.18);
      os.connect(g).connect(actx.destination);
      os.start(t + o);
      os.stop(t + o + 0.2);
    }
  } catch { /* audio non disponibile */ }
}
$('#rest-minus').addEventListener('click', () => { if (!gym.rest) return; haptic(); gym.rest.end = Math.max(Date.now(), gym.rest.end - 15000); tickRest(); });
$('#rest-plus').addEventListener('click', () => { if (!gym.rest) return; haptic(); gym.rest.end += 15000; gym.rest.total += 15; tickRest(); });
$('#rest-skip').addEventListener('click', () => { haptic(); endRest(false); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) tickRest(); });
