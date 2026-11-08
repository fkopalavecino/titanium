/* Titanium Sport · sonidos de los temporizadores (estilo Tabata Pro)
   Volumen ajustable, sonidos distintos para inicio, término, final y cuenta regresiva, voz y vibración.
   Todo se genera con Web Audio (sin archivos) y la configuración queda guardada en el teléfono. */
(function () {
  const KEY = 'tl-sonido';
  const DEF = { vol: 90, inicio: 'campana', fin: 'silbato', final: 'gong', cuenta: 'pitido', vib: true };
  let cfg = Object.assign({}, DEF);
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (_) {} };

  const SONIDOS = [
    ['campana', '🥊 Campana de box'], ['silbato', '📣 Silbato'], ['gong', '🔔 Gong'], ['bocina', '📯 Bocina'],
    ['pitido', '⏱ Pitido fuerte'], ['doble', '⏱⏱ Doble pitido'], ['digital', '⌚ Reloj digital'], ['subida', '📈 Tres tonos'],
    ['voz', '🗣 Voz'], ['ninguno', '🔇 Sin sonido']
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
  const VIB = { inicio: [300], fin: [150, 80, 150], final: [400, 120, 400, 120, 600], cuenta: [80], prep: [60] };

  // suena el sonido elegido para un evento (n = número de la cuenta regresiva)
  function play(evento, n) {
    const id = evento === 'prep' ? cfg.cuenta : cfg[evento] || 'pitido';
    if (cfg.vib && navigator.vibrate) { try { navigator.vibrate(VIB[evento] || [100]); } catch (_) {} }
    if (id === 'ninguno') return;
    if (id === 'voz') { if (hablar(evento === 'cuenta' || evento === 'prep' ? String(n || '') || VOZ.prep : VOZ[evento] || '')) return; }
    if (!ctx()) return;
    const t = AC.currentTime + 0.02;
    if (evento === 'cuenta' || evento === 'prep') { (id === 'pitido' ? SYN.cuenta : SYN[id] || SYN.cuenta)(t); return; }
    (SYN[id] || SYN.pitido)(t);
  }
  function probar(id, evento) { const prev = cfg[evento]; cfg[evento] = id; play(evento, 3); cfg[evento] = prev; }
  // pitido simple (descansos entre series, botones): respeta el volumen elegido
  function tone(f = 880, ms = 140) { if (!ctx()) return; tono(f, AC.currentTime + 0.01, ms / 1000, { tipo: 'square', g: .35 }); }
  // desbloquea el audio en iPhone: llamar desde un toque del usuario
  function unlock() { if (!ctx()) return; tono(440, AC.currentTime, .01, { g: .0002 }); try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch (_) {} }

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
#sndp .ok{height:52px;border-radius:12px;border:0;background:#e3253d;color:#fff;font:800 18px Barlow,sans-serif;cursor:pointer}`;
  function abrirPanel() {
    cerrarPanel();
    if (!document.getElementById('sndp-css')) { const s = document.createElement('style'); s.id = 'sndp-css'; s.textContent = css; document.head.appendChild(s); }
    const el = document.createElement('div'); el.id = 'sndp';
    const opts = (ev) => SONIDOS.filter(([id]) => ev !== 'cuenta' || !['campana', 'gong', 'bocina'].includes(id))
      .map(([id, n]) => `<option value="${id}"${cfg[ev] === id ? ' selected' : ''}>${n}</option>`).join('');
    el.innerHTML = `<div class="sp" role="dialog" aria-label="Sonidos del temporizador">
      <h3>🔊 Sonidos <button data-sx="1" aria-label="Cerrar">✕</button></h3>
      <div class="row"><span>Volumen</span><div class="vol"><input type="range" min="0" max="100" step="5" value="${cfg.vol}" data-sv="1" aria-label="Volumen"><b id="sndp-v">${cfg.vol}%</b><button class="play" data-st="inicio" aria-label="Probar volumen">▶</button></div></div>
      ${EVENTOS.map(([ev, nom]) => `<div class="row"><span>${nom}</span><div class="ln"><select data-se="${ev}" aria-label="${nom}">${opts(ev)}</select><button class="play" data-st="${ev}" aria-label="Probar">▶</button></div></div>`).join('')}
      <div class="row"><label class="sw">📳 Vibrar con cada aviso <input type="checkbox" data-svib="1"${cfg.vib ? ' checked' : ''}></label></div>
      <div class="nota">Toca ▶ para escuchar cada sonido. Si aun así se oye bajo, sube el volumen del teléfono con los botones laterales o conéctalo a un parlante Bluetooth. Los cambios quedan guardados en este teléfono.</div>
      <button class="ok" data-sx="1">Listo</button></div>`;
    el.addEventListener('click', ev => {
      if (ev.target === el) return cerrarPanel();
      const b = ev.target.closest('button'); if (!b) return; ev.stopPropagation();
      if (b.dataset.sx) return cerrarPanel();
      if (b.dataset.st) { unlock(); play(b.dataset.st, 3); }
    });
    el.addEventListener('input', ev => {
      const t = ev.target;
      if (t.dataset.sv) { cfg.vol = Number(t.value); document.getElementById('sndp-v').textContent = cfg.vol + '%'; guardar(); }
    });
    el.addEventListener('change', ev => {
      const t = ev.target;
      if (t.dataset.sv) { unlock(); play('cuenta', 3); }
      if (t.dataset.se) { cfg[t.dataset.se] = t.value; guardar(); unlock(); play(t.dataset.se, 3); }
      if (t.dataset.svib) { cfg.vib = t.checked; guardar(); }
    });
    document.body.appendChild(el);
  }
  function cerrarPanel() { document.getElementById('sndp')?.remove(); }

  window.SND = { play, tone, unlock, abrirPanel, cerrarPanel, probar, get cfg() { return Object.assign({}, cfg); } };
})();
