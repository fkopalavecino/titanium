/* Titanium · sugerencia automática de carga (la misma regla en la app del alumno y en el panel del profe)
   Entrada: { nombre, dosis, tipo: 'kg'|'corporal'|'reps'|'tiempo', prev: { sets:[{kg,r,t}], rpe, f } | null, descarga }
   - Lee la dosis ("4 × 8–10 · RIR 2") → series, rango de reps y RIR objetivo.
   - RIR real de la vez anterior ≈ 10 − RPE anotado en la clase (tabla clases.rpe). Sin RPE: solo se miran las reps.
   Regla:
   · Tope del rango en todas las series y RIR objetivo o más fácil → subir (+2,5 kg barra · +1–2 kg por mancuerna · +1 placa máquina/polea)
   · Dentro del rango → mantener y buscar más reps
   · Bajo el mínimo o más duro que el RIR objetivo → mantener; si pasan las dos cosas → bajar ~5 %
   · Semana de descarga → nunca sugiere subir
   · Peso corporal → +reps; al pasar el tope, lastre (+2,5 kg) */
(function () {
  const fx = v => String(Math.round(v * 10) / 10).replace('.', ',');
  const MANC = /mancuerna|\bkb\b|kettlebell|pesa rusa/i;
  const POLEA = /polea|cable|cruce|face ?pull|jal[oó]n/i;
  const MAQ = /m[aá]quina|prensa|pec ?deck|contractora|hack|extensi[oó]n de (cu[aá]driceps|piernas|rodilla)|curl femoral(?!.*fitball)|abductor|aductor|gemelos? (en|sentado)/i;
  const SALTO = /salto|jump|pogo|brinco|pliom[eé]tric|skipping|step-?up explosivo|burpee/i;
  const DESCARGA = /descarga|deload|semana suave/i;

  function dosisDe(d) {
    d = String(d || '');
    const m = d.match(/(\d+)\s*[×x]\s*(\d+)(?:\s*[–-]\s*(\d+))?(?!\d|[.,]\d|\s*(?:s\b|seg|"|min|m\b|cal))/i);
    const ms = d.match(/^\s*(\d+)\s*[×x]/); const series = m ? Number(m[1]) : ms ? Number(ms[1]) : 0;
    const lo = m ? Number(m[2]) : null, hi = m ? Number(m[3] || m[2]) : null;
    const ri = d.match(/RIR\s*(\d+)(?:\s*[–-]\s*(\d+))?/i);
    const rp = !ri && d.match(/RPE\s*(\d+(?:[.,]\d)?)(?:\s*[–-]\s*(\d+))?/i);
    const rir = ri ? Number(ri[1]) : rp ? Math.max(0, 10 - Number(String(rp[2] || rp[1]).replace(',', '.'))) : null;
    return { series, lo, hi, rir };
  }

  // "60 kg × 10,10,10,10" · "50 kg × 15 · 70 kg × 6,6" · "10,9,8 reps" · "30,30 s"
  function fmtUltima(sets, tipo) {
    const ss = (sets || []).filter(s => s && (s.kg != null || s.r != null || s.t != null)); if (!ss.length) return '';
    if (tipo === 'tiempo') return ss.filter(s => s.t != null).map(s => s.t).join(',') + ' s';
    const g = []; ss.forEach(s => { const k = s.kg > 0 ? s.kg : 0; const l = g[g.length - 1]; if (l && l.k === k) l.r.push(s.r ?? '–'); else g.push({ k, r: [s.r ?? '–'] }); });
    const corp = tipo === 'corporal' || tipo === 'reps';
    return g.map(x => x.k ? (corp ? '+' : '') + fx(x.k) + ' kg × ' + x.r.join(',') : x.r.join(',') + ' reps').join(' · ');
  }

  const redondea = (v, paso) => Math.round(v / paso) * paso;

  function calc(o) {
    const nombre = o.nombre || '', tipo = o.tipo || 'kg', ds = dosisDe(o.dosis), prev = o.prev, desc = !!o.descarga;
    const sets = (prev && prev.sets || []).filter(s => s && (s.kg != null || s.r != null || s.t != null));
    if (!sets.length) return { primera: true, linea: 'Primera vez: busca tu carga base', txt: 'Primera vez: busca tu carga base' };
    const ultima = 'Última vez: ' + fmtUltima(sets, tipo) + (prev.rpe != null && prev.rpe !== '' ? ' · RPE ' + fx(Number(prev.rpe)) : '');
    const rirReal = prev.rpe != null && prev.rpe !== '' && !isNaN(Number(prev.rpe)) ? 10 - Number(prev.rpe) : null;
    const rirOk = ds.rir == null || rirReal == null || rirReal >= ds.rir; // RIR objetivo o más fácil
    const masDuro = ds.rir != null && rirReal != null && rirReal < ds.rir;
    const out = (sug, extra) => Object.assign({ ultima, sug, linea: ultima + (sug ? ' · Sugerencia: ' + sug : '') }, extra);

    // por tiempo (planchas…): +5 s si llegó al objetivo
    if (tipo === 'tiempo') { const ts = sets.filter(s => s.t > 0).map(s => s.t); if (!ts.length) return out('');
      const t = Math.max(...ts); const obj = (String(o.dosis || '').match(/(\d+)\s*(s\b|seg)/i) || [])[1];
      if (!desc && (!obj || ts.every(x => x >= Number(obj)))) return out((t + 5) + ' s', { t: t + 5, sube: true });
      return out('mantén ' + t + ' s', { t }); }

    if (SALTO.test(nombre)) return out('');
    if (ds.lo == null) return out(''); // dosis sin rango de reps ("3 × máx", "10 m"…): solo muestra la última vez
    const nS = ds.series || 1;

    // peso corporal (dominadas, fondos…): primero reps, después lastre
    if (tipo === 'corporal' || tipo === 'reps') {
      const rs = sets.filter(s => s.r != null); if (!rs.length) return out('');
      const lastre = Math.max(0, ...rs.map(s => s.kg || 0));
      const top = rs.length >= nS && rs.every(s => s.r >= ds.hi);
      if (top && rirOk && !desc) { const nk = lastre + 2.5; return out(lastre ? `+${fx(nk)} kg de lastre` : 'agrega lastre: +2,5 kg', { kg: nk, sube: true, lastre: true }); }
      if (desc) return out('semana de descarga: mismas reps' + (lastre ? ` con +${fx(lastre)} kg` : ''), lastre ? { kg: lastre } : {});
      if (masDuro || rs.some(s => s.r < ds.lo)) return out('mantén y apunta a ' + ds.lo + (ds.hi !== ds.lo ? '–' + ds.hi : '') + ' reps', lastre ? { kg: lastre } : {});
      return out('+1 rep por serie (meta ' + ds.hi + ')', lastre ? { kg: lastre } : {});
    }

    // con kilos
    const ks = sets.filter(s => s.kg > 0 && s.r != null); if (!ks.length) return out('');
    // carga de trabajo = la más repetida (si empata, la más pesada): ignora calentamientos y un intento suelto más pesado
    const cnt = {}; ks.forEach(s => { cnt[s.kg] = (cnt[s.kg] || 0) + 1; });
    const kg = Number(Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || b - a)[0]); const top = ks.filter(s => s.kg === kg);
    const manc = MANC.test(nombre), polea = !manc && POLEA.test(nombre), maq = !manc && !polea && MAQ.test(nombre);
    const paso = manc ? 1 : 2.5;
    const completo = (top.length >= nS || ks.length >= nS) && top.every(s => s.r >= ds.hi); // si anotó el calentamiento como serie, cuentan las de trabajo
    const bajoMin = top.some(s => s.r < ds.lo);
    if (completo && rirOk) {
      if (desc) return out(`mantén ${fx(kg)} kg (semana de descarga)`, { kg, desc: true });
      if (manc) { const nk = kg + (kg < 10 ? 1 : 2); return out(`${fx(nk)} kg por mancuerna`, { kg: nk, sube: true }); }
      if (maq || polea) { const nk = kg + (polea ? 2.5 : 5); return out(`+1 placa (~${fx(nk)} kg)`, { kg: nk, sube: true }); }
      const nk = kg + 2.5; return out(`${fx(nk)} kg`, { kg: nk, sube: true });
    }
    if (bajoMin && masDuro) { const nk = Math.max(paso, Math.min(kg - paso, redondea(kg * 0.95, paso))); return out(`baja a ${fx(nk)} kg (−5 %)`, { kg: nk, baja: true }); }
    if (bajoMin || masDuro) { const nk = Math.max(paso, Math.min(kg - paso, redondea(kg * 0.92, paso))); return out(`mantén ${fx(kg)} kg (o baja a ${fx(nk)} si te costó)`, { kg }); }
    return out(`mantén ${fx(kg)} kg y busca más reps`, { kg });
  }

  const esDescarga = linea => DESCARGA.test(String(linea || ''));
  // mismo ejercicio aunque cambie el prefijo ("1a · ") o lo que va entre paréntesis
  const norm = n => String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(min(uto)?\s*\d+|\d+[ab]?)\s*·\s*/i, '').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  window.TLSug = { calc, dosisDe, fmtUltima, esDescarga, norm };
})();
