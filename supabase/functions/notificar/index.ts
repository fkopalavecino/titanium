// Titanium Sport · avisos push a alumnos (evento nuevo, recordatorios, clases, mensajes grupales y personales, pagos, recuperaciones) y al profe (confirmaciones, recuperaciones, comprobantes, ingresos nuevos, resumen de pagos)
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const KEY = (() => { try { return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default; } catch { return null; } })() ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(Deno.env.get('SUPABASE_URL')!, KEY, { auth: { persistSession: false } });
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const ICO: Record<string, string> = { 'Reunión': '👥', 'Evaluación': '📋', 'Nutrición': '🥗', 'Documento': '📄', 'Actividad': '🏃', 'Evento': '⭐', 'Otro': '📌' };
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaTxt = (f: string) => { const [y, m, d] = f.split('-').map(Number); return DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] + ' ' + d + ' de ' + MES[m - 1]; };
const diaCL = (n = 0) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + n * 864e5));
const hora = (h: string | null) => (h ? String(h).slice(0, 5) : '');
const clp = (n: number) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');

let vapid: { pub: string; priv: string } | null = null;
async function claves() {
  if (vapid) return vapid;
  const { data } = await sb.from('push_cfg').select('pub,priv').eq('id', 1).maybeSingle();
  if (data?.pub && data?.priv) vapid = { pub: data.pub, priv: data.priv };
  else {
    const k = webpush.generateVAPIDKeys();
    const { error } = await sb.from('push_cfg').insert({ id: 1, pub: k.publicKey, priv: k.privateKey });
    if (error) { const r = await sb.from('push_cfg').select('pub,priv').eq('id', 1).single(); vapid = r.data as { pub: string; priv: string }; }
    else vapid = { pub: k.publicKey, priv: k.privateKey };
  }
  webpush.setVapidDetails('https://titaniumapp.cl/', vapid.pub, vapid.priv);
  return vapid;
}
async function subsDe(alumno: string | null) {
  let q = sb.from('push_subs').select('endpoint,sub');
  if (alumno) q = q.eq('alumno', alumno);
  const { data } = await q; return data || [];
}
async function enviar(subs: { endpoint: string; sub: unknown }[], msg: Record<string, string>) {
  const body = JSON.stringify(msg); let ok = 0, fallos = 0;
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification(s.sub as any, body, { TTL: 86400, urgency: 'high' }); ok++; }
    catch (e) { fallos++; const c = (e as { statusCode?: number }).statusCode;
      if (c === 404 || c === 410) { await sb.from('push_subs').delete().eq('endpoint', s.endpoint); await sb.from('coach_push').delete().eq('endpoint', s.endpoint); }
      else console.error('push', c, (e as { body?: string }).body); }
  }));
  return { ok, fallos };
}
const subsProfe = async () => (await sb.from('coach_push').select('endpoint,sub')).data || [];
const nombreProfe = async () => { const { data: cf } = await sb.from('config').select('data').eq('id', 1).maybeSingle(); return String(cf?.data?.coach || 'Tu profe').split(' ')[0]; };
// link del profe directo al bloque de esa clase
const urlClase = (f: string, h: string) => `./index.html#clase/${f}/${h}`;
// aviso al alumno: ganó una clase para recuperar
async function avisarRecupAlumno(alumno: string, rq: { disponibles?: number; vence?: string; opciones?: number }, delProfe: boolean) {
  const prof = delProfe ? await nombreProfe() : '';
  const n = Number(rq?.disponibles || 1); const vence = rq?.vence ? ' · vence el ' + fechaTxt(String(rq.vence)) : '';
  return enviar(await subsDe(alumno), {
    title: delProfe ? `🔁 ${prof} te dio una clase para recuperar` : '🔁 Ganaste una clase para recuperar',
    body: `${rq?.opciones ? 'Agéndala tú mismo en tu app' : 'Agéndala en tu app cuando se abran bloques'}${n > 1 ? ` (tienes ${n})` : ''}${vence}.`,
    url: './alumno.html', tag: 'recup-' + alumno });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const k = await claves();
    const b = await req.json().catch(() => ({}));
    if (b.init) return json({ pub: k.pub });
    if (b.prueba) {
      const { data } = await sb.from('push_subs').select('endpoint,sub').eq('endpoint', String(b.prueba));
      if (data?.length) return json(await enviar(data, { title: '🔔 Avisos activados', body: 'Así te llegarán los avisos de Titanium Sport.', url: './alumno.html', tag: 'prueba' }));
      const { data: cp } = await sb.from('coach_push').select('endpoint,sub').eq('endpoint', String(b.prueba));
      if (cp?.length) return json(await enviar(cp, { title: '🔔 Avisos de profe activados', body: 'Te avisaremos cuando un alumno confirme o cancele su clase.', url: './index.html#clase', tag: 'prueba' }));
      return json({ ok: 0 });
    }
    if (b.evento != null) {
      const { data: e } = await sb.from('eventos').update({ notificado_at: new Date().toISOString() }).eq('id', b.evento).is('notificado_at', null).select().maybeSingle();
      if (!e) return json({ skip: true });
      if (e.fecha < diaCL()) return json({ pasado: true });
      const cuando = e.fecha === diaCL() ? 'hoy' : e.fecha === diaCL(1) ? 'mañana' : fechaTxt(e.fecha);
      return json(await enviar(await subsDe(e.alumno), {
        title: `${ICO[e.tipo] || '📌'} ${e.titulo}`,
        body: `Nuevo en tu agenda · ${cuando}${e.hora ? ', ' + hora(e.hora) : ''}${e.adjunto || e.link ? ' · incluye archivo 📎' : ''}`,
        url: `./alumno.html?ev=${e.id}`, tag: 'ev-' + e.id }));
    }
    if (b.modo === 'recordatorio') {
      const { data: evs } = await sb.from('eventos').update({ recordado_at: new Date().toISOString() }).eq('fecha', diaCL(1)).is('recordado_at', null).select();
      const out = [];
      for (const e of evs || []) out.push(await enviar(await subsDe(e.alumno), {
        title: `⏰ Mañana: ${e.titulo}`, body: `${e.hora ? hora(e.hora) + ' · ' : ''}${e.tipo || 'Actividad'} · Titanium Sport`,
        url: `./alumno.html?ev=${e.id}`, tag: 'rec-' + e.id }));
      return json({ eventos: (evs || []).length, out });
    }
    if (b.modo === 'clases') {
      const { data: pend, error } = await sb.rpc('clases_por_recordar');
      if (error) throw error;
      const out = [];
      for (const p of pend || []) {
        // se registra antes de enviar: si dos ejecuciones coinciden, solo una envía
        const { data: reg } = await sb.from('recordatorios_clase').insert({ alumno: p.alumno, fecha: p.fecha, hora: p.hora }).select().maybeSingle();
        if (!reg) continue;
        const h = hora(p.hora); const cuando = p.fecha === diaCL() ? 'Hoy' : 'Mañana';
        out.push(await enviar(await subsDe(p.alumno), {
          title: `💪 ${cuando} tienes clase a las ${h}`,
          body: '¿Vienes? Toca para confirmar tu asistencia.',
          url: `./alumno.html?clase=${p.fecha}_${h}`, tag: `cl-${p.fecha}-${h}`, clase: `${p.fecha}_${h}` }));
      }
      return json({ clases: (pend || []).length, out });
    }
    if (b.modo === 'confirmacion') {
      // se vuelve a leer desde la base: el aviso solo sale si el estado cambió y aún no se avisó
      const { data: c } = await sb.from('confirmaciones').select('fecha,hora,alumno,estado,avisado')
        .eq('alumno', String(b.alumno)).eq('fecha', String(b.fecha)).eq('hora', String(b.hora)).maybeSingle();
      if (!c || c.estado === c.avisado) return json({ skip: true });
      const { data: up } = await sb.from('confirmaciones').update({ avisado: c.estado })
        .eq('alumno', c.alumno).eq('fecha', c.fecha).eq('hora', c.hora).eq('estado', c.estado).select('alumno').maybeSingle();
      if (!up) return json({ skip: true });
      const { data: a } = await sb.from('alumnos').select('nombre').eq('codigo', c.alumno).maybeSingle();
      const nom = String(a?.nombre || c.alumno).trim(); const h = hora(c.hora);
      const cuando = c.fecha === diaCL() ? 'hoy' : c.fecha === diaCL(1) ? 'mañana' : fechaTxt(c.fecha);
      const voy = c.estado === 'voy';
      // si avisó a tiempo gana una clase para recuperar: se le avisa a él y se suma al aviso del profe
      let rq: { gana?: boolean; disponibles?: number; vence?: string; opciones?: number } | null = null;
      if (!voy) { const r = await sb.rpc('recuperable', { c: c.alumno, f: c.fecha, h: c.hora }); rq = r.data; if (rq?.gana) await avisarRecupAlumno(c.alumno, rq, false); }
      return json(await enviar(await subsProfe(), {
        title: voy ? `✅ ${nom} viene` : `❌ ${nom} no viene`,
        body: `Clase de ${cuando} a las ${h}${voy ? '' : rq?.gana ? ' · 🔁 ganó 1 clase para recuperar' : ' · toca para ver la clase'}`,
        url: urlClase(c.fecha, h), tag: `cf-${c.alumno}-${c.fecha}-${h}` }));
    }
    if (b.modo === 'recup_ganada') {
      // el profe le dio una clase para recuperar (marcó «Avisó»): aviso al alumno
      const { data: rq } = await sb.rpc('recuperable', { c: String(b.alumno), f: String(b.fecha), h: String(b.hora) });
      return json(await avisarRecupAlumno(String(b.alumno), rq || {}, true));
    }
    if (b.modo === 'pago_nuevo') {
      // un alumno envió un comprobante: aviso al profe para revisarlo y confirmarlo
      const { data: s } = await sb.from('solicitudes').select('alumno,data').eq('id', String(b.sol)).maybeSingle();
      if (!s) return json({ skip: true });
      const nom = String(s.data?.nombre || s.alumno).trim();
      return json(await enviar(await subsProfe(), { title: `💳 ${nom} envió un comprobante`, body: `${s.data?.monto || ''}${s.data?.comprobante ? ' · con foto' : ''} · toca para revisarlo y confirmarlo`, url: './index.html#solicitudes', tag: 'sol-' + b.sol }));
    }
    if (b.modo === 'pago_estado') {
      // el profe confirmó o rechazó el comprobante: aviso al alumno
      const { data: s } = await sb.from('solicitudes').select('alumno,estado,data').eq('id', String(b.sol)).maybeSingle();
      if (!s) return json({ skip: true });
      const prof = await nombreProfe(); const d = s.data || {};
      let fin = '';
      if (s.estado === 'aprobada' && d.plan) { const { data: p } = await sb.from('planes').select('fin').eq('id', String(d.plan)).maybeSingle(); if (p?.fin) fin = ` Tu plan queda vigente hasta el ${fechaTxt(p.fin)}.`; }
      const msg = s.estado === 'aprobada'
        ? { title: '✅ Pago confirmado', body: `${prof} confirmó tu pago de ${d.confirmado ? clp(d.confirmado) : d.monto || ''}.${fin} ¡Gracias!` }
        : { title: '⚠️ Tu comprobante no se pudo confirmar', body: `Revisa el monto o escríbele a ${prof}. Puedes enviarlo de nuevo desde Perfil › Pagos.` };
      return json(await enviar(await subsDe(s.alumno), { ...msg, url: './alumno.html?pago=1', tag: 'pago-' + b.sol }));
    }
    if (b.modo === 'mensajes') {
      // mensajes del profe (grupales o para un alumno): se marcan como enviados antes de mandar, así nunca salen dos veces
      const ahora = new Date().toISOString();
      const { data: ms } = await sb.from('mensajes').update({ enviado_at: ahora }).lte('enviar_at', ahora).is('enviado_at', null).select();
      const out = []; let todos: { endpoint: string; sub: unknown }[] | null = null;
      for (const m of ms || []) {
        const personal = !!m.alumno;
        const subs = personal ? await subsDe(m.alumno) : (todos = todos || await subsDe(null));
        out.push(await enviar(subs, {
          title: `${personal ? '💬' : '📣'} ${m.titulo || 'Mensaje de tu profe'}`, body: String(m.cuerpo || '').slice(0, 180),
          url: `./alumno.html?msg=${m.id}`, tag: 'msg-' + m.id }));
      }
      return json({ mensajes: (ms || []).length, out });
    }
    if (b.modo === 'recuperacion') {
      // un alumno agendó o canceló una recuperación desde su app: aviso informativo al profe
      const { data: a } = await sb.from('alumnos').select('nombre').eq('codigo', String(b.alumno)).maybeSingle();
      const nom = String(a?.nombre || b.alumno).trim(); const f = String(b.fecha), h = hora(String(b.hora));
      const cuando = f === diaCL() ? 'hoy' : f === diaCL(1) ? 'mañana' : fechaTxt(f);
      const ag = b.accion === 'agenda';
      return json(await enviar(await subsProfe(), {
        title: ag ? `🔁 ${nom} recupera una clase` : `↩️ ${nom} canceló su recuperación`,
        body: `${ag ? 'Viene' : 'Ya no viene'} ${cuando} a las ${h}`, url: urlClase(f, h), tag: `rc-${b.alumno}-${f}-${h}` }));
    }
    if (b.modo === 'ingreso') {
      // un alumno terminó su ingreso a la app (ficha + información leída): aviso al profe con lo importante
      const { data: a } = await sb.from('alumnos').select('nombre,perfil').eq('codigo', String(b.alumno)).maybeSingle();
      if (!a) return json({ skip: true });
      const f = (a.perfil || {}).ficha || {};
      const { count } = await sb.from('push_subs').select('endpoint', { count: 'exact', head: true }).eq('alumno', String(b.alumno));
      const les = Array.isArray(f.lesiones) ? f.lesiones.length : 0, enf = Array.isArray(f.enfermedades) ? f.enfermedades.length : 0;
      const parq = f.parqResp ? Object.values(f.parqResp).filter((v) => v === 'si').length : (Array.isArray(f.parq) ? f.parq.length : 0);
      const alertas = [les ? `${les} lesión${les === 1 ? '' : 'es'}` : '', enf ? `${enf} condición${enf === 1 ? '' : 'es'} de salud` : '', parq ? `${parq} « sí » en PAR-Q` : ''].filter(Boolean);
      const partes = [f.fecha ? 'Ficha completa' : 'Sin ficha', count ? '🔔 avisos activos' : '🔕 sin avisos', 'leyó la información'];
      return json(await enviar(await subsProfe(), {
        title: `🎉 ${String(a.nombre || b.alumno).trim()} ya está en la app`,
        body: partes.join(' · ') + (alertas.length ? ` · ⚠️ Revisa su ficha: ${alertas.join(', ')}` : ''),
        url: './index.html#alumnos', tag: 'ing-' + b.alumno }));
    }
    if (b.modo === 'pagos') {
      // avisos al alumno: 5 días antes, el día del vencimiento y 3 días después (se registra antes de enviar)
      const { data: pend, error } = await sb.rpc('pagos_por_avisar'); if (error) throw error;
      const out = [];
      for (const p of pend || []) {
        const { data: reg } = await sb.from('recordatorios_pago').insert({ alumno: p.alumno, plan: p.plan, tipo: p.tipo }).select().maybeSingle();
        if (!reg) continue;
        const monto = p.saldo > 0 ? ' · saldo ' + clp(p.saldo) : p.monto ? ' · ' + clp(p.monto) : '';
        const msg = p.tipo === 'antes' ? { title: '💳 Tu plan vence en 5 días', body: `Renueva antes del ${fechaTxt(p.fin)}${monto}. Toca para ver los datos de transferencia.` }
          : p.tipo === 'hoy' ? { title: '💳 Hoy vence tu plan', body: `Renuévalo hoy para seguir entrenando${monto}. Toca para pagar.` }
          : { title: '⚠️ Tu plan venció hace 3 días', body: 'Regulariza tu pago para seguir reservando y recuperando clases.' };
        out.push(await enviar(await subsDe(p.alumno), { ...msg, url: './alumno.html?pago=1', tag: `pg-${p.plan}-${p.tipo}` }));
      }
      return json({ avisos: (pend || []).length, out });
    }
    if (b.modo === 'resumen_pagos') {
      const { data: r, error } = await sb.rpc('resumen_pagos'); if (error) throw error;
      const v = r?.vencen || [], x = r?.vencidos || [];
      if (!v.length && !x.length && !r?.saldo && !r?.pendientes) return json({ nada: true });
      const lista = (a: string[]) => a.slice(0, 4).join(', ') + (a.length > 4 ? ` y ${a.length - 4} más` : '');
      const partes = [v.length ? `Vencen ${v.length}: ${lista(v)}` : '', x.length ? `Vencidos ${x.length}: ${lista(x)}` : '', r?.saldo ? `${r.saldo} con saldo` : '', r?.pendientes ? `${r.pendientes} comprobante${r.pendientes === 1 ? '' : 's'} por revisar` : ''].filter(Boolean);
      return json(await enviar(await subsProfe(), { title: '💰 Pagos de la semana', body: partes.join(' · '), url: './index.html#pagos', tag: 'resumen-pagos' }));
    }
    return json({ error: 'sin acción' }, 400);
  } catch (err) { console.error(err); return json({ error: String((err as Error)?.message || err) }, 500); }
});
