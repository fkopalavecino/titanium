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
  #tl-gate{position:fixed;inset:0;z-index:9999;color:#f2eef0;font-family:Barlow,system-ui,sans-serif;display:flex;justify-content:center;overflow:auto;background:radial-gradient(120% 55% at 50% 0%,rgba(215,31,48,.30),transparent 62%),#0e0c0f;padding:max(48px,calc(env(safe-area-inset-top) + 32px)) 24px max(24px,env(safe-area-inset-bottom))}
  #tl-gate *{box-sizing:border-box}
  #tl-gate .box{width:100%;max-width:380px;min-height:100%;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}
  #tl-gate .mk{width:118px;height:auto;filter:drop-shadow(0 8px 24px rgba(215,31,48,.25))}
  #tl-gate .wm{width:230px;height:auto;margin-top:4px}
  #tl-gate .sp{flex:1;min-height:24px}
  #tl-gate form{width:100%;display:flex;flex-direction:column;gap:12px}
  #tl-gate p{color:#a69ea3;margin:0;font-size:15px;line-height:1.45}
  #tl-gate label{display:flex;flex-direction:column;gap:6px;font-size:14px;color:#a69ea3;text-align:left}
  #tl-gate input{height:52px;border-radius:12px;border:1px solid #2f2a2e;background:#1b181c;color:#f2eef0;padding:0 14px;font:500 17px Barlow,sans-serif;width:100%}
  #tl-gate input:focus{outline:2px solid #d71f30;outline-offset:1px}
  #tl-gate button{height:52px;border-radius:12px;border:0;background:#d71f30;color:#fff;font:700 17px Barlow,sans-serif;cursor:pointer;width:100%}
  #tl-gate button.sec{background:transparent;border:1px solid #2f2a2e;color:#f2eef0}
  #tl-gate .lema{font:600 14px 'Barlow Condensed',Barlow,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6d656a;margin-top:6px}
  #tl-gate .err{color:#ff8a94;font-size:14px;min-height:18px}`;
  const TL_MARK = '<svg class="mk" viewBox="123 138 394 461" aria-hidden="true"><path fill="#ea203a" fill-rule="evenodd" d="M480,198 393,198 393,534 512,431 512,323 478,352 478,415 431,456 427,457 427,233 453,232 478,288 478,308 512,279ZM160,198 123,285 213,363 213,456 210,457 162,415 162,352 128,323 128,431 247,534 247,342 165,271 183,232 212,232 213,279 247,308 247,198Z"/><path fill="#cbcbcb" fill-rule="evenodd" d="M516,138 333,138 333,539 320,554 307,539 307,138 124,138 160,172 273,173 273,557 320,598 367,557 367,173 479,172Z"/></svg>';
  const TL_WORD = '<svg class="wm" viewBox="580 138 1874 423" role="img" aria-label="Titanium Sport Center"><path fill="#ea203a" fill-rule="evenodd" d="M2390,481 2390,559 2406,559 2407,531 2411,531 2432,559 2452,559 2433,532 2443,524 2448,514 2448,501 2445,494 2437,486 2428,482ZM2406,497 2408,495 2418,495 2427,498 2432,506 2430,513 2422,519 2407,519ZM2241,481 2240,558 2292,559 2291,545 2257,544 2258,527 2283,527 2283,513 2257,512 2257,496 2292,495 2292,482ZM2084,481 2083,495 2103,495 2105,497 2105,559 2121,559 2121,497 2123,495 2143,495 2142,481ZM1767,481 1767,559 1818,559 1818,545 1783,544 1783,529 1785,527 1809,527 1809,513 1783,512 1783,497 1785,495 1818,495 1818,481ZM1319,481 1319,495 1340,496 1340,559 1357,559 1357,496 1378,495 1378,481ZM1162,481 1161,558 1178,558 1177,535 1179,531 1183,531 1203,559 1223,559 1205,533 1219,516 1220,503 1216,493 1205,484 1199,482ZM1178,496 1189,495 1197,497 1203,504 1201,514 1193,519 1179,519 1177,514ZM861,482 821,482 821,559 837,559 838,536 862,534 871,529 879,520 881,514 879,497 873,489ZM837,497 839,495 858,497 865,506 863,515 854,521 839,521 837,519ZM1916,480 1916,559 1933,558 1934,516 1985,560 1985,481 1969,481 1969,523 1967,524ZM1621,483 1609,490 1602,497 1596,508 1594,523 1599,539 1614,554 1626,559 1643,560 1662,554 1668,548 1658,539 1644,545 1632,545 1621,540 1613,531 1611,515 1614,508 1627,497 1642,495 1657,502 1668,491 1657,484 1635,480ZM1016,480 1000,484 988,492 982,499 976,514 976,527 984,544 994,553 1008,559 1025,560 1042,555 1056,543 1063,529 1063,512 1055,496 1046,488 1034,482ZM1008,497 1015,495 1031,497 1045,510 1047,516 1046,528 1035,541 1025,545 1014,545 1006,542 996,533 992,522 993,513 997,506ZM693,480 685,482 675,489 670,499 670,509 678,520 703,530 707,537 698,545 690,544 685,537 669,540 674,551 680,556 687,559 700,560 713,555 719,549 723,541 723,532 714,520 692,512 688,509 686,503 694,495 702,497 706,503 719,501 721,497 712,485 703,481Z"/><path fill="#cbcbcb" fill-rule="evenodd" d="M1261,139 1115,407 1172,407 1192,369 1331,369 1352,407 1408,407ZM1262,239 1307,325 1217,326 1216,323ZM2173,138 2173,407 2225,407 2226,271 2312,368 2400,271 2401,407 2453,407 2453,138 2313,293ZM1873,138 1873,308 1881,343 1896,368 1914,385 1931,395 1953,403 1976,407 2009,407 2027,404 2049,397 2073,383 2090,366 2100,350 2110,317 2111,139 2059,139 2059,308 2056,322 2046,340 2031,354 2012,362 1982,364 1965,360 1949,351 1935,336 1928,322 1925,308 1925,138ZM1751,138 1751,407 1803,407 1803,138ZM1440,138 1440,407 1492,407 1493,248 1681,407 1681,138 1629,184 1628,300ZM939,138 940,181 1020,182 1020,407 1072,407 1072,182 1151,181 1151,138ZM846,138 846,407 898,407 898,138ZM625,138 580,181 669,182 669,407 721,407 721,182 800,181 800,138Z"/></svg>';
  function gateHTML(step, email) {
    return `<div class="box">${TL_MARK}${TL_WORD}<div class="sp"></div>
      ${step === 'elige' ? `<p>¿Es tu primera vez en la app? Si te llegó un código del profe por WhatsApp, elige «Primera vez».</p>
        <div style="width:100%;display:flex;flex-direction:column;gap:12px"><button type="button" id="tl-nuevo">🆕 Primera vez · tengo código</button><button type="button" class="sec" id="tl-ya">👋 Ya tengo cuenta</button></div>`
      : step === 'inv' ? `<p>Escribe el código de 6 letras que te mandó el profe por WhatsApp. Vale 24 horas y se usa una sola vez.</p>
        <form id="tl-fi" style="display:flex;flex-direction:column;gap:12px"><label>Código de invitación<input id="tl-inv" autocapitalize="characters" autocomplete="off" maxlength="12" required placeholder="Ej: K7M2QX" style="text-align:center;letter-spacing:.25em;font-weight:700;text-transform:uppercase"></label><button>Entrar</button></form><button type="button" id="tl-back0" style="height:auto;background:none;border:0;color:#a69ea3;font:500 14px Barlow,sans-serif;text-decoration:underline;padding:6px">Ya tenía cuenta con correo</button>`
      : step === 'email' ? `<p>${(() => { try { return localStorage.getItem('tl-inv') && /alumno\.html/.test(location.pathname) ? 'Invitación lista ✓ Ahora escribe tu correo (el que quieras): te enviamos un código para entrar.' : 'Entra con tu correo. Te enviamos un código para entrar.'; } catch (e) { return 'Entra con tu correo. Te enviamos un código para entrar.'; } })()}</p>
        <form id="tl-f1" style="display:flex;flex-direction:column;gap:12px"><label>Tu correo<input id="tl-email" type="email" autocomplete="email" required value="${email || ''}"></label><button>Enviarme el código</button></form>`
      : `<p>Revisa tu correo <b style="color:#f2eef0">${email}</b> y escribe aquí el código que te llegó (si no lo ves, mira en Spam).</p>
        <form id="tl-f2" style="display:flex;flex-direction:column;gap:12px"><label>Código<input id="tl-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></label><button>Entrar</button><button type="button" class="sec" id="tl-back">Usar otro correo</button></form>`}
      <div class="err" id="tl-err"></div><div class="lema">«El que abandona pierde»</div></div>`;
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
        ev.preventDefault(); const bt = ev.target.querySelector('button'); if (bt && bt.disabled) return; if (bt) { bt.disabled = true; bt.textContent = 'Enviando…'; }
        email = document.getElementById('tl-email').value.trim().toLowerCase();
        try { localStorage.setItem('tl-email', email); } catch (e) {}
        const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } });
        if (bt) { bt.disabled = false; bt.textContent = 'Enviarme el código'; }
        if (error) { err(error.status === 429 ? 'Se pidieron muchos códigos. Espera unos minutos.' : 'No se pudo enviar el código: ' + error.message); return; }
        step2();
      };
    };
    const step2 = () => {
      g.innerHTML = gateHTML('code', email);
      document.getElementById('tl-back').onclick = step1;
      const f2 = document.getElementById('tl-f2');
      const aviso = document.createElement('div'); aviso.style.cssText = 'color:#a69ea3;font-size:13px;line-height:1.4';
      aviso.textContent = 'Usa el código del ÚLTIMO correo que te llegó: cada vez que pides uno nuevo, el anterior deja de servir. Puede tardar 1 minuto en llegar.';
      f2.insertBefore(aviso, f2.firstChild);
      f2.onsubmit = async ev => {
        ev.preventDefault(); const bt = f2.querySelector('button:not(.sec)'); if (bt && bt.disabled) return;
        const token = document.getElementById('tl-code').value.replace(/\D/g, '');
        if (token.length < 6) { err('Escribe el código completo que te llegó al correo.'); return; }
        if (bt) { bt.disabled = true; bt.textContent = 'Revisando…'; }
        const { error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
        if (bt) { bt.disabled = false; bt.textContent = 'Entrar'; }
        if (error) { err('Código incorrecto o vencido. Revisa que sea el del último correo; si no, vuelve atrás y pide uno nuevo (espera 1 minuto entre pedidos).'); return; }
        g.remove(); onDone();
      };
    };
    const esAlumno = /alumno\.html/.test(location.pathname);
    const tieneInv = () => { try { return !!localStorage.getItem('tl-inv'); } catch (e) { return false; } };
    const step0 = () => {
      g.innerHTML = gateHTML('elige', email);
      document.getElementById('tl-nuevo').onclick = stepInv;
      document.getElementById('tl-ya').onclick = () => { try { localStorage.removeItem('tl-inv'); } catch (e) {} step1(); };
    };
    const stepInv = () => {
      g.innerHTML = gateHTML('inv', email);
      let pre = ''; try { pre = localStorage.getItem('tl-inv') || ''; } catch (e) {}
      if (pre) { const i = document.getElementById('tl-inv'); i.value = pre; setTimeout(() => document.getElementById('tl-fi').requestSubmit(), 50); }
      document.getElementById('tl-back0').onclick = () => { try { localStorage.removeItem('tl-inv'); } catch (e) {} step1(); };
      document.getElementById('tl-fi').onsubmit = async ev => { ev.preventDefault();
        const v = document.getElementById('tl-inv').value.trim().toUpperCase(); if (!v) return;
        try { localStorage.setItem('tl-inv', v); } catch (e) {}
        // entra solo con el código: sesión sin correo (si Supabase no lo permite, sigue con el correo)
        const bt = ev.target.querySelector('button'); if (bt) { bt.disabled = true; bt.textContent = 'Entrando…'; }
        const { error } = await sb.auth.signInAnonymously();
        if (error) { console.warn('ingreso sin correo no disponible:', error.message); step1(); return; }
        g.remove(); onDone(); };
    };
    if (esAlumno) stepInv(); else step1();
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
  const A2R = a => ({ codigo: a.codigo, nombre: a.nombre || a.codigo, ...(a.email ? { email: String(a.email).trim().toLowerCase() } : {}), telefono: a.telefono || null,
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
  // caché de clases: los cambios en vivo (series que anotan los alumnos) se aplican uno a uno, sin volver a descargar todo el historial
  let DIAS = null;
  function aplicarClase(p) {
    if (!DIAS) return soon('dias');
    const o = p.old || {}, n = p.new || {};
    if (p.eventType === 'DELETE') { if (!o.fecha || !o.hora || !o.alumno) return soon('dias');
      const d = DIAS[o.fecha]; if (d && d.bloques[o.hora]) { delete d.bloques[o.hora][o.alumno]; if (!Object.keys(d.bloques[o.hora]).length) delete d.bloques[o.hora]; } }
    else { if (!n.fecha || !n.hora || !n.alumno) return soon('dias');
      const d = DIAS[n.fecha] = DIAS[n.fecha] || { fecha: n.fecha, bloques: {} }; (d.bloques[n.hora] = d.bloques[n.hora] || {})[n.alumno] = row2rec(n); }
    clearTimeout(timers.diasVivo); timers.diasVivo = setTimeout(() => { const sn = snap(Object.entries(DIAS)); subs.dias.forEach(f => f.ok(sn)); }, 300);
  }
  const loaders = {
    alumnos: async () => { const [al, pl, ps] = await Promise.all([all('alumnos'), all('planes'), sb.from('push_subs').select('alumno').then(r => r.data || [], () => [])]);
      const conPush = new Set(ps.map(x => x.alumno));
      const byA = {}; pl.forEach(p => (byA[p.alumno] = byA[p.alumno] || []).push(R2P(p)));
      Object.values(byA).forEach(l => l.sort((x, y) => String(x.inicio || x.mes || '').localeCompare(String(y.inicio || y.mes || ''))));
      await firmarFotos(al.flatMap(r => (Array.isArray(r.fotos) ? r.fotos : []).flatMap(x => [x.frente, x.perfil, x.espalda]).concat((Array.isArray(r.inbody) ? r.inbody : []).map(x => x && x.img)).concat(r.perfil && r.perfil.avatar ? [r.perfil.avatar] : [])));
      return al.map(r => { const a = R2A(r, byA[r.codigo]); if (r.ultima_vez) a.ultimaVez = r.ultima_vez; if (conPush.has(r.codigo)) a.push = true; return [r.codigo, a]; }); },
    rutinas: async () => (await all('rutinas')).map(r => [r.id, r.data]),
    dias: async () => { const rows = await all('clases'); const m = {};
      rows.forEach(r => { const d = m[r.fecha] = m[r.fecha] || { fecha: r.fecha, bloques: {} }; (d.bloques[r.hora] = d.bloques[r.hora] || {})[r.alumno] = row2rec(r); });
      DIAS = m; return Object.entries(m); },
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
    [['alumnos', 'alumnos'], ['planes', 'alumnos'], ['rutinas', 'rutinas'], ['config', 'cfg']].forEach(([t, n]) =>
      channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => soon(n)));
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'clases' }, aplicarClase);
    channel.subscribe();
    // al volver a la pestaña solo se recarga todo si estuvo oculta más de 2 minutos (los cambios llegan en vivo)
    let oculta = 0;
    document.addEventListener('visibilitychange', () => { if (document.hidden) { oculta = Date.now(); return; } if (Date.now() - oculta > 120000) ['alumnos', 'rutinas', 'dias', 'cfg'].forEach(soon); });
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
  const TIPO = { no_voy: 'No puede ir', recuperar: 'Quiere recuperar', pago: 'Avisa un pago', mensaje: 'Mensaje', vincular: '📲 Quiere entrar a la app' };
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
        + (r.tipo === 'pago' ? (d.comprobante ? '<button data-comp="' + esc(d.comprobante) + '" style="justify-self:start;height:34px;border:1px solid #2f2a2e;border-radius:8px;background:transparent;color:#f2eef0;padding:0 12px;cursor:pointer">📎 Ver comprobante</button>' : '<div style="color:#a69ea3;font-size:12px">Sin comprobante adjunto: revisa tu cuenta antes de confirmar.</div>')
          + '<label style="display:grid;gap:4px;color:#a69ea3;font-size:12px">Monto recibido<input data-pmon="' + r.id + '" inputmode="numeric" value="' + esc(d.montoNum || String(d.monto || '').replace(/\D/g, '')) + '" style="height:38px;border-radius:8px;border:1px solid #2f2a2e;background:#121013;color:#f2eef0;padding:0 10px;font:600 15px Barlow,sans-serif"></label>'
          + '<div style="display:flex;gap:8px"><button data-id="' + r.id + '" data-pago="1" style="flex:1;height:36px;border:0;border-radius:8px;background:#17804a;color:#fff;font-weight:700">✓ Confirmar pago</button><button data-id="' + r.id + '" data-e="rechazada" style="flex:1;height:36px;border:1px solid #2f2a2e;border-radius:8px;background:transparent;color:#f2eef0">Rechazar</button></div>'
          + '<div style="color:#a69ea3;font-size:12px">Si el plan tiene saldo, se abona. Si ya estaba pagado, se crea la renovación con este pago.</div></div>' : '')
        + (r.tipo === 'pago' ? '' : r.tipo === 'vincular' ? '<div style="color:#a69ea3;font-size:12px">Verifica que sea esta persona antes de aprobar: tendrá acceso a la ficha de ' + esc(d.nombre || r.alumno) + '.</div><div style="display:flex;gap:8px"><button data-id="' + r.id + '" data-vin="1" style="flex:1;height:36px;border:0;border-radius:8px;background:#17804a;color:#fff;font-weight:700">✓ Sí, es él/ella</button><button data-id="' + r.id + '" data-e="rechazada" style="flex:1;height:36px;border:1px solid #2f2a2e;border-radius:8px;background:transparent;color:#f2eef0;font-weight:700">No es</button></div></div>' :
          '<div style="display:flex;gap:8px"><button data-id="' + r.id + '" data-e="aprobada" style="flex:1;height:36px;border:0;border-radius:8px;background:#17804a;color:#fff;font-weight:700">Listo</button><button data-id="' + r.id + '" data-e="rechazada" style="flex:1;height:36px;border:1px solid #2f2a2e;border-radius:8px;background:transparent;color:#f2eef0">Rechazar</button></div></div>'); }).join('')
      + '<p style="margin:0;color:#a69ea3;font-size:12px">Para mover la clase usa ↻ Reagendar en Clase de hoy y luego marca «Listo».</p>';
    p.onclick = async ev => { const cb = ev.target.closest('[data-comp]');
      if (cb) { const { data } = await sb.storage.from('fotos').createSignedUrl(cb.dataset.comp, 600); if (data?.signedUrl) window.open(data.signedUrl, '_blank'); else alert('No se pudo abrir el comprobante.'); return; }
      const t = ev.target.closest('button[data-id]'); if (!t) return;
      if (t.dataset.pago) { const m = Number(String(p.querySelector('[data-pmon="' + t.dataset.id + '"]')?.value || '').replace(/\D/g, ''));
        if (!m) { alert('Escribe el monto recibido.'); return; } t.disabled = true;
        const { data, error } = await sb.rpc('confirmar_pago', { p_sol: t.dataset.id, p_monto: m });
        if (error) { alert('No se pudo confirmar: ' + error.message); t.disabled = false; return; }
        alert(data?.accion === 'renovacion' ? 'Pago confirmado ✓ Se creó la renovación del plan.' : 'Pago confirmado ✓ Se abonó al plan.'); p.remove(); solicitudes(); return; }
      if (t.dataset.vin) { t.disabled = true; const { error } = await sb.rpc('aprobar_vinculo', { p_sol: t.dataset.id }); if (error) { alert('No se pudo aprobar: ' + error.message); t.disabled = false; return; } }
      else await sb.from('solicitudes').update({ estado: t.dataset.e }).eq('id', t.dataset.id);
      p.remove(); solicitudes(); };
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
#tl-agp .seg{display:flex;overflow-x:auto;scrollbar-width:none;gap:2px;background:#161317;border:1px solid #2f2a2e;border-radius:12px;padding:3px}
#tl-agp .seg button{height:40px;border:0;border-radius:9px;background:transparent;color:#a69ea3;font:700 14px Barlow,sans-serif;cursor:pointer;padding:0 10px;white-space:nowrap;flex:1 0 auto}
#tl-agp .seg::-webkit-scrollbar{display:none}
#tl-agp [hidden]{display:none!important}
#tl-agp #tl-ag-msj{gap:12px}
#tl-agp .msj-it{background:#161317;border:1px solid #2f2a2e;border-left:4px solid #d71f30;border-radius:12px;padding:10px 6px 10px 12px;display:flex;gap:10px;align-items:flex-start}
#tl-agp .msj-it.env{border-left-color:#4a4247}
#tl-agp .msj-it .tx{flex:1;min-width:0}
#tl-agp .msj-it p{margin:4px 0 0;font-size:14px;white-space:pre-wrap;word-break:break-word;color:#d9d3d6}
#tl-agp .msj-it .mt{color:#a69ea3;font-size:13px}
#tl-agp .msj-it .del{width:40px;height:40px;border:0;background:none;color:#ff8a94;font-size:17px;cursor:pointer;flex:none}
#tl-agp .fo{display:flex;align-items:center;gap:10px;background:#161317;border:1px solid #2f2a2e;border-radius:12px;padding:10px 10px 10px 12px}
#tl-agp .fo .tx{flex:1;min-width:0}
#tl-agp .fo b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#tl-agp .fo .mt{color:#a69ea3;font-size:13px}
#tl-agp .pl{display:inline-block;font-size:12px;font-weight:800;border-radius:999px;padding:2px 8px;margin-top:3px}
#tl-agp .pl.r{background:#3a1519;color:#ff8a94}#tl-agp .pl.a{background:#33280f;color:#ffc861}#tl-agp .pl.g{background:#12301f;color:#6fdc9c}#tl-agp .pl.b{background:#13263a;color:#8cc4ff}
#tl-agp .fo .ag{height:40px;border-radius:10px;border:1px solid #d71f30;background:transparent;color:#fff;font:700 14px Barlow,sans-serif;padding:0 12px;cursor:pointer;flex:none}
#tl-agp .fres{display:grid;gap:10px;background:#161317;border:1px solid #2f2a2e;border-radius:12px;padding:12px}
#tl-agp .seg button[aria-selected=true]{background:#d71f30;color:#fff}
#tl-agp .bd{overflow:auto;-webkit-overflow-scrolling:touch;padding:16px 18px;display:grid;grid-template-columns:minmax(0,1fr);align-content:start;gap:16px;flex:1;overscroll-behavior:contain}
#tl-agp .lb{display:grid;gap:6px;color:#a69ea3;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
#tl-agp .lb small{font-weight:500;text-transform:none;letter-spacing:0}
#tl-agp input:not([type=file]),#tl-agp select,#tl-agp textarea{-webkit-appearance:none;appearance:none;display:block;width:100%;min-height:48px;border-radius:12px;border:1px solid #2f2a2e;background:#161317;color:#f2eef0;padding:0 12px;font:16px Barlow,system-ui,sans-serif;text-transform:none;letter-spacing:0}
#tl-agp textarea{padding:12px;min-height:84px;resize:vertical}
#tl-agp select{background-image:linear-gradient(45deg,transparent 50%,#a69ea3 50%),linear-gradient(135deg,#a69ea3 50%,transparent 50%);background-position:calc(100% - 18px) 21px,calc(100% - 13px) 21px;background-size:5px 5px;background-repeat:no-repeat;padding-right:34px}
#tl-agp input[type=date],#tl-agp input[type=time]{height:48px;line-height:48px;padding-top:0;padding-bottom:0;display:flex;align-items:center}
#tl-agp input::-webkit-date-and-time-value{text-align:left;margin:0;line-height:48px;min-height:48px}
#tl-agp input::-webkit-datetime-edit{padding:0;line-height:48px}
#tl-agp .sub{display:grid;gap:4px;font-size:12px;font-weight:600;color:#a69ea3;text-transform:none;letter-spacing:0;min-width:0}
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
#tl-agp #tl-ag-prox{gap:8px}
#tl-agp .day{color:#a69ea3;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
#tl-agp .it{display:flex;align-items:center;gap:12px;background:#161317;border:1px solid #2f2a2e;border-left:4px solid #4da3ff;border-radius:12px;padding:10px 6px 10px 12px}
#tl-agp .it .ic{font-size:22px}
#tl-agp .it .tx{flex:1;min-width:0}
#tl-agp .it b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#tl-agp .it .mt{color:#a69ea3;font-size:13px}
#tl-agp .it .del{width:44px;height:44px;border:0;border-radius:10px;background:none;color:#ff8a94;font-size:18px;cursor:pointer;flex:none}
#tl-agp .empty{color:#a69ea3;text-align:center;padding:30px 0}
#tl-agp #tl-ag-hist{gap:8px}
#tl-agp #tl-ag-hist .it{border-left-color:#4a4247}
#tl-agp .it .ed{width:44px;height:44px;border:0;border-radius:10px;background:none;color:#f2eef0;font-size:17px;cursor:pointer;flex:none}
#tl-agp .cx{height:44px;border-radius:12px;border:1px solid #2f2a2e;background:transparent;color:#a69ea3;font:700 15px Barlow,sans-serif;cursor:pointer}
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
  async function abrirAgenda(v0) {
    if (document.getElementById('tl-agp')) return;
    const iso = masDias(0);
    const p = document.createElement('div'); p.id = 'tl-agp';
    p.innerHTML = '<div class="sh"><div class="bd"><div class="empty">Cargando…</div></div></div>';
    document.body.appendChild(p); const prevOv = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const cerrar = () => { p.remove(); document.body.style.overflow = prevOv; document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') cerrar(); }; document.addEventListener('keydown', onKey);
    const { data: al } = await sb.from('alumnos').select('codigo,nombre,estado,fotos,inbody,medidas').order('nombre');
    const act = (al || []).filter(a => a.estado !== 'inactivo');
    const nom = Object.fromEntries((al || []).map(a => [a.codigo, a.nombre]));
    let tipo = 'Reunión', vista = 'nuevo', eventos = [], pasados = [], evPasadas = [], editId = null, editAdj = null, quitarAdj = false;
    p.innerHTML = `<div class="sh" role="dialog" aria-modal="true" aria-labelledby="tl-ag-h">
      <header><div class="hd"><h3 id="tl-ag-h">Agenda de alumnos</h3><button class="x" data-x="1" aria-label="Cerrar">✕</button></div>
        <div class="seg" role="tablist"><button role="tab" data-v="nuevo" aria-selected="true" id="tl-ag-tabn">＋ Nuevo</button><button role="tab" data-v="prox" aria-selected="false">Próximos <span id="tl-ag-n"></span></button><button role="tab" data-v="hist" aria-selected="false">Historial</button><button role="tab" data-v="fot" aria-selected="false">📋 Evaluaciones</button><button role="tab" data-v="msj" aria-selected="false">📣 Mensaje</button></div></header>
      <div class="bd" id="tl-ag-nuevo">
        <label class="lb">¿Para quién?<select id="tl-ag-al"><option value="">👥 Todos los alumnos</option>${act.map(a => `<option value="${escA(a.codigo)}">${escA(a.nombre)}</option>`).join('')}</select></label>
        <div class="lb">Tipo<div class="tipos">${TIPOS.map(t => `<button type="button" data-t="${t}" aria-pressed="${t === tipo}"><span>${TICO[t]}</span>${t}</button>`).join('')}</div></div>
        <div class="lb">Cuándo<div class="two"><label class="sub">Fecha<input id="tl-ag-fecha" type="date" value="${iso}"></label><label class="sub">Hora (opcional)<input id="tl-ag-hora" type="time"></label></div>
          <div class="quick"><button type="button" data-q="0" aria-pressed="true">Hoy</button><button type="button" data-q="1" aria-pressed="false">Mañana</button><button type="button" data-q="7" aria-pressed="false">En 1 semana</button><button type="button" data-q="h" aria-pressed="false">Sin hora</button></div></div>
        <label class="lb">Título<input id="tl-ag-tit" placeholder="${TEJ[tipo]}" autocomplete="off"></label>
        <label class="lb"><span>Detalle <small>(opcional)</small></span><textarea id="tl-ag-det" rows="3" placeholder="Qué traer, dónde, indicaciones…"></textarea></label>
        <details id="tl-ag-adj"><summary>📎 Adjuntar archivo o enlace</summary><div class="in">
          <div style="position:relative"><label class="file" for="tl-ag-file" style="padding-right:48px"><input id="tl-ag-file" type="file" accept="application/pdf,image/*"><span aria-hidden="true">📄</span><span class="nm" id="tl-ag-fn">Elegir PDF o imagen (máx. 15 MB)</span></label><button type="button" class="rm" id="tl-ag-rm" hidden aria-label="Quitar archivo" style="position:absolute;right:6px;top:50%;transform:translateY(-50%)">✕</button></div>
          <label class="lb"><span>Enlace <small>(Drive, Zoom, Meet, video)</small></span><input id="tl-ag-link" type="url" inputmode="url" placeholder="https://…" autocomplete="off"></label></div></details>
      </div>
      <div class="bd" id="tl-ag-prox" hidden></div>
      <div class="bd" id="tl-ag-hist" hidden></div>
      <div class="bd" id="tl-ag-fot" hidden></div>
      <div class="bd" id="tl-ag-msj" hidden>
        <div class="small" style="color:#a69ea3;font-size:14px">Un aviso para <b style="color:#f2eef0">todos tus alumnos</b>: les llega como notificación al teléfono y queda en su Inicio por 7 días.</div>
        <label class="lb"><span>Título <small>(opcional)</small></span><input id="tl-ms-tit" placeholder="Ej: Cambio de horario" maxlength="60" autocomplete="off"></label>
        <label class="lb">Mensaje<textarea id="tl-ms-txt" rows="4" maxlength="500" placeholder="Ej: Este lunes 18 el gimnasio abre a las 9:00 por el feriado 💪"></textarea></label>
        <div class="lb">¿Cuándo se envía?<div class="quick"><button type="button" data-mq="ya" aria-pressed="true">Ahora</button><button type="button" data-mq="prog" aria-pressed="false">Programar</button></div>
          <div class="two" id="tl-ms-cu" hidden><label class="sub">Fecha<input id="tl-ms-f" type="date"></label><label class="sub">Hora<input id="tl-ms-h" type="time" value="09:00"></label></div></div>
        <div class="msg" id="tl-ms-msg" role="status"></div>
        <button class="ok" id="tl-ms-ok" type="button">📣 Enviar a todos</button>
        <div id="tl-ms-lst"></div>
      </div>
      <footer id="tl-ag-foot"><div class="msg" id="tl-ag-msg" role="status"></div><button class="ok" id="tl-ag-ok">Guardar en la agenda</button><button class="cx" id="tl-ag-cx" type="button" hidden>Cancelar edición</button></footer></div>`;
    const $ = id => document.getElementById(id);
    const msg = (t, c) => { $('tl-ag-msg').style.color = c || '#6fd39a'; $('tl-ag-msg').textContent = t; };
    const marcaQuick = () => { const f = $('tl-ag-fecha').value; p.querySelectorAll('[data-q]').forEach(b => b.setAttribute('aria-pressed', b.dataset.q === 'h' ? String(!$('tl-ag-hora').value) : String(f === masDias(+b.dataset.q)))); };
    const item = e => `<div class="it"><span class="ic" aria-hidden="true">${TICO[e.tipo] || '📌'}</span><div class="tx"><b>${escA(e.titulo)}</b><div class="mt">${e.hora ? escA(e.hora.slice(0, 5)) : 'Todo el día'} · ${escA(e.alumno ? (nom[e.alumno] || e.alumno) : 'Todos')}${e.adjunto ? ' · 📎' : ''}${e.link ? ' · 🔗' : ''}</div></div><button class="ed" data-ed="${e.id}" aria-label="Editar ${escA(e.titulo)}">✏️</button><button class="del" data-del="${e.id}" data-adj="${escA(e.adjunto || '')}" aria-label="Borrar ${escA(e.titulo)}">🗑</button></div>`;
    const grupos = (lst, vacio) => { if (!lst.length) return '<div class="empty">' + vacio + '</div>';
      const g = {}, orden = []; lst.forEach(e => { if (!g[e.fecha]) { g[e.fecha] = []; orden.push(e.fecha); } g[e.fecha].push(e); });
      return orden.map(f => `<div class="day">${escA(diaLargo(f))}</div>` + g[f].map(item).join('')).join(''); };
    const pintar = () => {
      $('tl-ag-n').textContent = eventos.length ? '(' + eventos.length + ')' : '';
      $('tl-ag-prox').innerHTML = grupos(eventos, 'Nada agendado todavía.<br>Usa «＋ Nuevo» para agregar.');
      $('tl-ag-hist').innerHTML = grupos(pasados, 'Todavía no hay eventos pasados.');
    };
    /* ---------- evaluaciones de progreso: a quién le toca (InBody, medidas, fotos o evaluación agendada) ---------- */
    const FOTO_TIT = '📋 Evaluación de progreso', FOTO_DET = 'InBody, medidas y fotos (frente, perfil y espalda). Ven con ropa ajustada (top o peto y short) y sin comer 2 horas antes si puedes.';
    const esFoto = e => e.tipo === 'Evaluación';
    let semFoto = 4; try { semFoto = Number(localStorage.getItem('tl-fot-sem')) || 4; } catch (_) {}
    const ddmm = f => new Date(f + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    const difD = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
    const sumD = (f, n) => { const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return isoD(d); };
    const estadoFotos = () => act.map(a => {
      const arr = x => Array.isArray(x) ? x : [];
      const fs = [...new Set([...arr(a.fotos).filter(x => x && x.f && (x.frente || x.perfil || x.espalda)).map(x => x.f), ...arr(a.inbody).filter(x => x && x.f).map(x => x.f),
        ...arr(a.medidas).filter(x => x && x.f).map(x => x.f), ...evPasadas.filter(e => e.alumno === a.codigo).map(e => e.fecha)])].sort();
      const ult = fs[fs.length - 1] || null, toca = ult ? sumD(ult, semFoto * 7) : null;
      const ag = eventos.filter(e => e.alumno === a.codigo && esFoto(e)).map(e => e.fecha).sort()[0] || null;
      const k = ag ? 3 : !ult ? 0 : toca <= sumD(iso, 3) ? 1 : 2; // 0 nunca evaluado · 1 le toca · 2 al día · 3 agendada
      return { a, ult, toca, ag, k, n: fs.length };
    }).sort((x, y) => x.k - y.k || String(x.toca || '').localeCompare(String(y.toca || '')) || x.a.nombre.localeCompare(y.a.nombre));
    const pintarFotos = () => { const L = estadoFotos(); const pend = L.filter(x => x.k <= 1);
      const fila = x => { const pl = x.k === 3 ? `<span class="pl b">📅 Agendada ${escA(ddmm(x.ag))}</span>` : x.k === 0 ? '<span class="pl r">Sin evaluación</span>'
          : x.k === 1 ? `<span class="pl a">Le toca${x.toca < iso ? ' · atrasada ' + difD(x.toca, iso) + ' días' : x.toca === iso ? ' hoy' : ' el ' + escA(ddmm(x.toca))}</span>` : `<span class="pl g">Al día · próxima ${escA(ddmm(x.toca))}</span>`;
        return `<div class="fo"><div class="tx"><b>${escA(x.a.nombre)}</b><div class="mt">${x.ult ? 'Última: ' + escA(ddmm(x.ult)) + ' · hace ' + difD(x.ult, iso) + ' días · ' + x.n + ' evaluación' + (x.n === 1 ? '' : 'es') : 'Nunca se ha evaluado'}</div>${pl}</div>${x.k === 3 ? '' : `<button class="ag" data-fag="${escA(x.a.codigo)}">Agendar</button>`}</div>`; };
      $('tl-ag-fot').innerHTML = `<div class="fres">
          <div class="lb">Cada cuánto toca evaluación<div class="quick">${[4, 6, 8, 12].map(n => `<button type="button" data-fsem="${n}" aria-pressed="${n === semFoto}">${n} semanas</button>`).join('')}</div></div>
          <div class="mt" style="color:#a69ea3;font-size:14px"><b style="color:#ffc861">${L.filter(x => x.k === 1).length}</b> les toca · <b style="color:#ff8a94">${L.filter(x => x.k === 0).length}</b> sin evaluar · <b style="color:#8cc4ff">${L.filter(x => x.k === 3).length}</b> agendadas</div>
          ${pend.length ? `<div class="two"><label class="sub">Agendar a todos para el<input id="tl-fot-f" type="date" value="${masDias(1)}" min="${iso}"></label><button type="button" class="ok" id="tl-fot-all" style="align-self:end">Agendar a ${pend.length}</button></div>` : ''}
        </div>${L.map(fila).join('') || '<div class="empty">No hay alumnos activos.</div>'}`; };
    const agendarFoto = code => { const x = estadoFotos().find(y => y.a.codigo === code); if (!x) return;
      salirEdicion(); $('tl-ag-al').value = code; setTipo('Evaluación');
      $('tl-ag-fecha').value = x.toca && x.toca > iso ? x.toca : masDias(1); $('tl-ag-hora').value = '';
      $('tl-ag-tit').value = FOTO_TIT; $('tl-ag-det').value = FOTO_DET; marcaQuick(); msg('Revisa la fecha y guarda. Le llega el aviso al alumno.');
      ver('nuevo'); $('tl-ag-fecha').focus(); };
    const agendarFotosTodos = async btn => { const pend = estadoFotos().filter(x => x.k <= 1); const f = $('tl-fot-f').value;
      if (!pend.length || !f) return; if (!confirm(`¿Agendar evaluación de progreso el ${diaLargo(f)} a ${pend.length} alumno${pend.length === 1 ? '' : 's'}? A cada uno le llega el aviso.`)) return;
      btn.disabled = true; btn.textContent = 'Agendando…';
      const { error } = await sb.from('eventos').insert(pend.map(x => ({ alumno: x.a.codigo, tipo: 'Evaluación', fecha: f, hora: null, titulo: FOTO_TIT, detalle: FOTO_DET })));
      if (error) { btn.disabled = false; btn.textContent = 'Agendar a ' + pend.length; alert('No se pudo agendar: ' + error.message); return; }
      await lista(); pintarFotos(); };
    /* ---------- mensajes grupales: ahora o programados ---------- */
    let msjProg = false;
    const fHora = t => { const d = new Date(t); return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); };
    const setMq = prog => { msjProg = prog; p.querySelectorAll('[data-mq]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.mq === 'prog') === prog)));
      $('tl-ms-cu').hidden = !prog; if (prog && !$('tl-ms-f').value) $('tl-ms-f').value = masDias(1); $('tl-ms-ok').textContent = prog ? '🗓️ Programar envío' : '📣 Enviar a todos'; };
    const listaMsj = async () => {
      const { data } = await sb.from('mensajes').select('*').order('enviar_at', { ascending: false }).limit(30);
      const ms = data || [], prog = ms.filter(m => !m.enviado_at).reverse(), env = ms.filter(m => m.enviado_at).slice(0, 10);
      const it = (m, e) => `<div class="msj-it${e ? ' env' : ''}"><div class="tx"><b>${escA(m.titulo || 'Mensaje de tu profe')}</b><div class="mt">${e ? '✓ Enviado ' + escA(fHora(m.enviado_at)) : '🕒 Se envía ' + escA(fHora(m.enviar_at))}</div><p>${escA(m.cuerpo)}</p></div><button class="del" data-mdel="${m.id}" aria-label="${e ? 'Borrar mensaje' : 'Cancelar envío'}">✕</button></div>`;
      $('tl-ms-lst').innerHTML = (prog.length ? '<div class="day">Programados</div>' + prog.map(m => it(m, false)).join('') : '')
        + (env.length ? '<div class="day" style="margin-top:10px">Enviados</div>' + env.map(m => it(m, true)).join('') : '')
        || '<div class="empty" style="padding:14px 0">Aún no has enviado mensajes.</div>';
      $('tl-ms-lst').style.cssText = 'display:flex;flex-direction:column;gap:8px'; };
    const enviarMsj = async () => {
      const m = (t, c) => { $('tl-ms-msg').style.color = c || '#6fd39a'; $('tl-ms-msg').textContent = t; };
      const txt = $('tl-ms-txt').value.trim(), tit = $('tl-ms-tit').value.trim();
      if (!txt) { m('Escribe el mensaje.', '#ff8a94'); $('tl-ms-txt').focus(); return; }
      let cuando = new Date();
      if (msjProg) { const f = $('tl-ms-f').value, h = $('tl-ms-h').value || '09:00';
        if (!f) { m('Elige la fecha.', '#ff8a94'); return; }
        cuando = new Date(f + 'T' + h); if (cuando <= new Date()) { m('Esa hora ya pasó. Elige una más adelante.', '#ff8a94'); return; } }
      if (!msjProg && !confirm('¿Enviar este mensaje ahora a todos tus alumnos?')) return;
      const b = $('tl-ms-ok'); b.disabled = true;
      const { error } = await sb.from('mensajes').insert({ titulo: tit || null, cuerpo: txt, enviar_at: cuando.toISOString() });
      b.disabled = false;
      if (error) { m('No se pudo guardar: ' + error.message, '#ff8a94'); return; }
      $('tl-ms-txt').value = ''; $('tl-ms-tit').value = '';
      m(msjProg ? 'Programado ✓ Se enviará ' + fHora(cuando) + '.' : 'Enviado ✓ Les llega en unos segundos.'); setMq(false);
      setTimeout(listaMsj, msjProg ? 0 : 2500); listaMsj(); };
    const lista = async () => {
      const [a, b, c] = await Promise.all([
        sb.from('eventos').select('*').gte('fecha', iso).order('fecha').order('hora', { nullsFirst: true }).limit(60),
        sb.from('eventos').select('*').lt('fecha', iso).order('fecha', { ascending: false }).order('hora', { nullsFirst: true }).limit(100),
        sb.from('eventos').select('alumno,fecha,tipo').eq('tipo', 'Evaluación').lt('fecha', iso).limit(2000)]);
      eventos = a.data || []; pasados = b.data || []; evPasadas = c.data || []; pintar(); if (vista === 'fot') pintarFotos(); };
    const ver = v => { vista = v; p.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === v)));
      $('tl-ag-nuevo').hidden = v !== 'nuevo'; $('tl-ag-prox').hidden = v !== 'prox'; $('tl-ag-hist').hidden = v !== 'hist'; $('tl-ag-fot').hidden = v !== 'fot'; if (v === 'fot') pintarFotos(); $('tl-ag-msj').hidden = v !== 'msj'; if (v === 'msj') listaMsj(); $('tl-ag-foot').hidden = v !== 'nuevo'; };
    const conAdj = () => editAdj && !quitarAdj;
    const limpiarArchivo = () => { $('tl-ag-file').value = ''; $('tl-ag-fn').textContent = conAdj() ? '📎 Archivo actual (elige otro para reemplazarlo)' : 'Elegir PDF o imagen (máx. 15 MB)'; $('tl-ag-rm').hidden = !conAdj(); };
    const setTipo = t => { tipo = TIPOS.includes(t) ? t : 'Otro'; p.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === tipo))); $('tl-ag-tit').placeholder = TEJ[tipo]; };
    const salirEdicion = () => { editId = null; editAdj = null; quitarAdj = false;
      $('tl-ag-tit').value = ''; $('tl-ag-det').value = ''; $('tl-ag-link').value = ''; $('tl-ag-al').value = ''; $('tl-ag-adj').open = false; limpiarArchivo();
      $('tl-ag-ok').textContent = 'Guardar en la agenda'; $('tl-ag-tabn').textContent = '＋ Nuevo'; $('tl-ag-cx').hidden = true; };
    const editar = e => { editId = e.id; editAdj = e.adjunto || null; quitarAdj = false;
      const sel = $('tl-ag-al'); if (e.alumno && !sel.querySelector('option[value="' + CSS.escape(e.alumno) + '"]')) { const o = document.createElement('option'); o.value = e.alumno; o.textContent = nom[e.alumno] || e.alumno; sel.appendChild(o); }
      sel.value = e.alumno || ''; setTipo(e.tipo);
      $('tl-ag-fecha').value = e.fecha; $('tl-ag-hora').value = e.hora ? e.hora.slice(0, 5) : '';
      $('tl-ag-tit').value = e.titulo || ''; $('tl-ag-det').value = e.detalle || ''; $('tl-ag-link').value = e.link || '';
      $('tl-ag-adj').open = !!(e.adjunto || e.link); limpiarArchivo(); marcaQuick();
      $('tl-ag-ok').textContent = 'Guardar cambios'; $('tl-ag-tabn').textContent = '✏️ Editando'; $('tl-ag-cx').hidden = false; msg('');
      ver('nuevo'); $('tl-ag-tit').focus(); };
    $('tl-ag-file').onchange = () => { const f = $('tl-ag-file').files[0]; if (!f) return limpiarArchivo(); $('tl-ag-fn').textContent = f.name; $('tl-ag-rm').hidden = false; };
    $('tl-ag-cx').onclick = () => { salirEdicion(); msg(''); ver('prox'); };
    $('tl-ag-fecha').oninput = marcaQuick; $('tl-ag-hora').oninput = marcaQuick; marcaQuick();
    p.onclick = async ev => {
      if (ev.target === p || ev.target.closest('[data-x]')) return cerrar();
      const tv = ev.target.closest('[data-v]'); if (tv) return ver(tv.dataset.v);
      const tt = ev.target.closest('[data-t]'); if (tt) { setTipo(tt.dataset.t);
        if (tipo === 'Documento' || tipo === 'Nutrición') $('tl-ag-adj').open = true; return; }
      const q = ev.target.closest('[data-q]'); if (q) { if (q.dataset.q === 'h') $('tl-ag-hora').value = ''; else $('tl-ag-fecha').value = masDias(+q.dataset.q); marcaQuick(); return; }
      if (ev.target.closest('#tl-ag-rm')) { ev.preventDefault(); if (!$('tl-ag-file').files[0] && editAdj) quitarAdj = true; return limpiarArchivo(); }
      const mq = ev.target.closest('[data-mq]'); if (mq) { setMq(mq.dataset.mq === 'prog'); return; }
      if (ev.target.id === 'tl-ms-ok') { enviarMsj(); return; }
      const md = ev.target.closest('[data-mdel]'); if (md) { if (!confirm('¿Borrar este mensaje? Los alumnos dejarán de verlo en su Inicio.')) return;
        await sb.from('mensajes').delete().eq('id', md.dataset.mdel); listaMsj(); return; }
      const fsm = ev.target.closest('[data-fsem]'); if (fsm) { semFoto = Number(fsm.dataset.fsem); try { localStorage.setItem('tl-fot-sem', String(semFoto)); } catch (_) {} pintarFotos(); return; }
      const fag = ev.target.closest('[data-fag]'); if (fag) { agendarFoto(fag.dataset.fag); return; }
      if (ev.target.id === 'tl-fot-all') { agendarFotosTodos(ev.target); return; }
      const ed = ev.target.closest('[data-ed]'); if (ed) { const e = eventos.concat(pasados).find(x => String(x.id) === ed.dataset.ed); if (e) editar(e); return; }
      const d = ev.target.closest('[data-del]'); if (d) { if (!confirm('¿Borrar este evento de la agenda?')) return;
        await sb.from('eventos').delete().eq('id', d.dataset.del); if (d.dataset.adj) await sb.storage.from('fotos').remove([d.dataset.adj]); if (String(editId) === d.dataset.del) salirEdicion(); lista(); return; }
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
          const fila = { alumno: v('tl-ag-al') || null, tipo, fecha: v('tl-ag-fecha'), hora: v('tl-ag-hora') || null, titulo: v('tl-ag-tit'), detalle: v('tl-ag-det') || null, link: link || null };
          if (editId) {
            const viejo = editAdj; fila.adjunto = adjunto || (quitarAdj ? null : viejo);
            const { data: upd, error: e1 } = await sb.from('eventos').update(fila).eq('id', editId).select('id');
            const error = e1 || (!(upd || []).length ? { message: 'no hay permiso para editar o el evento ya no existe' } : null);
            if (error) { if (adjunto) await sb.storage.from('fotos').remove([adjunto]); msg('No se pudo guardar: ' + error.message, '#ff8a94'); return; }
            if (viejo && fila.adjunto !== viejo) await sb.storage.from('fotos').remove([viejo]);
            salirEdicion(); msg('Cambios guardados ✓'); lista(); return;
          }
          fila.adjunto = adjunto;
          const { error } = await sb.from('eventos').insert(fila);
          if (error) { msg('No se pudo guardar: ' + error.message, '#ff8a94'); return; }
          const para = v('tl-ag-al') ? (nom[v('tl-ag-al')] || '').split(' ')[0] : 'todos';
          msg('Guardado ✓ Ya aparece en la agenda de ' + para + '.');
          $('tl-ag-tit').value = ''; $('tl-ag-det').value = ''; $('tl-ag-link').value = ''; limpiarArchivo(); $('tl-ag-adj').open = false; lista();
        } finally { ok.disabled = false; }
      }
    };
    if (typeof v0 === 'string' && ['prox', 'hist', 'fot', 'msj'].includes(v0)) ver(v0);
    lista();
  }
  window.tlAbrirAgenda = v => abrirAgenda(v);

  /* ---------- acceso de cada alumno a su app (ficha) ---------- */
  async function pintarAcceso(el) {
    const code = el.dataset.tlAcceso; el.dataset.done = '1';
    const { data: a } = await sb.from('alumnos').select('acceso,user_id,email').eq('codigo', code).maybeSingle(); if (!a) return;
    const on = a.acceso !== false;
    const est = !on ? '🔒 Sin acceso a la app' : a.user_id ? '📱 Usa la app' : a.email ? '📱 Con acceso · aún no entra' : '📱 Con acceso · falta su correo en Datos';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border:1px solid var(--line,#2f2a2e);border-radius:10px;font-size:14px"><span>${est}</span><button type="button" data-tl-acc="${on ? 'off' : 'on'}" style="min-height:36px;padding:0 12px;border-radius:8px;border:1px solid ${on ? '#ff8a94' : '#17804a'};background:transparent;color:${on ? '#ff8a94' : '#6fd39a'};font:600 14px Barlow,sans-serif;cursor:pointer">${on ? 'Quitar acceso' : 'Dar acceso'}</button></div>`;
    el.querySelector('[data-tl-acc]').onclick = async ev => { const btn = ev.currentTarget, v = btn.dataset.tlAcc === 'on';
      if (!v && !confirm('¿Quitar el acceso a la app? Se cerrará su sesión y no podrá entrar hasta que le des acceso de nuevo. Sus datos se mantienen.')) return;
      btn.disabled = true; const { error } = await sb.rpc('set_acceso', { p_codigo: code, p_on: v });
      if (error) { alert('No se pudo cambiar: ' + error.message); btn.disabled = false; return; } pintarAcceso(el); };
  }
  new MutationObserver(() => document.querySelectorAll('[data-tl-acceso]:not([data-done])').forEach(pintarAcceso)).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- respaldo: descarga todos los datos en un archivo ---------- */
  const BK = 'tl-respaldo';
  const bkDias = () => { try { const t = Number(localStorage.getItem(BK)); return t ? (Date.now() - t) / 864e5 : Infinity; } catch (e) { return Infinity; } };
  function respaldoBtn() {
    if (document.getElementById('tl-bk')) return;
    const b = document.createElement('button'); b.id = 'tl-bk'; b.title = 'Descargar respaldo'; b.setAttribute('aria-label', 'Descargar respaldo de datos');
    b.style.cssText = 'display:none;margin:8px auto calc(96px + env(safe-area-inset-bottom));background:none;border:0;padding:8px 12px;color:#8a8287;font:500 13px Barlow,system-ui,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px';
    const mostrar = () => { const v = document.getElementById('view'); const f = v && v.firstElementChild; if (f && !(v.children.length === 1 && f.matches('div.empty, div.notice'))) b.style.display = 'block'; else setTimeout(mostrar, 400); }; setTimeout(mostrar, 400);
    const pintar = () => { const d = bkDias(); b.textContent = '💾 Descargar respaldo de datos · ' + (d === Infinity ? 'nunca descargado' : 'último hace ' + Math.floor(d) + ' día(s)'); b.style.color = d > 30 ? '#d71f30' : '#8a8287'; };
    b.onclick = async () => {
      if (b.disabled) return; const d = bkDias();
      if (!confirm('¿Descargar un respaldo con todos los datos de Titanium?\n\n' + (d === Infinity ? 'Nunca has descargado uno.' : 'Último respaldo: hace ' + Math.floor(d) + ' día(s).') + '\n\nGuarda el archivo en un lugar seguro (iCloud, Drive o tu computador).')) return;
      b.disabled = true; b.textContent = '⏳ Preparando respaldo…';
      try {
        const out = { app: 'Titanium Sport', fecha: new Date().toISOString(), tablas: {} };
        for (const t of ['alumnos', 'planes', 'clases', 'rutinas', 'eventos', 'solicitudes', 'config', 'coaches', 'confirmaciones', 'mensajes']) {
          const rows = []; for (let i = 0; ; i += 1000) { const { data, error } = await sb.from(t).select('*').range(i, i + 999); if (error) throw new Error(t + ': ' + error.message); rows.push(...data); if (data.length < 1000) break; }
          out.tablas[t] = rows;
        }
        const f = new Date(); const nom = 'titanium-respaldo-' + f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0') + '.json';
        const blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' });
        const file = new File([blob], nom, { type: 'application/json' });
        const bajar = () => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); };
        let ok = false; if (navigator.canShare && navigator.canShare({ files: [file] }) && /iP(hone|ad)|Android/.test(navigator.userAgent)) { ok = await navigator.share({ files: [file], title: nom }).then(() => true, e => e && e.name === 'AbortError'); }
        if (!ok) bajar();
        try { localStorage.setItem(BK, String(Date.now())); } catch (e) {}
        alert('Respaldo listo ✓\n' + Object.entries(out.tablas).map(([k, v]) => k + ': ' + v.length).join(' · ') + '\n\nLas fotos y documentos siguen guardados en Supabase.');
      } catch (e) { alert('No se pudo crear el respaldo: ' + e.message); }
      b.disabled = false; pintar();
    };
    pintar(); document.body.appendChild(b);
  }

  let ready = null;
  async function boot() {
    const s = await ensureSession();
    const { data: esCoach, error: eC } = await sb.rpc('is_coach');
    if (!esCoach && !eC) { location.replace('alumno.html' + location.search); return new Promise(() => {}); }
    const hide = document.getElementById('tl-hide'); if (hide) hide.remove();
    solicitudes(); agendaBtn(); respaldoBtn(); sb.channel('tl-sol').on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes' }, () => solicitudes()).subscribe();
    return s;
  }
  window.claude = {
    use: async name => { ready = ready || boot(); await ready;
      if (name === 'db') return db; if (name === 'downloads') return downloads; if (name === 'assets') return assets; return null; },
  };
})();
