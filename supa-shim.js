/* Titanium · capa de datos sobre Supabase.
   Imita la API que usaba la app dentro de Claude (claude.use('db'), 'downloads')
   para que el panel del entrenador funcione igual, ahora con login propio. */
(function () {
  const SUPA_URL = 'https://lnovgbpxdnqgsojkfzwy.supabase.co';
  const SUPA_KEY = 'sb_publishable_bznoEpakz7dvipb4bOvsvA_DGm_1MU2';
  const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  window.__sb = sb;

  /* ---------- login ---------- */
  const css = `
  #tl-gate{position:fixed;inset:0;z-index:9999;background:#0e0c0f;color:#f2eef0;font-family:Barlow,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px}
  #tl-gate .box{width:100%;max-width:380px;display:flex;flex-direction:column;gap:14px}
  #tl-gate h1{font-family:'Barlow Condensed',sans-serif;font-size:48px;line-height:.95;margin:0}
  #tl-gate h1 span{color:#d71f30}
  #tl-gate p{color:#a69ea3;margin:0;font-size:15px;line-height:1.45}
  #tl-gate label{display:flex;flex-direction:column;gap:6px;font-size:14px;color:#a69ea3}
  #tl-gate input{height:50px;border-radius:12px;border:1px solid #2f2a2e;background:#1b181c;color:#f2eef0;padding:0 14px;font:500 17px Barlow,sans-serif}
  #tl-gate button{height:50px;border-radius:12px;border:0;background:#d71f30;color:#fff;font:700 17px Barlow,sans-serif;cursor:pointer}
  #tl-gate button.sec{background:transparent;border:1px solid #2f2a2e;color:#f2eef0}
  #tl-gate .err{color:#ff8a94;font-size:14px;min-height:18px}`;
  function gateHTML(step, email) {
    return `<div class="box"><h1>TITANIUM<br><span>SPORT</span></h1>
      ${step === 'email' ? `<p>Entra con tu correo. Te enviamos un código para entrar.</p>
        <form id="tl-f1" style="display:flex;flex-direction:column;gap:12px"><label>Tu correo<input id="tl-email" type="email" autocomplete="email" required value="${email || ''}"></label><button>Enviarme el código</button></form>`
      : `<p>Revisa tu correo <b style="color:#f2eef0">${email}</b> y escribe aquí el código que te llegó (si no lo ves, mira en Spam).</p>
        <form id="tl-f2" style="display:flex;flex-direction:column;gap:12px"><label>Código<input id="tl-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></label><button>Entrar</button><button type="button" class="sec" id="tl-back">Usar otro correo</button></form>`}
      <div class="err" id="tl-err"></div></div>`;
  }
  function showGate(onDone) {
    let st = document.getElementById('tl-style');
    if (!st) { st = document.createElement('style'); st.id = 'tl-style'; st.textContent = css; document.head.appendChild(st); }
    const g = document.createElement('div'); g.id = 'tl-gate'; document.body.appendChild(g);
    let email = localStorage.getItem('tl-email') || '';
    const err = m => { const e = document.getElementById('tl-err'); if (e) e.textContent = m || ''; };
    const step1 = () => {
      g.innerHTML = gateHTML('email', email);
      document.getElementById('tl-f1').onsubmit = async ev => {
        ev.preventDefault(); email = document.getElementById('tl-email').value.trim().toLowerCase();
        try { localStorage.setItem('tl-email', email); } catch (e) {}
        const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } });
        if (error) { err(error.status === 429 ? 'Se pidieron muchos códigos. Espera unos minutos.' : 'No se pudo enviar el código: ' + error.message); return; }
        step2();
      };
    };
    const step2 = () => {
      g.innerHTML = gateHTML('code', email);
      document.getElementById('tl-back').onclick = step1;
      document.getElementById('tl-f2').onsubmit = async ev => {
        ev.preventDefault();
        const token = document.getElementById('tl-code').value.trim();
        const { error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
        if (error) { err('Código incorrecto o vencido.'); return; }
        g.remove(); onDone();
      };
    };
    step1();
    const { data: sub } = sb.auth.onAuthStateChange((ev, ses) => { if (ses && document.getElementById('tl-gate')) { sub.subscription.unsubscribe(); g.remove(); onDone(); } });
  }
  async function ensureSession() {
    const { data } = await sb.auth.getSession();
    if (data.session) return data.session;
    await new Promise(res => showGate(res));
    return (await sb.auth.getSession()).data.session;
  }
  window.tlLogout = async () => { await sb.auth.signOut(); location.reload(); };

  /* ---------- conversión de filas ---------- */
  const A2R = a => ({ codigo: a.codigo, nombre: a.nombre || a.codigo, email: a.email ? String(a.email).trim().toLowerCase() : null, telefono: a.telefono || null,
    estado: a.estado || 'activo', bloques: a.bloques || [], clases: a.clases == null || a.clases === '' ? null : Number(a.clases),
    nacimiento: a.nacimiento || null, notas: a.notas || null, ingreso: a.ingreso || null, programa: a.programa || null,
    programas_hechos: a.programasHechos || [], fotos: a.fotos || [], medidas: a.medidas || [], inbody: a.inbody || [], updated_at: new Date().toISOString() });
  const R2A = (r, planes) => { const a = { codigo: r.codigo, nombre: r.nombre, telefono: r.telefono || '', estado: r.estado, bloques: r.bloques || [], clases: r.clases,
    notas: r.notas || '', planes: planes || [] };
    if (r.email) a.email = r.email; if (r.nacimiento) a.nacimiento = r.nacimiento; if (r.ingreso) a.ingreso = r.ingreso;
    if (r.programa !== undefined) a.programa = r.programa; if (r.programas_hechos && r.programas_hechos.length) a.programasHechos = r.programas_hechos;
    if (r.fotos && r.fotos.length) a.fotos = r.fotos; if (r.medidas && r.medidas.length) a.medidas = r.medidas; if (r.inbody && r.inbody.length) a.inbody = r.inbody; if (r.perfil && Object.keys(r.perfil).length) a.perfil = r.perfil; if (r.user_id) a.vinculado = true; return a; };
  const P2R = (code, p) => ({ id: p.id, alumno: code, mes: p.mes || null, inicio: p.inicio || null, fin: p.fin || null,
    clases: p.clases == null || p.clases === '' ? null : Number(p.clases), monto: Number(p.monto) || 0, pagos: p.pagos || [], updated_at: new Date().toISOString() });
  const R2P = r => ({ id: r.id, mes: r.mes, inicio: r.inicio, fin: r.fin, clases: r.clases, monto: r.monto, pagos: r.pagos || [] });
  const CMAP = { reagA: 'reag_a', reagDe: 'reag_de', notas: 'nota' };
  const CBACK = { reag_a: 'reagA', reag_de: 'reagDe', nota: 'notas' };
  const CFIELDS = ['asis', 'rutina', 'aprobada', 'extra', 'quitado', 'reag_a', 'reag_de', 'sesion', 'ej', 'carga', 'rpe', 'nota'];
  const rec2row = (fecha, hora, code, r) => { const row = { fecha, hora, alumno: code, updated_at: new Date().toISOString() };
    CFIELDS.forEach(f => row[f] = null);
    for (const k in r) { const f = CMAP[k] || k; if (CFIELDS.includes(f)) row[f] = r[k] === '' ? null : r[k]; }
    if (row.rpe != null && isNaN(Number(row.rpe))) row.rpe = null; return row; };
  const row2rec = row => { const r = {}; CFIELDS.forEach(f => { if (row[f] != null) r[CBACK[f] || f] = f === 'rpe' ? String(row[f]) : row[f]; }); return r; };

  async function all(table, q) { let out = [], from = 0; for (;;) { let qq = sb.from(table).select(q || '*').range(from, from + 999); const { data, error } = await qq; if (error) throw error; out = out.concat(data); if (data.length < 1000) return out; from += 1000; } }

  /* ---------- fotos (Supabase Storage, bucket privado) ---------- */
  const URLS = {};
  async function firmarFotos(ids) { const need = [...new Set(ids.filter(id => id && !URLS[id]))];
    for (let i = 0; i < need.length; i += 100) { const { data } = await sb.storage.from('fotos').createSignedUrls(need.slice(i, i + 100), 3600 * 24 * 6);
      (data || []).forEach(x => { if (x.signedUrl) URLS[x.path] = x.signedUrl; }); } }
  window.tlFotoURL = id => URLS[id] || '';
  const assets = {
    upload: async blob => { const id = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2)) + '.jpg';
      const { error } = await sb.storage.from('fotos').upload(id, blob, { contentType: 'image/jpeg', upsert: false }); if (error) throw error;
      await firmarFotos([id]); return { id }; },
    delete: async id => { await sb.storage.from('fotos').remove([id]); delete URLS[id]; },
  };

  /* ---------- colecciones ---------- */
  const loaders = {
    alumnos: async () => { const [al, pl] = await Promise.all([all('alumnos'), all('planes')]);
      const byA = {}; pl.forEach(p => (byA[p.alumno] = byA[p.alumno] || []).push(R2P(p)));
      Object.values(byA).forEach(l => l.sort((x, y) => String(x.inicio || x.mes || '').localeCompare(String(y.inicio || y.mes || ''))));
      await firmarFotos(al.flatMap(r => (Array.isArray(r.fotos) ? r.fotos : []).flatMap(x => [x.frente, x.perfil, x.espalda]).concat((Array.isArray(r.inbody) ? r.inbody : []).map(x => x && x.img)).concat(r.perfil && r.perfil.avatar ? [r.perfil.avatar] : [])));
      return al.map(r => [r.codigo, R2A(r, byA[r.codigo])]); },
    rutinas: async () => (await all('rutinas')).map(r => [r.id, r.data]),
    dias: async () => { const rows = await all('clases'); const m = {};
      rows.forEach(r => { const d = m[r.fecha] = m[r.fecha] || { fecha: r.fecha, bloques: {} }; (d.bloques[r.hora] = d.bloques[r.hora] || {})[r.alumno] = row2rec(r); });
      return Object.entries(m); },
  };
  const TABLES = { alumnos: ['alumnos', 'planes'], rutinas: ['rutinas'], dias: ['clases'] };
  const subs = { alumnos: [], rutinas: [], dias: [], cfg: [] };
  const timers = {};
  const snap = list => ({ docs: list.map(([id, v]) => ({ id, exists: true, data: () => v })), size: list.length });
  async function refresh(name) {
    try { if (name === 'cfg') { const { data } = await sb.from('config').select('data').eq('id', 1).maybeSingle(); const d = { exists: !!data, data: () => data ? data.data : undefined }; subs.cfg.forEach(f => f.ok(d)); return; }
      const list = await loaders[name](); const s = snap(list); subs[name].forEach(f => f.ok(s)); }
    catch (e) { console.error(e); subs[name].forEach(f => f.err && f.err(e)); }
  }
  const soon = name => { clearTimeout(timers[name]); timers[name] = setTimeout(() => refresh(name), 400); };
  let channel = null;
  function listen() {
    if (channel) return;
    channel = sb.channel('titanium');
    [['alumnos', 'alumnos'], ['planes', 'alumnos'], ['rutinas', 'rutinas'], ['clases', 'dias'], ['config', 'cfg']].forEach(([t, n]) =>
      channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => soon(n)));
    channel.subscribe();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) ['alumnos', 'rutinas', 'dias', 'cfg'].forEach(soon); });
  }

  /* ---------- escrituras ---------- */
  const must = ({ error }) => { if (error) throw error; };
  async function setDoc(path, v) {
    const [col, id] = path.split('/');
    if (col === 'alumnos') {
      must(await sb.from('alumnos').upsert(A2R(v)));
      const planes = (v.planes || []).map(p => P2R(v.codigo, p));
      if (planes.length) must(await sb.from('planes').upsert(planes));
      const keep = planes.map(p => p.id);
      let del = sb.from('planes').delete().eq('alumno', v.codigo);
      if (keep.length) del = del.not('id', 'in', '(' + keep.map(x => '"' + x.replace(/"/g, '') + '"').join(',') + ')');
      must(await del);
    } else if (col === 'rutinas') {
      must(await sb.from('rutinas').upsert({ id, data: v, updated_at: new Date().toISOString() }));
    } else if (col === 'dias') {
      const rows = []; for (const h in v.bloques || {}) for (const c in v.bloques[h]) rows.push(rec2row(id, h, c, v.bloques[h][c]));
      if (rows.length) must(await sb.from('clases').upsert(rows));
      const { data: cur, error } = await sb.from('clases').select('hora,alumno').eq('fecha', id); if (error) throw error;
      const want = new Set(rows.map(r => r.hora + '|' + r.alumno));
      for (const r of cur) if (!want.has(r.hora + '|' + r.alumno)) must(await sb.from('clases').delete().eq('fecha', id).eq('hora', r.hora).eq('alumno', r.alumno));
    } else if (col === 'config') {
      must(await sb.from('config').upsert({ id: 1, data: v }));
    }
  }
  async function delDoc(path) {
    const [col, id] = path.split('/');
    if (col === 'alumnos') must(await sb.from('alumnos').delete().eq('codigo', id));
    else if (col === 'rutinas') must(await sb.from('rutinas').delete().eq('id', id));
    else if (col === 'dias') must(await sb.from('clases').delete().eq('fecha', id));
  }

  const db = {
    collection: name => ({
      onSnapshot(ok, err) { subs[name].push({ ok, err }); listen(); refresh(name); return () => { subs[name] = subs[name].filter(x => x.ok !== ok); }; },
    }),
    doc: path => ({
      set: v => setDoc(path, v),
      delete: () => delDoc(path),
      onSnapshot(ok, err) { if (path === 'config/general') { subs.cfg.push({ ok, err }); listen(); refresh('cfg'); } return () => {}; },
    }),
  };
  const downloads = {
    save: async ({ filename, data }) => { const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
      const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); },
  };

  window.tlSession = ensureSession;
  if (window.TL_MODE === 'alumno') return;

  /* ---------- solicitudes de alumnos (panel flotante del entrenador) ---------- */
  const TIPO = { no_voy: 'No puede ir', recuperar: 'Quiere recuperar', pago: 'Avisa un pago', mensaje: 'Mensaje' };
  async function solicitudes() {
    const { data } = await sb.from('solicitudes').select('*').eq('estado', 'pendiente').order('created_at');
    const list = data || [];
    let b = document.getElementById('tl-sol');
    if (!b) { b = document.createElement('button'); b.id = 'tl-sol';
      b.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:900;height:48px;padding:0 16px;border-radius:24px;border:0;background:#d71f30;color:#fff;font:700 15px Barlow,system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer';
      b.onclick = () => abrirSol(); document.body.appendChild(b); }
    b.hidden = !list.length; b.textContent = 'Solicitudes de alumnos (' + list.length + ')'; window.__tlSol = list;
  }
  function abrirSol() {
    const list = window.__tlSol || []; let p = document.getElementById('tl-solp'); if (p) p.remove();
    p = document.createElement('div'); p.id = 'tl-solp';
    p.style.cssText = 'position:fixed;right:16px;bottom:72px;z-index:901;width:min(380px,calc(100vw - 32px));max-height:60vh;overflow:auto;background:#1b181c;color:#f2eef0;border:1px solid #2f2a2e;border-radius:14px;padding:14px;font:14px Barlow,system-ui,sans-serif;display:grid;gap:10px';
    const esc = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    p.innerHTML = '<b style="font-size:16px">Solicitudes</b>' + list.map(r => { const d = r.data || {};
      return '<div style="border-top:1px solid #2f2a2e;padding-top:8px;display:grid;gap:6px"><div><b>' + esc(d.nombre || r.alumno) + '</b> · ' + esc(TIPO[r.tipo] || r.tipo) + '</div>'
        + '<div style="color:#a69ea3">' + esc([d.fecha, d.hora, d.prefiere, d.monto, d.texto].filter(Boolean).join(' · ')) + '</div>'
        + '<div style="display:flex;gap:8px"><button data-id="' + r.id + '" data-e="aprobada" style="flex:1;height:36px;border:0;border-radius:8px;background:#17804a;color:#fff;font-weight:700">Listo</button><button data-id="' + r.id + '" data-e="rechazada" style="flex:1;height:36px;border:1px solid #2f2a2e;border-radius:8px;background:transparent;color:#f2eef0">Rechazar</button></div></div>'; }).join('')
      + '<p style="margin:0;color:#a69ea3;font-size:12px">Para mover la clase usa ↻ Reagendar en Clase de hoy y luego marca «Listo».</p>';
    p.onclick = async ev => { const t = ev.target.closest('button[data-id]'); if (!t) return;
      await sb.from('solicitudes').update({ estado: t.dataset.e }).eq('id', t.dataset.id); p.remove(); solicitudes(); };
    document.body.appendChild(p);
  }

  /* ---------- agenda de alumnos: reuniones, evaluaciones, nutrición, documentos ---------- */
  const TIPOS = ['Reunión', 'Evaluación', 'Nutrición', 'Documento', 'Actividad', 'Evento', 'Otro'];
  const TICO = { 'Reunión': '👥', 'Evaluación': '📋', 'Nutrición': '🥗', 'Documento': '📄', 'Actividad': '🏃', 'Evento': '⭐', 'Otro': '📌' };
  const TEJ = { 'Reunión': 'Ej: Reunión de objetivos', 'Evaluación': 'Ej: Evaluación InBody', 'Nutrición': 'Ej: Tu pauta de alimentación', 'Documento': 'Ej: Programa de 8 semanas', 'Actividad': 'Ej: Hiking grupal', 'Evento': 'Ej: Competencia Titanium', 'Otro': 'Ej: Recordatorio' };
  const escA = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const AGCSS = `
#tl-agb{position:fixed;left:max(16px,env(safe-area-inset-left));bottom:calc(16px + env(safe-area-inset-bottom));z-index:900;height:48px;padding:0 18px;border-radius:24px;border:1px solid #2f2a2e;background:#0e0c0f;color:#fff;font:700 15px Barlow,system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer;display:flex;align-items:center;gap:8px;-webkit-tap-highlight-color:transparent}
#tl-agp{position:fixed;inset:0;z-index:950;background:rgba(10,6,8,.6);display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));font:15px Barlow,system-ui,sans-serif;color:#f2eef0}
#tl-agp *{box-sizing:border-box}
#tl-agp .sh{background:#1b181c;border:1px solid #2f2a2e;border-radius:18px;width:min(580px,100%);max-height:min(860px,100%);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}
#tl-agp header{display:grid;gap:12px;padding:16px 18px 12px;border-bottom:1px solid #2f2a2e}
#tl-agp .hd{display:flex;justify-content:space-between;align-items:center;gap:8px}
#tl-agp h3{margin:0;font:800 22px Barlow,system-ui,sans-serif;letter-spacing:.01em}
#tl-agp .x{width:44px;height:44px;border-radius:12px;border:1px solid #2f2a2e;background:#161317;color:#f2eef0;font-size:18px;cursor:pointer}
#tl-agp .seg{display:grid;grid-template-columns:1fr 1fr;background:#161317;border:1px solid #2f2a2e;border-radius:12px;padding:3px}
#tl-agp .seg button{height:40px;border:0;border-radius:9px;background:transparent;color:#a69ea3;font:700 15px Barlow,sans-serif;cursor:pointer}
#tl-agp .seg button[aria-selected=true]{background:#d71f30;color:#fff}
#tl-agp .bd{overflow:auto;-webkit-overflow-scrolling:touch;padding:16px 18px;display:grid;gap:16px;flex:1;overscroll-behavior:contain}
#tl-agp .lb{display:grid;gap:6px;color:#a69ea3;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
#tl-agp .lb small{font-weight:500;text-transform:none;letter-spacing:0}
#tl-agp input:not([type=file]),#tl-agp select,#tl-agp textarea{-webkit-appearance:none;appearance:none;display:block;width:100%;min-height:48px;border-radius:12px;border:1px solid #2f2a2e;background:#161317;color:#f2eef0;padding:0 12px;font:16px Barlow,system-ui,sans-serif;text-transform:none;letter-spacing:0}
#tl-agp textarea{padding:12px;min-height:84px;resize:vertical}
#tl-agp select{background-image:linear-gradient(45deg,transparent 50%,#a69ea3 50%),linear-gradient(135deg,#a69ea3 50%,transparent 50%);background-position:calc(100% - 18px) 21px,calc(100% - 13px) 21px;background-size:5px 5px;background-repeat:no-repeat;padding-right:34px}
#tl-agp input::-webkit-date-and-time-value{text-align:left}
#tl-agp input:focus,#tl-agp select:focus,#tl-agp textarea:focus{outline:2px solid #d71f30;outline-offset:1px}
#tl-agp .tipos{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#tl-agp .tipos button{min-height:64px;border-radius:12px;border:1px solid #2f2a2e;background:#161317;color:#f2eef0;font:600 13px Barlow,sans-serif;display:grid;place-items:center;gap:2px;padding:6px 4px;cursor:pointer}
#tl-agp .tipos button span{font-size:22px;line-height:1}
#tl-agp .tipos button[aria-pressed=true]{border-color:#4da3ff;background:rgba(77,163,255,.15);color:#fff}
#tl-agp .two{display:grid;grid-template-columns:1.4fr 1fr;gap:10px}
#tl-agp .quick{display:flex;gap:6px;flex-wrap:wrap}
#tl-agp .quick button{height:34px;padding:0 12px;border-radius:17px;border:1px solid #2f2a2e;background:transparent;color:#a69ea3;font:600 13px Barlow,sans-serif;cursor:pointer}
#tl-agp .quick button[aria-pressed=true]{color:#fff;border-color:#f2eef0}
#tl-agp details{border:1px solid #2f2a2e;border-radius:12px;background:#161317}
#tl-agp summary{list-style:none;cursor:pointer;min-height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-weight:700}
#tl-agp summary::-webkit-details-marker{display:none}
#tl-agp summary::after{content:'＋';color:#a69ea3}
#tl-agp details[open] summary::after{content:'－'}
#tl-agp details .in{padding:0 14px 14px;display:grid;gap:12px}
#tl-agp details input:not([type=file]){background:#1b181c}
#tl-agp .file{display:flex;align-items:center;gap:10px;min-height:48px;border:1px dashed #4a4247;border-radius:12px;padding:0 12px;cursor:pointer;color:#f2eef0;font-weight:600}
#tl-agp .file input{position:absolute;opacity:0;width:1px;height:1px}
#tl-agp .file .nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#tl-agp .file .rm{border:0;background:none;color:#ff8a94;font-size:18px;width:36px;height:36px;cursor:pointer}
#tl-agp footer{padding:12px 18px calc(12px + env(safe-area-inset-bottom));border-top:1px solid #2f2a2e;display:grid;gap:8px;background:#1b181c}
#tl-agp .ok{height:52px;border-radius:12px;border:0;background:#d71f30;color:#fff;font:800 16px Barlow,sans-serif;cursor:pointer}
#tl-agp .ok:disabled{opacity:.6}
#tl-agp .msg{min-height:18px;font-size:14px;text-align:center}
#tl-agp .day{color:#a69ea3;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
#tl-agp .it{display:flex;align-items:center;gap:12px;background:#161317;border:1px solid #2f2a2e;border-left:4px solid #4da3ff;border-radius:12px;padding:10px 6px 10px 12px}
#tl-agp .it .ic{font-size:22px}
#tl-agp .it .tx{flex:1;min-width:0}
#tl-agp .it b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#tl-agp .it .mt{color:#a69ea3;font-size:13px}
#tl-agp .it .del{width:44px;height:44px;border:0;border-radius:10px;background:none;color:#ff8a94;font-size:18px;cursor:pointer;flex:none}
#tl-agp .empty{color:#a69ea3;text-align:center;padding:30px 0}
@media (max-width:640px){
  #tl-agb{height:44px;padding:0 14px;font-size:14px}
  #tl-agp{align-items:flex-end;padding:env(safe-area-inset-top) 0 0}
  #tl-agp .sh{width:100%;max-height:94%;height:94%;border-radius:20px 20px 0 0;border-bottom:0}
  #tl-agp header{padding-top:8px}
  #tl-agp header::before{content:'';width:40px;height:5px;border-radius:3px;background:#4a4247;justify-self:center}
  #tl-agp .tipos{grid-template-columns:repeat(4,1fr);gap:6px}
  #tl-agp .tipos button{min-height:58px;font-size:12px}
  #tl-agp .two{grid-template-columns:1fr 1fr}
}`;
  function agendaBtn() {
    if (document.getElementById('tl-agb')) return;
    if (!document.getElementById('tl-agcss')) { const st = document.createElement('style'); st.id = 'tl-agcss'; st.textContent = AGCSS; document.head.appendChild(st); }
    const b = document.createElement('button'); b.id = 'tl-agb'; b.innerHTML = '<span aria-hidden="true">📅</span> Agenda alumnos';
    b.onclick = abrirAgenda; document.body.appendChild(b);
  }
  const isoD = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const masDias = n => { const d = new Date(); d.setDate(d.getDate() + n); return isoD(d); };
  const diaLargo = f => { const t = new Date(f + 'T12:00:00'); const s = t.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    return f === masDias(0) ? 'Hoy · ' + s : f === masDias(1) ? 'Mañana · ' + s : s; };
  async function abrirAgenda() {
    if (document.getElementById('tl-agp')) return;
    const iso = masDias(0);
    const p = document.createElement('div'); p.id = 'tl-agp';
    p.innerHTML = '<div class="sh"><div class="bd"><div class="empty">Cargando…</div></div></div>';
    document.body.appendChild(p); const prevOv = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const cerrar = () => { p.remove(); document.body.style.overflow = prevOv; document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') cerrar(); }; document.addEventListener('keydown', onKey);
    const { data: al } = await sb.from('alumnos').select('codigo,nombre,estado').order('nombre');
    const act = (al || []).filter(a => a.estado !== 'inactivo');
    const nom = Object.fromEntries((al || []).map(a => [a.codigo, a.nombre]));
    let tipo = 'Reunión', vista = 'nuevo', eventos = [];
    p.innerHTML = `<div class="sh" role="dialog" aria-modal="true" aria-labelledby="tl-ag-h">
      <header><div class="hd"><h3 id="tl-ag-h">Agenda de alumnos</h3><button class="x" data-x="1" aria-label="Cerrar">✕</button></div>
        <div class="seg" role="tablist"><button role="tab" data-v="nuevo" aria-selected="true">＋ Nuevo</button><button role="tab" data-v="prox" aria-selected="false">Próximos <span id="tl-ag-n"></span></button></div></header>
      <div class="bd" id="tl-ag-nuevo">
        <label class="lb">¿Para quién?<select id="tl-ag-al"><option value="">👥 Todos los alumnos</option>${act.map(a => `<option value="${escA(a.codigo)}">${escA(a.nombre)}</option>`).join('')}</select></label>
        <div class="lb">Tipo<div class="tipos">${TIPOS.map(t => `<button type="button" data-t="${t}" aria-pressed="${t === tipo}"><span>${TICO[t]}</span>${t}</button>`).join('')}</div></div>
        <div class="lb">Cuándo<div class="two"><input id="tl-ag-fecha" type="date" value="${iso}" aria-label="Fecha"><input id="tl-ag-hora" type="time" aria-label="Hora (opcional)"></div>
          <div class="quick"><button type="button" data-q="0" aria-pressed="true">Hoy</button><button type="button" data-q="1" aria-pressed="false">Mañana</button><button type="button" data-q="7" aria-pressed="false">En 1 semana</button><button type="button" data-q="h" aria-pressed="false">Sin hora</button></div></div>
        <label class="lb">Título<input id="tl-ag-tit" placeholder="${TEJ[tipo]}" autocomplete="off"></label>
        <label class="lb">Detalle <small>(opcional)</small><textarea id="tl-ag-det" rows="3" placeholder="Qué traer, dónde, indicaciones…"></textarea></label>
        <details id="tl-ag-adj"><summary>📎 Adjuntar archivo o enlace</summary><div class="in">
          <label class="file"><span aria-hidden="true">📄</span><span class="nm" id="tl-ag-fn">Elegir PDF o imagen (máx. 15 MB)</span><button type="button" class="rm" id="tl-ag-rm" hidden aria-label="Quitar archivo">✕</button><input id="tl-ag-file" type="file" accept="application/pdf,image/*"></label>
          <label class="lb">Enlace <small>(Drive, Zoom, Meet, video)</small><input id="tl-ag-link" type="url" inputmode="url" placeholder="https://…" autocomplete="off"></label></div></details>
      </div>
      <div class="bd" id="tl-ag-prox" hidden></div>
      <footer id="tl-ag-foot"><div class="msg" id="tl-ag-msg" role="status"></div><button class="ok" id="tl-ag-ok">Guardar en la agenda</button></footer></div>`;
    const $ = id => document.getElementById(id);
    const msg = (t, c) => { $('tl-ag-msg').style.color = c || '#6fd39a'; $('tl-ag-msg').textContent = t; };
    const marcaQuick = () => { const f = $('tl-ag-fecha').value; p.querySelectorAll('[data-q]').forEach(b => b.setAttribute('aria-pressed', b.dataset.q === 'h' ? String(!$('tl-ag-hora').value) : String(f === masDias(+b.dataset.q)))); };
    const pintar = () => {
      $('tl-ag-n').textContent = eventos.length ? '(' + eventos.length + ')' : '';
      const g = {}; eventos.forEach(e => (g[e.fecha] = g[e.fecha] || []).push(e));
      $('tl-ag-prox').innerHTML = eventos.length ? Object.keys(g).map(f => `<div class="day">${escA(diaLargo(f))}</div>` + g[f].map(e => `<div class="it"><span class="ic" aria-hidden="true">${TICO[e.tipo] || '📌'}</span><div class="tx"><b>${escA(e.titulo)}</b><div class="mt">${e.hora ? escA(e.hora.slice(0, 5)) : 'Todo el día'} · ${escA(e.alumno ? (nom[e.alumno] || e.alumno) : 'Todos')}${e.adjunto ? ' · 📎' : ''}${e.link ? ' · 🔗' : ''}</div></div><button class="del" data-del="${e.id}" data-adj="${escA(e.adjunto || '')}" aria-label="Borrar ${escA(e.titulo)}">🗑</button></div>`).join('')).join('')
        : '<div class="empty">Nada agendado todavía.<br>Usa «＋ Nuevo» para agregar.</div>';
    };
    const lista = async () => { const { data } = await sb.from('eventos').select('*').gte('fecha', iso).order('fecha').order('hora', { nullsFirst: true }).limit(60); eventos = data || []; pintar(); };
    const ver = v => { vista = v; p.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === v)));
      $('tl-ag-nuevo').hidden = v !== 'nuevo'; $('tl-ag-prox').hidden = v !== 'prox'; $('tl-ag-foot').hidden = v !== 'nuevo'; };
    const limpiarArchivo = () => { $('tl-ag-file').value = ''; $('tl-ag-fn').textContent = 'Elegir PDF o imagen (máx. 15 MB)'; $('tl-ag-rm').hidden = true; };
    $('tl-ag-file').onchange = () => { const f = $('tl-ag-file').files[0]; if (!f) return limpiarArchivo(); $('tl-ag-fn').textContent = f.name; $('tl-ag-rm').hidden = false; };
    $('tl-ag-fecha').oninput = marcaQuick; $('tl-ag-hora').oninput = marcaQuick;
    p.onclick = async ev => {
      if (ev.target === p || ev.target.closest('[data-x]')) return cerrar();
      const tv = ev.target.closest('[data-v]'); if (tv) return ver(tv.dataset.v);
      const tt = ev.target.closest('[data-t]'); if (tt) { tipo = tt.dataset.t; p.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', String(b === tt))); $('tl-ag-tit').placeholder = TEJ[tipo];
        if (tipo === 'Documento' || tipo === 'Nutrición') $('tl-ag-adj').open = true; return; }
      const q = ev.target.closest('[data-q]'); if (q) { if (q.dataset.q === 'h') $('tl-ag-hora').value = ''; else $('tl-ag-fecha').value = masDias(+q.dataset.q); marcaQuick(); return; }
      if (ev.target.closest('#tl-ag-rm')) { ev.preventDefault(); return limpiarArchivo(); }
      const d = ev.target.closest('[data-del]'); if (d) { if (!confirm('¿Borrar este evento de la agenda?')) return;
        await sb.from('eventos').delete().eq('id', d.dataset.del); if (d.dataset.adj) await sb.storage.from('fotos').remove([d.dataset.adj]); lista(); return; }
      if (ev.target.closest('#tl-ag-ok')) {
        const v = id => $(id).value.trim(); const ok = $('tl-ag-ok');
        if (!v('tl-ag-tit')) { msg('Ponle un título al evento.', '#ff8a94'); $('tl-ag-tit').focus(); return; }
        if (!v('tl-ag-fecha')) { msg('Elige la fecha.', '#ff8a94'); return; }
        let link = v('tl-ag-link'); if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
        const f = $('tl-ag-file').files[0]; let adjunto = null; ok.disabled = true;
        try {
          if (f) { if (f.size > 15 * 1024 * 1024) { msg('El archivo pesa más de 15 MB.', '#ff8a94'); return; }
            const ext = f.type === 'application/pdf' ? 'pdf' : (f.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
            adjunto = 'docs/' + crypto.randomUUID() + '.' + ext; msg('Subiendo archivo…', '#a69ea3');
            const up = await sb.storage.from('fotos').upload(adjunto, f, { contentType: f.type });
            if (up.error) { msg('No se pudo subir el archivo: ' + up.error.message, '#ff8a94'); return; } }
          msg('Guardando…', '#a69ea3');
          const { error } = await sb.from('eventos').insert({ alumno: v('tl-ag-al') || null, tipo, fecha: v('tl-ag-fecha'), hora: v('tl-ag-hora') || null, titulo: v('tl-ag-tit'), detalle: v('tl-ag-det') || null, link: link || null, adjunto });
          if (error) { msg('No se pudo guardar: ' + error.message, '#ff8a94'); return; }
          const para = v('tl-ag-al') ? (nom[v('tl-ag-al')] || '').split(' ')[0] : 'todos';
          msg('Guardado ✓ Ya aparece en la agenda de ' + para + '.');
          $('tl-ag-tit').value = ''; $('tl-ag-det').value = ''; $('tl-ag-link').value = ''; limpiarArchivo(); $('tl-ag-adj').open = false; lista();
        } finally { ok.disabled = false; }
      }
    };
    lista();
  }

  let ready = null;
  async function boot() {
    const s = await ensureSession();
    const { data: esCoach, error: eC } = await sb.rpc('is_coach');
    if (!esCoach && !eC) { location.replace('alumno.html'); return new Promise(() => {}); }
    const hide = document.getElementById('tl-hide'); if (hide) hide.remove();
    solicitudes(); agendaBtn(); sb.channel('tl-sol').on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes' }, () => solicitudes()).subscribe();
    return s;
  }
  window.claude = {
    use: async name => { ready = ready || boot(); await ready;
      if (name === 'db') return db; if (name === 'downloads') return downloads; if (name === 'assets') return assets; return null; },
  };
})();
