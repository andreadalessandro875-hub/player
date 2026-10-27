'use strict';
/* ================= Palestra: scheda di allenamento =================
   Sezione indipendente dalla musica, tenuta in un file a parte per poterla spostare facilmente.
   Usa gli aiuti globali di app.js ($, esc, fmt, lsGet, lsSet, haptic, toast, ICONS, actionSheet). */

// Scheda a rotazione: si alternano i giorni nell'ordine dell'elenco (Upper 1, Lower 1, Upper 2, Lower 2).
const GYM_PLAN = [
  {
    key: 'g1', day: 'Upper 1', short: 'Upper 1', tag: 'Spinta', title: 'Upper Body',
    desc: 'Spinta orizzontale/inclinata + trazione orizzontale.',
    ex: [
      { n: 'Panca Piana con Manubri', s: 4, r: '6-8', rest: 150, note: 'Esercizio cardine di spinta orizzontale per il petto e i tricipiti.' },
      { n: 'Rematore su panca inclinata (manubri o bilanciere)', s: 4, r: '8-10', rest: 120, note: 'Trazione orizzontale per lo spessore della schiena, isolando la lombare.' },
      { n: 'Chest Press Inclinata (macchina o manubri su panca inclinata)', s: 3, r: '8-10', rest: 105, note: 'Focus sulla parte clavicolare/alta del petto.' },
      { n: 'Pulley basso (triangolo o sbarra stretta)', s: 3, r: '10-12', rest: 90, note: 'Trazione orizzontale complementare per il gran dorsale e romboidi.' },
      { n: 'Shoulder Press a macchina', s: 3, r: '8-10', rest: 105, note: 'Spinta verticale per i deltoidi anteriori e laterali.' },
      { n: 'Alzate laterali con manubri', s: 3, r: '12-15', rest: 60, note: 'Isolamento puro per il capo laterale del deltoide.' }
    ]
  },
  {
    key: 'l1', day: 'Lower 1', short: 'Lower 1', tag: 'Quadricipiti', title: 'Quadricipiti + Bicipiti',
    desc: 'Focus quadricipiti con richiamo femorali, poi bicipiti.',
    ex: [
      { n: 'Squat con Bilanciere (o Hack Squat)', s: 4, r: '6-8', rest: 150, note: 'Quadricipiti, carico pesante.' },
      { n: 'Leg Press 45°', s: 3, r: '10-12', rest: 120, note: 'Quadricipiti.' },
      { n: 'Affondi camminati con manubri', s: 3, r: '12 passi totali', rest: 90, note: 'Quadricipiti e glutei.' },
      { n: 'Leg Curl seduto o sdraiato (richiamo)', s: 3, r: '12-15', rest: 75, note: 'Femorali: focus su contrazione e pompaggio, senza sfinirsi.' },
      { n: 'Curl con Bilanciere EZ', s: 3, r: '10-12', rest: 75, note: 'Bicipiti.' },
      { n: 'Hammer Curl con manubri', s: 3, r: '12', rest: 75, note: 'Bicipiti.' },
      { n: 'Calf Machine seduto', s: 4, r: '15', rest: 60, note: 'Polpacci.' }
    ]
  },
  {
    key: 'g2', day: 'Upper 2', short: 'Upper 2', tag: 'Dorso', title: 'Upper Body',
    desc: 'Senza bicipiti e tricipiti.',
    ex: [
      { n: 'Lat Machine (presa larga o inversa) o Trazioni alla sbarra', s: 4, r: '8-10', rest: 120, note: 'Trazione verticale fondamentale per la larghezza del dorso.' },
      { n: 'Panca Inclinata con Bilanciere o Chest Press orizzontale a macchina', s: 3, r: '8-10', rest: 120, note: 'Variazione dell\'angolo di spinta rispetto alla panca piana con manubri dell\'Upper 1.' },
      { n: 'Rematore con Bilanciere a busto flesso o T-Bar Row', s: 3, r: '8-10', rest: 105, note: 'Trazione orizzontale pesante per lo spessore della schiena.' },
      { n: 'Lento Avanti con Manubri da seduto', s: 3, r: '8-10', rest: 105, note: 'Spinta verticale libera per le spalle, diversa dalla shoulder press a macchina dell\'Upper 1.' },
      { n: 'Croci ai cavi alti o bassi o Pectoral Machine', s: 3, r: '12-15', rest: 75, note: 'Isolamento del petto in allungamento/contrazione.' },
      { n: 'Face Pull ai cavi o Reverse Fly (alzate posteriori a 90°)', s: 3, r: '12-15', rest: 60, note: 'Cuffia dei rotatori e deltoidi posteriori per postura e salute della spalla.' }
    ]
  },
  {
    key: 'l2', day: 'Lower 2', short: 'Lower 2', tag: 'Femorali', title: 'Femorali/Glutei + Tricipiti',
    desc: 'Focus femorali e glutei con richiamo quadricipiti, poi tricipiti.',
    ex: [
      { n: 'Stacco Rumeno (bilanciere o manubri)', s: 4, r: '8', rest: 150, note: 'Femorali, carico pesante.' },
      { n: 'Hip Thrust', s: 3, r: '8-10', rest: 120, note: 'Glutei e femorali.' },
      { n: 'Bulgarian Split Squat', s: 3, r: '10 per gamba', rest: 90, note: 'Femorali e glutei.' },
      { n: 'Leg Extension (richiamo)', s: 3, r: '12-15', rest: 75, note: 'Quadricipiti: isolamento puro per rifinire e pompare il muscolo a fine seduta.' },
      { n: 'Pushdown ai cavi con corda', s: 3, r: '10-12', rest: 75, note: 'Tricipiti.' },
      { n: 'French Press con manubri su panca', s: 3, r: '10-12', rest: 75, note: 'Tricipiti.' },
      { n: 'Calf Machine in piedi', s: 4, r: '12', rest: 60, note: 'Polpacci.' }
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
  const dt = gym.data;
  dt.done = dt.done || {}; dt.doneDate = dt.doneDate || {}; dt.kg = dt.kg || {};
  if (dt.doneDate[key] !== gymToday() || !dt.done[key]) { dt.done[key] = {}; dt.doneDate[key] = gymToday(); }
  return gym.data.done[key];
}
// Proposto all'apertura: se oggi ti sei già allenato resta quel giorno, altrimenti il successivo della rotazione.
function gymDefaultDay() {
  const last = gym.data.last;
  const i = last ? GYM_PLAN.findIndex(p => p.key === last.key) : -1;
  if (i < 0) return GYM_PLAN[0].key;
  if (last.date === gymToday()) return last.key;
  return GYM_PLAN[(i + 1) % GYM_PLAN.length].key;
}

function renderGym() {
  if (!gym.sel) gym.sel = gymDefaultDay();
  const d = gymDay(), done = gymDone(d.key), next = gymDefaultDay();
  $('#gym-seg').style.gridTemplateColumns = `repeat(${GYM_PLAN.length}, minmax(0, 1fr))`;
  $('#gym-seg').innerHTML = GYM_PLAN.map(p => `
    <button class="seg-btn${p.key === d.key ? ' on' : ''}" data-day="${p.key}" aria-pressed="${p.key === d.key}">
      <span class="seg-d">${p.short}</span><span class="seg-t">${p.tag}</span>
      ${p.key === next ? '<i class="seg-today" aria-label="giorno proposto"></i>' : ''}
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
  if (on) { done[id] = 1; gym.data.last = { key: d.key, date: gymToday() }; } else delete done[id];
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
  const k = await actionSheet(`Azzerare le serie del ${d.day.toLowerCase()}? I pesi restano salvati.`, [{ k: 'ok', label: 'Azzera serie', danger: true }]);
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
