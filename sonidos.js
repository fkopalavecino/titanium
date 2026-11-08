/* Titanium Sport · sonidos de los temporizadores (estilo Tabata Pro)
   Volumen ajustable, sonidos distintos para inicio, término, final y cuenta regresiva, voz y vibración.
   Los sonidos se generan con Web Audio; además cada persona puede grabar o subir su propio audio
   (queda guardado solo en su teléfono). La configuración también queda guardada en el teléfono. */
(function () {
  const KEY = 'tl-sonido';
  const DEF = { vol: 90, inicio: 'campana', fin: 'silbato', final: 'gong', cuenta: 'pitido', vib: true };
  let cfg = Object.assign({}, DEF);
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (_) {} };

  const SONIDOS = [
    ['campana', '🥊 Campana de box'], ['silbato', '📣 Silbato'], ['gong', '🔔 Gong'], ['bocina', '📯 Bocina'],
    ['pitido', '⏱ Pitido fuerte'], ['doble', '⏱⏱ Doble pitido'], ['digital', '⌚ Reloj digital'], ['subida', '📈 Tres tonos'],
    ['mio', '🎙 Mi audio (grabado o subido)'], ['voz', '🗣 Voz'], ['ninguno', '🔇 Sin sonido']
  ];
  const EVENTOS = [
    ['inicio', 'Inicio (empieza el trabajo)'], ['fin', 'Término (empieza el descanso)'],
    ['final', 'Final del bloque'], ['cuenta', 'Cuenta regresiva 3-2-1']
  ];
  const VOZ = { inicio: '¡Vamos!', fin: 'Descanso', final: '¡Terminado!', prep: 'Prepárate' };

  /* ---------- motor de audio ---------- */
  let AC = null, OUT = null;
  function ctx() {
    try {
      // iPhone: que suene aunque el teléfono esté en silencio y con el volumen de multimedia
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
    } catch (_) {}
    if (!AC) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      AC = new C();
      // compresor: permite subir mucho el volumen sin que el sonido se rompa
      const comp = AC.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 6; comp.ratio.value = 10; comp.attack.value = 0.002; comp.release.value = 0.15;
      OUT = AC.createGain(); OUT.connect(comp); comp.connect(AC.destination);
    }
    if (AC.state === 'suspended') AC.resume();
    OUT.gain.value = Math.pow(Math.max(0, Math.min(100, cfg.vol)) / 100, 1.5) * 2.4; // 100% ≈ casi 10 veces lo de antes
    return AC;
  }
  // un tono con envolvente; tipo: sine | square | sawtooth | triangle
  function tono(f, t0, dur, { tipo = 'sine', g = 0.6, ataque = 0.005, vib = 0, vibF = 0, dest } = {}) {
    const o = AC.createOscillator(), e = AC.createGain();
    o.type = tipo; o.frequency.value = f;
    if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = vibF; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05); }
    e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + ataque);
    e.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(e); e.connect(dest || OUT); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function ruido(t0, dur, fc, g) {
    const n = Math.floor(AC.sampleRate * dur), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(), bp = AC.createBiquadFilter(), e = AC.createGain();
    s.buffer = b; bp.type = 'bandpass'; bp.frequency.value = fc; bp.Q.value = 4;
    e.gain.setValueAtTime(g, t0); e.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(bp); bp.connect(e); e.connect(OUT); s.start(t0); s.stop(t0 + dur);
  }
  const campanazo = (t, f) => { [[1, .5], [2.76, .3], [5.4, .18], [8.93, .1]].forEach(([m, g]) => tono(f * m, t, 1.4 / Math.sqrt(m), { g, ataque: .002 })); };
  const SYN = {
    campana: t => { [0, .28, .56].forEach(d => campanazo(t + d, 830)); },
    silbato: t => { tono(2900, t, .7, { tipo: 'sine', g: .55, ataque: .02, vib: 160, vibF: 28 }); tono(5800, t, .7, { g: .12, ataque: .02, vib: 320, vibF: 28 }); ruido(t, .7, 2900, .18); },
    gong: t => { [[110, .55], [164, .35], [221, .3], [298, .2], [443, .12]].forEach(([f, g]) => tono(f, t, 3.2, { g, ataque: .01 })); campanazo(t, 330); },
    bocina: t => { [349, 440, 523].forEach(f => { tono(f, t, .9, { tipo: 'sawtooth', g: .3, ataque: .02 }); tono(f * 1.005, t, .9, { tipo: 'square', g: .12, ataque: .02 }); }); },
    pitido: t => { tono(1100, t, .32, { tipo: 'square', g: .45 }); },
    doble: t => { tono(1300, t, .16, { tipo: 'square', g: .45 }); tono(1300, t + .22, .2, { tipo: 'square', g: .45 }); },
    digital: t => { [0, .12, .24].forEach(d => tono(2100, t + d, .07, { tipo: 'square', g: .4 })); },
    subida: t => { [880, 1175, 1568].forEach((f, i) => tono(f, t + i * .15, .2, { tipo: 'triangle', g: .6 })); },
    cuenta: t => { tono(880, t, .14, { tipo: 'square', g: .4 }); }
  };
  function hablar(txt) {
    try {
      const s = window.speechSynthesis; if (!s) return false;
      s.cancel(); const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'es-ES'; u.rate = 1.1; u.volume = Math.min(1, cfg.vol / 100);
      const v = s.getVoices().find(v => /^es/i.test(v.lang)); if (v) u.voice = v;
      s.speak(u); return true;
    } catch (_) { return false; }
  }
  /* ---------- audios propios: grabados con el micrófono o subidos ---------- */
  const MIO = {}, DEC = {}; // evento -> {ab, tipo} guardado | AudioBuffer listo para sonar
  const MAX_SEG = 6;
  const idb = () => new Promise((ok, ko) => { const r = indexedDB.open('tl-sonido', 1); r.onupgradeneeded = () => r.result.createObjectStore('audios'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  async function idbSet(k, v) { const db = await idb(); return new Promise((ok, ko) => { const t = db.transaction('audios', 'readwrite'); const st = t.objectStore('audios'); v == null ? st.delete(k) : st.put(v, k); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); }); }
  async function idbAll() { const db = await idb(); return new Promise(ok => { const out = {}; const rq = db.transaction('audios').objectStore('audios').openCursor(); rq.onsuccess = () => { const c = rq.result; if (c) { out[c.key] = c.value; c.continue(); } else ok(out); }; rq.onerror = () => ok(out); }); }
  const listos = (async () => { try { Object.assign(MIO, await idbAll()); } catch (_) {} })();
  // quita el silencio del principio y del final (al grabar siempre queda un poco) y corta a MAX_SEG
  function recortar(buf) {
    const d = buf.getChannelData(0), n = d.length, umbral = 0.02; let a = 0, z = n - 1;
    while (a < n && Math.abs(d[a]) < umbral) a++; while (z > a && Math.abs(d[z]) < umbral) z--;
    if (a >= z) return buf;
    a = Math.max(0, a - Math.round(buf.sampleRate * 0.02)); z = Math.min(n, z + Math.round(buf.sampleRate * 0.12), a + buf.sampleRate * MAX_SEG);
    const out = AC.createBuffer(buf.numberOfChannels, z - a, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) out.getChannelData(c).set(buf.getChannelData(c).subarray(a, z));
    return out;
  }
  async function decodificar(ev) {
    await listos; if (DEC[ev]) return DEC[ev]; if (!MIO[ev] || !ctx()) return null;
    try { const ab = MIO[ev].ab.slice(0); const b = await new Promise((ok, ko) => { const r = AC.decodeAudioData(ab, ok, ko); if (r && r.then) r.then(ok, ko); }); DEC[ev] = recortar(b); } catch (_) { DEC[ev] = null; }
    return DEC[ev];
  }
  function sonarBuffer(buf) { const src = AC.createBufferSource(), g = AC.createGain(); g.gain.value = 1.3; src.buffer = buf; src.connect(g); g.connect(OUT); src.start(AC.currentTime + 0.01); }
  async function guardarMio(ev, blob) {
    if (blob.size > 4 * 1024 * 1024) throw new Error('El archivo es muy grande (máximo 4 MB). Usa un audio corto.');
    const ab = await blob.arrayBuffer(); const prev = MIO[ev];
    MIO[ev] = { ab, tipo: blob.type || '' }; delete DEC[ev];
    if (!await decodificar(ev)) { if (prev) MIO[ev] = prev; else delete MIO[ev]; delete DEC[ev]; throw new Error('No se pudo leer ese audio. Prueba con un MP3, M4A o grabándolo aquí.'); }
    await idbSet(ev, MIO[ev]); cfg[ev] = 'mio'; guardar();
  }
  async function borrarMio(ev) { delete MIO[ev]; delete DEC[ev]; try { await idbSet(ev, null); } catch (_) {} }
  let REC = null;
  async function grabar(ev, alTerminar) {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Este navegador no permite grabar. Sube un archivo de audio.');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
    const mr = new MediaRecorder(stream), partes = [];
    mr.ondataavailable = e => e.data.size && partes.push(e.data);
    mr.onstop = async () => { stream.getTracks().forEach(t => t.stop()); clearTimeout(REC?.t); REC = null; let err = null;
      try { await guardarMio(ev, new Blob(partes, { type: mr.mimeType || 'audio/mp4' })); } catch (e) { err = e; } alTerminar(err); };
    mr.start(); REC = { mr, ev, t: setTimeout(() => mr.state === 'recording' && mr.stop(), MAX_SEG * 1000) };
  }
  function detener() { if (REC && REC.mr.state === 'recording') REC.mr.stop(); }

  const VIB = { inicio: [300], fin: [150, 80, 150], final: [400, 120, 400, 120, 600], cuenta: [80], prep: [60] };

  // suena el sonido elegido para un evento (n = número de la cuenta regresiva)
  function play(evento, n) {
    const id = evento === 'prep' ? cfg.cuenta : cfg[evento] || 'pitido';
    if (cfg.vib && navigator.vibrate) { try { navigator.vibrate(VIB[evento] || [100]); } catch (_) {} }
    if (id === 'ninguno') return;
    if (id === 'voz') { if (hablar(evento === 'cuenta' || evento === 'prep' ? String(n || '') || VOZ.prep : VOZ[evento] || '')) return; }
    if (!ctx()) return;
    if (id === 'mio' && evento !== 'cuenta' && evento !== 'prep') {
      if (DEC[evento]) return sonarBuffer(DEC[evento]);
      if (MIO[evento]) { decodificar(evento).then(b => b ? sonarBuffer(b) : SYN.pitido(AC.currentTime + .01)); return; }
    }
    const t = AC.currentTime + 0.02;
    if (evento === 'cuenta' || evento === 'prep') { (id === 'pitido' ? SYN.cuenta : SYN[id] || SYN.cuenta)(t); return; }
    (SYN[id] || SYN.pitido)(t);
  }
  function probar(id, evento) { const prev = cfg[evento]; cfg[evento] = id; play(evento, 3); cfg[evento] = prev; }
  // pitido simple (descansos entre series, botones): respeta el volumen elegido
  function tone(f = 880, ms = 140) { if (!ctx()) return; tono(f, AC.currentTime + 0.01, ms / 1000, { tipo: 'square', g: .35 }); }
  // desbloquea el audio en iPhone: llamar desde un toque del usuario
  function unlock() { if (!ctx()) return; tono(440, AC.currentTime, .01, { g: .0002 }); try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch (_) {}
    ['inicio', 'fin', 'final'].forEach(ev => cfg[ev] === 'mio' && decodificar(ev)); }

  /* ---------- panel de ajustes ---------- */
  const css = `#sndp{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
#sndp .sp{width:100%;max-width:480px;max-height:92vh;overflow:auto;background:#151316;color:#f3eff2;border:1px solid #2e292d;border-radius:18px 18px 0 0;padding:18px 16px max(18px,env(safe-area-inset-bottom));display:grid;gap:12px;font-family:Barlow,system-ui,sans-serif;text-align:left}
@media(min-width:600px){#sndp{align-items:center}#sndp .sp{border-radius:18px}}
#sndp h3{margin:0;font:800 22px 'Barlow Condensed',Barlow,sans-serif;letter-spacing:.04em;text-transform:uppercase;display:flex;justify-content:space-between;align-items:center}
#sndp h3 button{width:40px;height:40px;border-radius:10px;border:1px solid #3a3439;background:transparent;color:inherit;font-size:18px;cursor:pointer}
#sndp .row{display:grid;gap:6px;background:#1d1a1e;border:1px solid #2e292d;border-radius:12px;padding:10px}
#sndp .row>span{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#a79fa5;font-weight:700}
#sndp .ln{display:grid;grid-template-columns:1fr 52px;gap:8px;align-items:center}
#sndp select{height:46px;border-radius:10px;border:1px solid #3a3439;background:#0f0d10;color:inherit;font-size:16px;padding:0 10px}
#sndp .play{height:46px;border-radius:10px;border:1px solid #e3253d;background:#e3253d;color:#fff;font-size:18px;cursor:pointer}
#sndp input[type=range]{width:100%;height:36px;accent-color:#e3253d}
#sndp .vol{display:grid;grid-template-columns:1fr 64px 52px;gap:8px;align-items:center}
#sndp .vol b{font:800 24px 'Barlow Condensed',Barlow,sans-serif;text-align:center}
#sndp label.sw{display:flex;justify-content:space-between;align-items:center;font-size:16px;cursor:pointer}
#sndp label.sw input{width:24px;height:24px;accent-color:#e3253d}
#sndp .nota{font-size:13px;color:#a79fa5;line-height:1.35}
#sndp .mio{display:grid;gap:8px;border-top:1px dashed #3a3439;padding-top:8px}
#sndp .mio .est{font-size:14px;color:#d8d1d6}
#sndp .mb{display:flex;flex-wrap:wrap;gap:8px}
#sndp .mini{min-height:42px;padding:0 14px;border-radius:10px;border:1px solid #3a3439;background:#0f0d10;color:inherit;font:700 15px Barlow,system-ui,sans-serif;display:inline-flex;align-items:center;cursor:pointer}
#sndp .mini.rec{background:#e3253d;border-color:#e3253d;color:#fff;animation:sndrec 1s infinite}
@keyframes sndrec{50%{opacity:.6}}
#sndp .ok{height:52px;border-radius:12px;border:0;background:#e3253d;color:#fff;font:800 18px Barlow,sans-serif;cursor:pointer}`;
  function abrirPanel() {
    cerrarPanel();
    if (!document.getElementById('sndp-css')) { const st = document.createElement('style'); st.id = 'sndp-css'; st.textContent = css; document.head.appendChild(st); }
    const el = document.createElement('div'); el.id = 'sndp'; let aviso = {};
    const opts = (ev) => SONIDOS.filter(([id]) => ev !== 'cuenta' || !['campana', 'gong', 'bocina', 'mio'].includes(id))
      .map(([id, n]) => `<option value="${id}"${cfg[ev] === id ? ' selected' : ''}>${n}</option>`).join('');
    const mio = (ev) => { if (cfg[ev] !== 'mio') return '';
      const b = DEC[ev], grab = REC && REC.ev === ev;
      const estado = grab ? '🔴 Grabando… habla ahora (máx. ' + MAX_SEG + ' s)' : aviso[ev] || (b ? `✅ Tu audio está listo · ${b.duration.toFixed(1).replace('.', ',')} s` : MIO[ev] ? '✅ Tu audio está guardado' : 'Graba tu voz o sube un audio corto (1–3 segundos va perfecto).');
      return `<div class="mio"><div class="est">${estado}</div><div class="mb">
        <button class="mini${grab ? ' rec' : ''}" data-sg="${ev}">${grab ? '⏹ Detener' : '⏺ Grabar'}</button>
        <label class="mini">📁 Subir audio<input type="file" accept="audio/*" data-sf="${ev}" hidden></label>
        ${MIO[ev] ? `<button class="mini" data-sb="${ev}" aria-label="Borrar mi audio">🗑</button>` : ''}</div></div>`; };
    const render = () => { el.innerHTML = `<div class="sp" role="dialog" aria-label="Sonidos del temporizador">
      <h3>🔊 Sonidos <button data-sx="1" aria-label="Cerrar">✕</button></h3>
      <div class="row"><span>Volumen</span><div class="vol"><input type="range" min="0" max="100" step="5" value="${cfg.vol}" data-sv="1" aria-label="Volumen"><b id="sndp-v">${cfg.vol}%</b><button class="play" data-st="inicio" aria-label="Probar volumen">▶</button></div></div>
      ${EVENTOS.map(([ev, nom]) => `<div class="row"><span>${nom}</span><div class="ln"><select data-se="${ev}" aria-label="${nom}">${opts(ev)}</select><button class="play" data-st="${ev}" aria-label="Probar">▶</button></div>${mio(ev)}</div>`).join('')}
      <div class="row"><label class="sw">📳 Vibrar con cada aviso <input type="checkbox" data-svib="1"${cfg.vib ? ' checked' : ''}></label></div>
      <div class="nota">Toca ▶ para escuchar cada sonido. Si aun así se oye bajo, sube el volumen del teléfono con los botones laterales o conéctalo a un parlante Bluetooth. Los cambios y tus audios quedan guardados en este teléfono.</div>
      <button class="ok" data-sx="1">Listo</button></div>`; };
    const refrescar = () => { const y = el.querySelector('.sp')?.scrollTop || 0; render(); const sp = el.querySelector('.sp'); if (sp) sp.scrollTop = y; };
    el.addEventListener('click', async ev => {
      if (ev.target === el) return cerrarPanel();
      const b = ev.target.closest('button'); if (!b) return; ev.stopPropagation();
      if (b.dataset.sx) return cerrarPanel();
      if (b.dataset.st) { unlock(); play(b.dataset.st, 3); }
      if (b.dataset.sg) { const e = b.dataset.sg;
        if (REC) { detener(); return; }
        delete aviso[e]; unlock();
        try { await grabar(e, err => { aviso[e] = err ? '⚠️ ' + err.message : ''; if (!err) delete aviso[e]; refrescar(); if (!err) play(e); }); }
        catch (err) { aviso[e] = '⚠️ ' + (err.name === 'NotAllowedError' ? 'Permite el uso del micrófono para grabar, o sube un archivo.' : err.message); }
        refrescar(); }
      if (b.dataset.sb) { await borrarMio(b.dataset.sb); refrescar(); }
    });
    el.addEventListener('input', ev => {
      const t = ev.target;
      if (t.dataset.sv) { cfg.vol = Number(t.value); document.getElementById('sndp-v').textContent = cfg.vol + '%'; guardar(); }
    });
    el.addEventListener('change', async ev => {
      const t = ev.target;
      if (t.dataset.sv) { unlock(); play('cuenta', 3); }
      if (t.dataset.se) { cfg[t.dataset.se] = t.value; guardar(); unlock(); if (t.value !== 'mio' || MIO[t.dataset.se]) play(t.dataset.se, 3); if (t.value === 'mio') { await decodificar(t.dataset.se); } refrescar(); }
      if (t.dataset.svib) { cfg.vib = t.checked; guardar(); }
      if (t.dataset.sf && t.files && t.files[0]) { const e = t.dataset.sf; unlock(); aviso[e] = '⏳ Cargando…'; refrescar();
        try { await guardarMio(e, t.files[0]); delete aviso[e]; play(e); } catch (err) { aviso[e] = '⚠️ ' + err.message; } refrescar(); }
    });
    render(); document.body.appendChild(el);
    listos.then(() => Promise.all(['inicio', 'fin', 'final'].map(e => cfg[e] === 'mio' && decodificar(e)))).then(() => document.getElementById('sndp') === el && !REC && refrescar());
  }
  function cerrarPanel() { if (REC) detener(); document.getElementById('sndp')?.remove(); }

  window.SND = { play, tone, unlock, abrirPanel, cerrarPanel, probar, get cfg() { return Object.assign({}, cfg); } };
})();
