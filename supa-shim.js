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
    programas_hechos: a.programasHechos || [], fotos: a.fotos || [], updated_at: new Date().toISOString() });
  const R2A = (r, planes) => { const a = { codigo: r.codigo, nombre: r.nombre, telefono: r.telefono || '', estado: r.estado, bloques: r.bloques || [], clases: r.clases,
    notas: r.notas || '', planes: planes || [] };
    if (r.email) a.email = r.email; if (r.nacimiento) a.nacimiento = r.nacimiento; if (r.ingreso) a.ingreso = r.ingreso;
    if (r.programa !== undefined) a.programa = r.programa; if (r.programas_hechos && r.programas_hechos.length) a.programasHechos = r.programas_hechos;
    if (r.fotos && r.fotos.length) a.fotos = r.fotos; if (r.user_id) a.vinculado = true; return a; };
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

  /* ---------- colecciones ---------- */
  const loaders = {
    alumnos: async () => { const [al, pl] = await Promise.all([all('alumnos'), all('planes')]);
      const byA = {}; pl.forEach(p => (byA[p.alumno] = byA[p.alumno] || []).push(R2P(p)));
      Object.values(byA).forEach(l => l.sort((x, y) => String(x.inicio || x.mes || '').localeCompare(String(y.inicio || y.mes || ''))));
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

  /* ---------- agenda de alumnos: reuniones, actividades, eventos ---------- */
  const TIPOS = ['Reunión', 'Evaluación', 'Actividad', 'Evento', 'Nutrición', 'Otro'];
  const escA = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function agendaBtn() {
    if (document.getElementById('tl-agb')) return;
    const b = document.createElement('button'); b.id = 'tl-agb'; b.textContent = '+ Agenda alumnos';
    b.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:900;height:48px;padding:0 16px;border-radius:24px;border:0;background:#0e0c0f;color:#fff;font:700 15px Barlow,system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer';
    b.onclick = abrirAgenda; document.body.appendChild(b);
  }
  async function abrirAgenda() {
    let p = document.getElementById('tl-agp'); if (p) { p.remove(); return; }
    p = document.createElement('div'); p.id = 'tl-agp';
    p.style.cssText = 'position:fixed;left:16px;bottom:72px;z-index:901;width:min(400px,calc(100vw - 32px));max-height:75vh;overflow:auto;background:#1b181c;color:#f2eef0;border:1px solid #2f2a2e;border-radius:14px;padding:14px;font:14px Barlow,system-ui,sans-serif;display:grid;gap:10px';
    const inp = 'height:42px;border-radius:10px;border:1px solid #2f2a2e;background:#161317;color:#f2eef0;padding:0 10px;font:15px Barlow,sans-serif;width:100%';
    const hoy = new Date(); const iso = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    const { data: al } = await sb.from('alumnos').select('codigo,nombre,estado').order('nombre');
    const act = (al || []).filter(a => a.estado !== 'inactivo');
    p.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px">Agregar a la agenda</b><button id="tl-agx" style="background:none;border:0;color:#a69ea3;font-size:20px;cursor:pointer" aria-label="Cerrar">✕</button></div>
      <label style="display:grid;gap:4px;color:#a69ea3">Para<select id="tl-ag-al" style="${inp}"><option value="">Todos los alumnos</option>${act.map(a => `<option value="${escA(a.codigo)}">${escA(a.nombre)}</option>`).join('')}</select></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label style="display:grid;gap:4px;color:#a69ea3">Tipo<select id="tl-ag-tipo" style="${inp}">${TIPOS.map(t => `<option>${t}</option>`).join('')}</select></label>
        <label style="display:grid;gap:4px;color:#a69ea3">Hora (opcional)<input id="tl-ag-hora" type="time" style="${inp}"></label></div>
      <label style="display:grid;gap:4px;color:#a69ea3">Fecha<input id="tl-ag-fecha" type="date" value="${iso}" style="${inp}"></label>
      <label style="display:grid;gap:4px;color:#a69ea3">Título<input id="tl-ag-tit" placeholder="Ej: Evaluación BodyGo" style="${inp}"></label>
      <label style="display:grid;gap:4px;color:#a69ea3">Detalle (opcional)<textarea id="tl-ag-det" rows="2" style="${inp};height:auto;padding:8px 10px"></textarea></label>
      <button id="tl-ag-ok" style="height:44px;border-radius:10px;border:0;background:#d71f30;color:#fff;font:700 15px Barlow,sans-serif;cursor:pointer">Guardar en su agenda</button>
      <div id="tl-ag-msg" style="color:#6fd39a;min-height:16px"></div>
      <b style="font-size:15px">Próximos</b><div id="tl-ag-list" style="display:grid;gap:6px"></div>`;
    document.body.appendChild(p);
    const nom = Object.fromEntries((al || []).map(a => [a.codigo, a.nombre]));
    const lista = async () => {
      const { data } = await sb.from('eventos').select('*').gte('fecha', iso).order('fecha').order('hora', { nullsFirst: true }).limit(40);
      const l = document.getElementById('tl-ag-list'); if (!l) return;
      l.innerHTML = (data || []).length ? data.map(e => `<div style="display:flex;justify-content:space-between;gap:8px;border-top:1px solid #2f2a2e;padding-top:6px"><div><b>${escA(e.titulo)}</b><div style="color:#a69ea3;font-size:13px">${escA(e.fecha.split('-').reverse().join('/'))}${e.hora ? ' · ' + escA(e.hora) : ''} · ${escA(e.tipo)} · ${escA(e.alumno ? (nom[e.alumno] || e.alumno) : 'Todos')}</div></div><button data-del="${e.id}" style="background:none;border:0;color:#ff8a94;cursor:pointer" aria-label="Borrar">Borrar</button></div>`).join('') : '<div style="color:#a69ea3">Nada agendado todavía.</div>';
    };
    p.onclick = async ev => {
      if (ev.target.id === 'tl-agx') { p.remove(); return; }
      const d = ev.target.closest('[data-del]'); if (d) { if (!confirm('¿Borrar este evento?')) return; await sb.from('eventos').delete().eq('id', d.dataset.del); lista(); return; }
      if (ev.target.id === 'tl-ag-ok') {
        const v = id => document.getElementById(id).value.trim(); const msg = document.getElementById('tl-ag-msg');
        if (!v('tl-ag-tit') || !v('tl-ag-fecha')) { msg.style.color = '#ff8a94'; msg.textContent = 'Falta el título o la fecha.'; return; }
        const { error } = await sb.from('eventos').insert({ alumno: v('tl-ag-al') || null, tipo: v('tl-ag-tipo'), fecha: v('tl-ag-fecha'), hora: v('tl-ag-hora') || null, titulo: v('tl-ag-tit'), detalle: v('tl-ag-det') || null });
        if (error) { msg.style.color = '#ff8a94'; msg.textContent = 'No se pudo guardar: ' + error.message; return; }
        msg.style.color = '#6fd39a'; msg.textContent = 'Guardado ✓ Ya aparece en la agenda del alumno.';
        document.getElementById('tl-ag-tit').value = ''; document.getElementById('tl-ag-det').value = ''; lista();
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
      if (name === 'db') return db; if (name === 'downloads') return downloads; return null; },
  };
})();
