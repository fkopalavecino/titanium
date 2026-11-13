/* Titanium · cálculo de metas nutricionales y pauta automática (3 opciones por comida con los mismos macros).
   Lo usan el panel del profe y la app del alumno. Requiere alimentos.js (window.TL_ALIMENTOS). */
(function () {
  const BASE = (window.TL_ALIMENTOS || []).map(a => ({ n: a[0], e: a[1] || '', kcal: a[2], prot: a[3], carb: a[4], gras: a[5], pn: a[6] || '', pg: a[7] || 0 }));
  const food = (n, e) => BASE.find(a => a.n === n && a.e === (e || '')) || BASE.find(a => a.n === n);
  const r = x => Math.round(Number(x) || 0);

  /* ---------- metas ---------- */
  const OBJ = {
    bajar: { l: 'Bajar grasa', ic: '🔥', aj: [-25, -15], def: -20, txt: 'Déficit del 15 al 25 %' },
    recomp: { l: 'Recomposición corporal', ic: '⚖️', aj: [-10, 0], def: -5, txt: 'Bajar grasa y subir músculo a la vez' },
    mantener: { l: 'Mantener', ic: '🎯', aj: [0, 0], def: 0, txt: 'Comer lo que gastas' },
    subir: { l: 'Ganar músculo', ic: '💪', aj: [5, 10], def: 7, txt: 'Superávit del 5 al 10 %' },
  };
  const ACT = [['sed', 1.2, 'Sedentario', 'No entrena'], ['1-3', 1.375, '1 a 3 días', 'Entrena 1 a 3 días'], ['3-5', 1.55, '3 a 5 días', 'Entrena 3 a 5 días'], ['6-7', 1.725, '6 a 7 días', 'Entrena 6 a 7 días']];
  const factor = (dias, fisico) => { const f = (ACT.find(a => a[0] === dias) || ACT[2])[1]; return fisico ? Math.max(f, 1.725) : f; };
  // datos del último InBody con peso: peso, % grasa, masa libre de grasa, músculo, basal
  // f (opcional): fecha del InBody a usar; si no está, el último
  function datos(inbody, f) {
    const ls = (inbody || []).filter(x => x && Number(x.peso)).slice().sort((a, b) => String(a.f).localeCompare(String(b.f)));
    const x = (f && ls.find(y => y.f === f)) || ls[ls.length - 1]; if (!x) return null; const n = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
    const peso = n(x.peso), pgc = n(x.pgc), tmb = n(x.tmb), mme = n(x.mme);
    let mlg = n(x.mlg); if (mlg == null && pgc != null) mlg = Math.round(peso * (1 - pgc / 100) * 10) / 10;
    return { f: x.f, peso, pgc, mlg, mme, tmb: tmb >= 800 && tmb <= 4500 ? tmb : null };
  }
  function basal(d) { if (!d) return null; if (d.tmb) return { v: d.tmb, src: 'InBody' }; if (d.mlg) return { v: 370 + 21.6 * d.mlg, src: 'Katch-McArdle' }; return null; }
  function calcMetas(d, o) {
    const b = basal(d); if (!b || !d.peso) return null; o = o || {};
    const obj = OBJ[o.obj] ? o.obj : 'recomp', ob = OBJ[obj];
    const aj = Math.min(ob.aj[1], Math.max(ob.aj[0], o.aj != null && o.aj !== '' ? +o.aj : ob.def));
    const fac = factor(o.dias, o.fisico), get = b.v * fac;
    const kcal = Math.round(get * (1 + aj / 100) / 10) * 10;
    const pRango = aj < 0 ? [2.0, 2.4] : [1.6, 2.2];
    const pkg = Math.min(pRango[1], Math.max(pRango[0], o.pkg ? +o.pkg : (aj < 0 ? 2.2 : obj === 'subir' ? 2.0 : 1.8)));
    const gkg = Math.min(1, Math.max(0.8, o.gkg ? +o.gkg : 0.9));
    // con % de grasa alto, proteína y grasa van sobre un peso de referencia (su masa magra a 25 % de grasa), no el peso total
    const pRef = d.mlg && d.pgc > 25 ? Math.min(d.peso, d.mlg / 0.75) : d.peso;
    const prot = r(pRef * pkg); const gras = Math.max(r(pRef * gkg), Math.ceil(kcal * 0.2 / 9));
    const carb = Math.max(0, r((kcal - prot * 4 - gras * 9) / 4));
    return { kcal, prot, carb, gras, obj, dias: o.dias || '3-5', fisico: !!o.fisico, aj, pkg, gkg, factor: fac, basal: r(b.v), basalSrc: b.src, get: r(get), peso: d.peso, ib: d.f };
  }

  /* ---------- pauta ---------- */
  const COMIDAS = { 4: [['desayuno', 'Desayuno', 0.25], ['almuerzo', 'Almuerzo', 0.30], ['once', 'Once', 0.20], ['cena', 'Cena', 0.25]],
    5: [['desayuno', 'Desayuno', 0.22], ['colacion', 'Colación', 0.10], ['almuerzo', 'Almuerzo', 0.28], ['once', 'Once', 0.18], ['cena', 'Cena', 0.22]] };
  const ENS = 'Ensalada surtida (lechuga, tomate, pepino)';
  // cada plato: nombre (t), alimentos fijos [nombre, estado, g] + 3 que se ajustan (proteína, carbohidrato, grasa)
  // veg: solo se usa en pautas vegetarianas/veganas. Cada pauta toma 3 platos distintos al azar.
  const T = {
    desayuno: [
      { t: 'Bowl de yogur griego, avena y frutillas', fijo: [['Frutillas', '', 100]], v: [['Yogur griego natural 0%'], ['Avena en hojuelas'], ['Almendras']] },
      { t: 'Huevos revueltos con tomate, marraqueta y palta', fijo: [['Huevo entero', '', 100], ['Tomate', '', 60]], v: [['Clara de huevo'], ['Pan marraqueta'], ['Palta']] },
      { t: 'Tostadas integrales con maní, plátano y yogur proteico', fijo: [['Plátano', '', 60]], v: [['Yogur proteico'], ['Pan de molde integral'], ['Mantequilla de maní']] },
      { t: 'Omelette de claras con espinaca y champiñones + tostada con palta', fijo: [['Huevo entero', '', 50], ['Espinaca', '', 40], ['Champiñones', '', 60]], v: [['Clara de huevo'], ['Pan de molde integral'], ['Palta']] },
      { t: 'Avena proteica con arándanos y nueces', fijo: [['Arándanos', '', 75]], v: [['Proteína whey (polvo)'], ['Avena en hojuelas'], ['Nueces']] },
      { t: 'Panqueques de avena, plátano y claras con almendras', fijo: [['Plátano', '', 60], ['Huevo entero', '', 50]], v: [['Clara de huevo'], ['Avena en hojuelas'], ['Almendras']] },
      { t: 'Tostadas de quesillo, tomate y palta', fijo: [['Tomate', '', 80]], v: [['Quesillo'], ['Pan de molde integral'], ['Palta']] },
      { t: 'Cottage con kiwi, pan pita integral y almendras', fijo: [['Kiwi', '', 100]], v: [['Queso cottage'], ['Pan pita integral'], ['Almendras']] },
      { t: 'Wrap de huevo, espinaca y palta', fijo: [['Huevo entero', '', 100], ['Espinaca', '', 30]], v: [['Clara de huevo'], ['Tortilla de trigo (wrap)'], ['Palta']] },
      { t: 'Batido de proteína vegetal, avena y plátano con chía', veg: 1, fijo: [['Plátano', '', 80]], v: [['Proteína vegetal (polvo)'], ['Avena en hojuelas'], ['Semillas de chía']] },
    ],
    colacion: [
      { t: 'Yogur griego con manzana y almendras', fijo: [], v: [['Yogur griego natural 0%'], ['Manzana'], ['Almendras']] },
      { t: 'Yogur proteico con plátano y nueces', fijo: [], v: [['Yogur proteico'], ['Plátano'], ['Nueces']] },
      { t: 'Huevo duro con galletas de arroz y maní', fijo: [['Huevo entero', '', 50]], v: [['Clara de huevo'], ['Galletas de arroz'], ['Maní tostado']] },
      { t: 'Batido de proteína con plátano y mantequilla de maní', fijo: [], v: [['Proteína whey (polvo)'], ['Plátano'], ['Mantequilla de maní']] },
      { t: 'Cottage con piña y nueces', fijo: [], v: [['Queso cottage'], ['Piña'], ['Nueces']] },
      { t: 'Galletas de arroz con pavo, tomate y palta', fijo: [['Tomate', '', 40]], v: [['Jamón de pavo'], ['Galletas de arroz'], ['Palta']] },
      { t: 'Yogur proteico con arándanos y chía', fijo: [], v: [['Yogur proteico'], ['Arándanos'], ['Semillas de chía']] },
      { t: 'Edamame con mandarina y almendras', veg: 1, fijo: [], v: [['Edamame', 'cocido'], ['Mandarina'], ['Almendras']] },
    ],
    almuerzo: [
      { t: 'Pollo a la plancha con arroz y ensalada', fijo: [[ENS, '', 200]], v: [['Pechuga de pollo', 'cocido'], ['Arroz blanco', 'cocido'], ['Aceite de oliva']] },
      { t: 'Carne molida con papas y ensalada con palta', fijo: [[ENS, '', 200]], v: [['Carne molida 5% grasa', 'cocido'], ['Papa', 'cocido'], ['Palta']] },
      { t: 'Atún con arroz integral y brócoli', fijo: [['Brócoli', 'cocido', 150]], v: [['Atún en agua (escurrido)'], ['Arroz integral', 'cocido'], ['Aceite de oliva']] },
      { t: 'Salmón al horno con camote y verduras', fijo: [['Brócoli', 'cocido', 100], ['Zanahoria', 'cocido', 60]], v: [['Salmón', 'cocido'], ['Camote', 'cocido'], ['Aceite de oliva']] },
      { t: 'Charquicán magro de vacuno', fijo: [['Zapallo camote', 'cocido', 100], ['Porotos verdes', 'cocido', 60], ['Cebolla', '', 30]], v: [['Vacuno magro (posta, lomo)', 'cocido'], ['Papa', 'cocido'], ['Aceite de oliva']] },
      { t: 'Lentejas guisadas con pollo y verduras', fijo: [['Zanahoria', 'cocido', 50], ['Pimentón', '', 40], ['Cebolla', '', 30]], v: [['Pechuga de pollo', 'cocido'], ['Lentejas', 'cocido'], ['Aceite de oliva']] },
      { t: 'Fideos integrales a la boloñesa', fijo: [['Tomate', '', 100], ['Champiñones', '', 60], ['Cebolla', '', 30]], v: [['Carne molida 5% grasa', 'cocido'], ['Fideos integrales', 'cocido'], ['Aceite de oliva']] },
      { t: 'Merluza a la plancha con quínoa y ensalada', fijo: [[ENS, '', 200]], v: [['Merluza / reineta', 'cocido'], ['Quínoa', 'cocido'], ['Palta']] },
      { t: 'Trutro de pollo al horno con cuscús y verduras', fijo: [['Zapallo italiano', '', 100], ['Pimentón', '', 50]], v: [['Trutro de pollo sin piel', 'cocido'], ['Cuscús', 'cocido'], ['Aceite de oliva']] },
      { t: 'Lomo de cerdo con arroz integral y ensalada de repollo', fijo: [['Repollo', '', 100], ['Zanahoria', 'crudo', 50]], v: [['Lomo de cerdo', 'cocido'], ['Arroz integral', 'cocido'], ['Aceite de oliva']] },
      { t: 'Porotos con zapallo y huevo', veg: 1, fijo: [['Zapallo camote', 'cocido', 80], [ENS, '', 150]], v: [['Huevo entero'], ['Porotos', 'cocido'], ['Aceite de oliva']] },
      { t: 'Tofu salteado con arroz integral y verduras', veg: 1, fijo: [['Brócoli', 'cocido', 100], ['Pimentón', '', 50]], v: [['Tofu'], ['Arroz integral', 'cocido'], ['Aceite de oliva']] },
      { t: 'Tempeh con quínoa y ensalada', veg: 1, fijo: [[ENS, '', 200]], v: [['Tempeh'], ['Quínoa', 'cocido'], ['Palta']] },
    ],
    once: [
      { t: 'Marraqueta con atún, tomate y palta', fijo: [['Tomate', '', 60]], v: [['Atún en agua (escurrido)'], ['Pan marraqueta'], ['Palta']] },
      { t: 'Yogur griego con avena, arándanos y nueces', fijo: [['Arándanos', '', 75]], v: [['Yogur griego natural 0%'], ['Avena en hojuelas'], ['Nueces']] },
      { t: 'Huevos con pan integral y palta', fijo: [['Huevo entero', '', 50]], v: [['Clara de huevo'], ['Pan de molde integral'], ['Palta']] },
      { t: 'Sándwich integral de pavo, lechuga y palta', fijo: [['Tomate', '', 50], ['Lechuga', '', 20]], v: [['Jamón de pavo'], ['Pan de molde integral'], ['Palta']] },
      { t: 'Wrap de pollo con lechuga, tomate y palta', fijo: [['Lechuga', '', 30], ['Tomate', '', 50]], v: [['Pechuga de pollo', 'cocido'], ['Tortilla de trigo (wrap)'], ['Palta']] },
      { t: 'Batido de proteína con avena, frutillas y maní', fijo: [['Frutillas', '', 100]], v: [['Proteína whey (polvo)'], ['Avena en hojuelas'], ['Mantequilla de maní']] },
      { t: 'Tostadas con cottage, pera y nueces', fijo: [['Pera', '', 80]], v: [['Queso cottage'], ['Pan de molde integral'], ['Nueces']] },
      { t: 'Marraqueta con jurel, tomate y cebolla', fijo: [['Tomate', '', 60], ['Cebolla', '', 20]], v: [['Jurel en lata'], ['Pan marraqueta'], ['Palta']] },
      { t: 'Pan pita con tofu, pepino y palta', veg: 1, fijo: [['Pepino', '', 60], ['Tomate', '', 50]], v: [['Tofu'], ['Pan pita integral'], ['Palta']] },
    ],
    cena: [
      { t: 'Pollo con papas y zapallo italiano', fijo: [['Zapallo italiano', '', 150]], v: [['Pechuga de pollo', 'cocido'], ['Papa', 'cocido'], ['Aceite de oliva']] },
      { t: 'Carne molida con arroz y ensalada', fijo: [[ENS, '', 200]], v: [['Carne molida 5% grasa', 'cocido'], ['Arroz blanco', 'cocido'], ['Aceite de oliva']] },
      { t: 'Huevos con ensalada, pan y palta', fijo: [[ENS, '', 150], ['Huevo entero', '', 100]], v: [['Clara de huevo'], ['Pan marraqueta'], ['Palta']] },
      { t: 'Salmón con quínoa y brócoli', fijo: [['Brócoli', 'cocido', 150]], v: [['Salmón', 'cocido'], ['Quínoa', 'cocido'], ['Aceite de oliva']] },
      { t: 'Tortilla de claras con verduras y papas', fijo: [['Huevo entero', '', 50], ['Espinaca', '', 40], ['Champiñones', '', 60], ['Pimentón', '', 40]], v: [['Clara de huevo'], ['Papa', 'cocido'], ['Aceite de oliva']] },
      { t: 'Merluza al horno con camote y porotos verdes', fijo: [['Porotos verdes', 'cocido', 150]], v: [['Merluza / reineta', 'cocido'], ['Camote', 'cocido'], ['Aceite de oliva']] },
      { t: 'Fajitas de vacuno con pimentón y palta', fijo: [['Pimentón', '', 80], ['Cebolla', '', 40]], v: [['Vacuno magro (posta, lomo)', 'cocido'], ['Tortilla de trigo (wrap)'], ['Palta']] },
      { t: 'Pavo salteado con arroz integral y verduras', fijo: [['Zapallo italiano', '', 100], ['Zanahoria', 'cocido', 50]], v: [['Pechuga de pavo', 'cocido'], ['Arroz integral', 'cocido'], ['Aceite de oliva']] },
      { t: 'Pollo al jugo con fideos integrales y champiñones', fijo: [['Champiñones', '', 80], ['Espinaca', '', 40]], v: [['Pechuga de pollo', 'cocido'], ['Fideos integrales', 'cocido'], ['Aceite de oliva']] },
      { t: 'Garbanzos salteados con tofu y verduras', veg: 1, fijo: [['Zapallo italiano', '', 100], ['Pimentón', '', 50]], v: [['Tofu'], ['Garbanzos', 'cocido'], ['Aceite de oliva']] },
      { t: 'Tempeh con camote y brócoli', veg: 1, fijo: [['Brócoli', 'cocido', 150]], v: [['Tempeh'], ['Camote', 'cocido'], ['Aceite de oliva']] },
    ],
  };
  // unidades (se redondea a unidades enteras o medias) y topes razonables
  const UNI = { 'Huevo entero': [50, 'huevo', 'huevos'], 'Clara de huevo': [33, 'clara', 'claras'], 'Pan marraqueta': [50, '½ marraqueta', ''], 'Pan de molde integral': [30, 'rebanada', 'rebanadas'], 'Pan hallulla': [45, '½ hallulla', ''], 'Galletas de arroz': [9, 'galleta', 'galletas'] };
  const PASO = n => UNI[n] ? UNI[n][0] : /Aceite|Mantequilla de maní|Almendras|Nueces|Maní|chía|Linaza|whey|Proteína vegetal/.test(n) ? 5 : 10;
  const TOPE = n => /Aceite/.test(n) ? 25 : /whey|Proteína vegetal/.test(n) ? 50 : /Jamón de pavo/.test(n) ? 120 : /Quesillo/.test(n) ? 150 : /Tortilla de trigo/.test(n) ? 120 : /Galletas de arroz/.test(n) ? 54 : /Plátano|Manzana|Pera|Piña|Mandarina|Arándanos/.test(n) ? 250 : /Chía|chía/.test(n) ? 30 : /Mantequilla de maní|Almendras|Nueces|Maní/.test(n) ? 40 : /Palta/.test(n) ? 120 : /Clara/.test(n) ? 330 : /Pan/.test(n) ? 200 : /Avena/.test(n) ? 120 : /Yogur/.test(n) ? 400 : 450;
  const mac = (f, g) => ({ kcal: f.kcal * g / 100, prot: f.prot * g / 100, carb: f.carb * g / 100, gras: f.gras * g / 100 });
  function suma(items) { return items.reduce((t, it) => { const f = food(it.n, it.e); if (!f) return t; const m = mac(f, it.g); return { kcal: t.kcal + m.kcal, prot: t.prot + m.prot, carb: t.carb + m.carb, gras: t.gras + m.gras }; }, { kcal: 0, prot: 0, carb: 0, gras: 0 }); }
  // mínimos cuadrados con pesos por kcal (prot y carb ×4, grasa ×9) sobre las variables libres, con límites
  function resolver(fs, obj) {
    const W = [4, 4, 9]; const col = f => [f.prot / 100, f.carb / 100, f.gras / 100];
    const fijo = [null, null, null];
    for (let it = 0; it < 6; it++) {
      const libres = [0, 1, 2].filter(i => fijo[i] == null && fs[i].n !== '_'); [0, 1, 2].forEach(i => { if (fs[i].n === '_') fijo[i] = 0; });
      const rest = [0, 1, 2].map(k => obj[k] - [0, 1, 2].reduce((s, i) => s + (fijo[i] != null ? col(fs[i])[k] * fijo[i] : 0), 0));
      // normal equations: (AᵀWA) x = AᵀW b
      const A = [0, 1, 2].map(k => libres.map(i => col(fs[i])[k] * W[k])); const b = rest.map((v, k) => v * W[k]);
      const n = libres.length; const M = [...Array(n)].map((_, a) => [...Array(n)].map((_, c) => A.reduce((s, row) => s + row[a] * row[c], 0)));
      const y = [...Array(n)].map((_, a) => A.reduce((s, row, k) => s + row[a] * b[k], 0));
      const x = gauss(M, y); if (!x) { libres.forEach(i => { fijo[i] = 0; }); break; }
      let mal = false; libres.forEach((i, j) => { const tp = TOPE(fs[i].n); if (x[j] < 0) { fijo[i] = 0; mal = true; } else if (x[j] > tp) { fijo[i] = tp; mal = true; } });
      if (!mal) { libres.forEach((i, j) => { fijo[i] = x[j]; }); break; }
      if (libres.length === 0) break;
    }
    return fijo.map(v => v || 0);
  }
  function gauss(M, y) { const n = y.length; if (!n) return []; const a = M.map((row, i) => [...row, y[i]]);
    for (let c = 0; c < n; c++) { let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(a[i][c]) > Math.abs(a[p][c])) p = i; if (Math.abs(a[p][c]) < 1e-9) return null; [a[c], a[p]] = [a[p], a[c]];
      for (let i = 0; i < n; i++) if (i !== c) { const k = a[i][c] / a[c][c]; for (let j = c; j <= n; j++) a[i][j] -= k * a[c][j]; } }
    return a.map((row, i) => row[n] / row[i]); }
  // reparte los gramos de los alimentos variables (con su rol p/c/g) para llegar a los macros de la comida
  function ajustar(vs, fijos, meta) {
    const fm = suma(fijos); const fs = vs.map(v => food(v.n, v.e)).filter(Boolean); const roles = vs.filter(v => food(v.n, v.e)).map(v => v.r);
    while (fs.length < 3) { fs.push({ n: '_', e: '', prot: 0, carb: 0, gras: 0 }); roles.push(null); }
    const obj = [meta.prot - fm.prot, meta.carb - fm.carb, meta.gras - fm.gras];
    const redo = (x, i) => { const st = PASO(fs[i].n); let g = Math.round(x / st) * st; if (g === 0 && x >= st * 0.35) g = st; return g; };
    let x = resolver(fs, obj);
    // 1º se redondean los alimentos por unidad (claras, pan) y se reajustan los demás para compensar
    const uni = fs.map((f, i) => !!UNI[f.n] && x[i] > 0);
    if (uni.some(Boolean)) { const fijo = fs.map((f, i) => uni[i] ? redo(x[i], i) : f.n === '_' ? 0 : null);
      const rest = [0, 1, 2].map(k => obj[k] - fs.reduce((sm, f, i) => sm + (fijo[i] ? [f.prot, f.carb, f.gras][k] / 100 * fijo[i] : 0), 0));
      const libres = fs.map((f, i) => fijo[i] == null ? i : -1).filter(i => i >= 0);
      if (libres.length) { const sub = resolver([...libres.map(i => fs[i]), ...Array(3 - libres.length).fill(null)].map(f => f || { n: '_', prot: 0, carb: 0, gras: 0 }), rest); libres.forEach((i, j) => { fijo[i] = sub[j]; }); }
      x = fijo; }
    const vars = fs.map((f, i) => f.n === '_' ? null : { n: f.n, e: f.e, g: redo(x[i], i), r: roles[i] }).filter(it => it && it.g > 0);
    return [...vars, ...fijos];
  }
  function opcion(tpl, meta) {
    const esc = Math.min(1, meta.kcal / 550); // en comidas chicas los fijos (huevos, fruta) se achican
    const fijos = tpl.fijo.map(([n, e, g]) => { const st = PASO(n); return { n, e: e || '', g: Math.max(st, Math.round(g * esc / st) * st), r: rolFijo(n, e) }; });
    return { t: tpl.t, items: ajustar(tpl.v.map(([n, e], i) => ({ n, e: e || '', r: 'pcg'[i] })), fijos, meta) };
  }
  /* ---------- variar: cambiar un alimento por otro del mismo tipo manteniendo los macros ---------- */
  const CAT = {
    p: [['Pechuga de pollo', 'cocido'], ['Pechuga de pavo', 'cocido'], ['Trutro de pollo sin piel', 'cocido'], ['Carne molida 5% grasa', 'cocido'], ['Vacuno magro (posta, lomo)', 'cocido'], ['Lomo de cerdo', 'cocido'], ['Merluza / reineta', 'cocido'], ['Salmón', 'cocido'], ['Atún en agua (escurrido)'], ['Jurel en lata'], ['Clara de huevo'], ['Huevo entero'], ['Yogur griego natural 0%'], ['Yogur proteico'], ['Queso cottage'], ['Quesillo'], ['Jamón de pavo'], ['Proteína whey (polvo)'], ['Tofu'], ['Tempeh'], ['Seitán'], ['Proteína de soya texturizada', 'crudo'], ['Edamame', 'cocido'], ['Proteína vegetal (polvo)']],
    c: [['Arroz blanco', 'cocido'], ['Arroz integral', 'cocido'], ['Fideos / pasta', 'cocido'], ['Fideos integrales', 'cocido'], ['Quínoa', 'cocido'], ['Papa', 'cocido'], ['Camote', 'cocido'], ['Choclo', 'cocido'], ['Lentejas', 'cocido'], ['Porotos', 'cocido'], ['Garbanzos', 'cocido'], ['Cuscús', 'cocido'], ['Mote de trigo', 'cocido'], ['Pan marraqueta'], ['Pan hallulla'], ['Pan de molde integral'], ['Pan pita integral'], ['Tortilla de trigo (wrap)'], ['Galletas de arroz'], ['Avena en hojuelas'], ['Plátano'], ['Manzana'], ['Pera'], ['Naranja'], ['Mandarina'], ['Kiwi'], ['Uvas'], ['Mango'], ['Piña'], ['Frutillas'], ['Arándanos'], ['Dátiles']],
    g: [['Aceite de oliva'], ['Palta'], ['Almendras'], ['Nueces'], ['Maní tostado'], ['Mantequilla de maní'], ['Semillas de chía'], ['Linaza molida'], ['Aceitunas'], ['Queso gauda / mantecoso']],
    v: [[ENS], ['Lechuga'], ['Tomate'], ['Pepino'], ['Zanahoria', 'crudo'], ['Brócoli', 'cocido'], ['Coliflor', 'cocido'], ['Zapallo italiano'], ['Espinaca'], ['Porotos verdes', 'cocido'], ['Betarraga', 'cocido'], ['Repollo'], ['Champiñones'], ['Pimentón'], ['Cebolla'], ['Zapallo camote', 'cocido']],
    fr: [['Frutillas'], ['Arándanos'], ['Frambuesas'], ['Plátano'], ['Manzana'], ['Pera'], ['Naranja'], ['Mandarina'], ['Kiwi'], ['Durazno'], ['Uvas'], ['Piña'], ['Mango'], ['Melón'], ['Sandía']],
  };
  const CAT_L = { p: 'Proteína', c: 'Carbohidrato', g: 'Grasa', v: 'Verdura', fr: 'Fruta' };
  const en = (k, n, e) => CAT[k].some(([a, b]) => a === n && (b || '') === (e || ''));
  function rolFijo(n, e) { return en('v', n, e) ? 'v' : en('fr', n, e) ? 'fr' : 'f'; }
  // rol de un alimento ya puesto (las pautas antiguas no lo traen guardado)
  function rol(it) { if (it.r && CAT[it.r]) return it.r; if (en('v', it.n, it.e)) return 'v'; const f = food(it.n, it.e); if (!f) return 'f';
    const k = [f.prot * 4, f.carb * 4, f.gras * 9]; const i = k.indexOf(Math.max(...k)); return 'pcg'[i]; }
  function alternativas(it) { const r = it.r && CAT[it.r] ? it.r : rol(it); if (!CAT[r]) return []; return CAT[r].filter(([n, e]) => !(n === it.n && (e || '') === (it.e || ''))).map(([n, e]) => ({ n, e: e || '', r })); }
  // cambia el alimento ii de la opción por (n, e) y reajusta los gramos para mantener los macros de la comida
  const rolDe = x => (x.r && (CAT[x.r] || x.r === 'f')) ? x.r : rol(x);
  // separa variables (una por rol p/c/g) y fijos, y reajusta
  function reajustar(items, meta) { const vs = [], fijos = [], vistos = new Set();
    items.forEach(x => { const r = rolDe(x); if ('pcg'.includes(r) && r.length === 1 && !vistos.has(r)) { vistos.add(r); vs.push(Object.assign({}, x, { r })); } else fijos.push(Object.assign({}, x, { r })); });
    return { items: ajustar(vs, fijos.filter(x => x.g > 0), meta) }; }
  // cambia el alimento ii de la opción por (n, e) y reajusta los gramos para mantener los macros de la comida
  function cambiar(op, ii, n, e, meta) {
    const it = op.items[ii]; const r = rolDe(it); const nuevo = { n, e: e || '', r };
    if (r === 'v' || r === 'fr' || r === 'f') { // fijos: verdura con los mismos gramos; fruta con las mismas kcal
      const fo = food(it.n, it.e), fnw = food(n, e); const st = PASO(n);
      nuevo.g = r !== 'v' && fo && fnw && fnw.kcal ? Math.max(st, Math.round(it.g * fo.kcal / fnw.kcal / st) * st) : it.g; }
    const o = reajustar(op.items.map((x, i) => i === ii ? nuevo : x), meta); op.items = o.items; delete op.t; return op; }
  function quitar(op, ii, meta) { const o = reajustar(op.items.filter((_, i) => i !== ii), meta); op.items = o.items; delete op.t; return op; }
  const DES_P = /Clara|Huevo|Yogur|cottage|Atún|whey/, DES_C = /Pan|Avena|Galletas|Tortilla|Plátano/;
  const COM_P = /Pechuga|Trutro|Carne molida|Vacuno|Lomo de cerdo|Merluza|Salmón|Atún|Jurel|Huevo|Clara/, COM_C = /Arroz|Fideos|Quínoa|Papa|Camote|Choclo|Lentejas|Porotos|Garbanzos|Cuscús|Mote/;
  // variar toda la opción: proteína y carbohidrato al azar (y a veces la grasa), con alimentos que calcen con esa comida
  // elige platos: sin alimentos excluidos primero, al azar y con proteínas distintas
  const esVeg = ex => (ex || []).includes('pollo') && (ex || []).includes('carne');
  const malos = (t, ex) => [...t.fijo, ...t.v].filter(([n]) => excluido(n, ex)).length;
  function elegir(k, ex, cant, no) { const veg = esVeg(ex); no = no || [];
    const ls = (T[k] || []).filter(t => (!t.veg || veg) && !no.includes(t.t)).map(t => ({ t, s: malos(t, ex) - (veg && t.veg ? 0.5 : 0) + Math.random() * 0.4 })).sort((a, b) => a.s - b.s).map(x => x.t);
    const fam = n => (n.match(/pollo|pavo|Carne|Vacuno|cerdo|Salmón|Merluza|Atún|Jurel|Huevo|Clara|Yogur|cottage|Quesillo|whey|Tofu|Tempeh|Edamame|vegetal/) || [n])[0].replace(/Clara/, 'Huevo').replace(/Carne/, 'Vacuno').replace(/Salmón|Merluza|Atún|Jurel/, 'pez');
    const out = [], prot = new Set(); ls.forEach(t => { const f = fam(t.v[0][0]); if (out.length < cant && !prot.has(f)) { out.push(t); prot.add(f); } }); ls.forEach(t => { if (out.length < cant && !out.includes(t)) out.push(t); }); return out; }
  // variar toda la opción: otro plato distinto (usados = nombres de las otras opciones de esa comida), con los mismos macros
  function variar(op, meta, comida, ex, usados) {
    const nuevo = elegir(comida, ex, 1, [op.t, ...(usados || [])].filter(Boolean))[0];
    if (nuevo && !malos(nuevo, ex)) return limpiar(opcion(nuevo, meta), meta, comida, ex);
    return variarAlimentos(op, meta, comida, ex); }
  function variarAlimentos(op, meta, comida, ex) {
    const comidaFuerte = comida === 'almuerzo' || comida === 'cena';
    const pick = (r, it) => { let ls = alternativas(it).filter(x => !excluido(x.n, ex));
      if (r === 'p') ls = ls.filter(x => (comidaFuerte ? COM_P : DES_P).test(x.n)); else if (r === 'c') ls = ls.filter(x => (comidaFuerte ? COM_C : DES_C).test(x.n)); else ls = ls.filter(x => (comidaFuerte ? /Aceite de oliva|Palta|Aceitunas/ : /Almendras|Nueces|Maní|Mantequilla de maní|Palta|chía|Linaza/).test(x.n));
      return ls.length ? ls[Math.floor(Math.random() * ls.length)] : null; };
    let o = { items: op.items.map(x => Object.assign({}, x, { r: rolDe(x) })) };
    ['p', 'c', 'g'].forEach(r => { if (r === 'g' && Math.random() < 0.5) return; const i = o.items.findIndex(x => x.r === r); if (i < 0) return; const nw = pick(r, o.items[i]); if (nw) o = cambiar(o, i, nw.n, nw.e, meta); });
    // si la comida quedó sin proteína/carbo/grasa (algún alimento quedó en 0 g), se repone uno para volver a cuadrar los macros
    let falta = false;
    ['p', 'c', 'g'].forEach(r => { if (o.items.some(x => x.r === r)) return; const nw = pick(r, { n: '', e: '', r }); if (nw) { o.items.push({ n: nw.n, e: nw.e, g: 0, r }); falta = true; } });
    if (falta) o = reajustar(o.items, meta);
    return limpiar(o, meta, comida, ex); }
  function generar(metas, nCom, ex) {
    const cs = COMIDAS[nCom === 5 ? 5 : 4];
    return { fecha: new Date().toISOString().slice(0, 10), nCom: cs.length, comidas: cs.map(([k, l, p]) => {
      const meta = { kcal: r(metas.kcal * p), prot: r(metas.prot * p), carb: r(metas.carb * p), gras: r(metas.gras * p) };
      return { k, l, p, meta, ops: elegir(k, ex, 3).map(t => limpiar(opcion(t, meta), meta, k, ex)) }; }) };
  }
  // medida casera para mostrar junto a los gramos
  const FR = q => { const e = Math.floor(q), f = q - e; const s = f >= 0.875 ? '' : f >= 0.625 ? '¾' : f >= 0.375 ? '½' : f >= 0.125 ? '¼' : ''; const ee = f >= 0.875 ? e + 1 : e; return (ee ? ee : '') + s || '¼'; };
  function medida(n, e, g) {
    const u = UNI[n]; if (u) { const q = g / u[0]; if (n === 'Pan marraqueta' || n === 'Pan hallulla') { const und = q / 2; return FR(und) + (n === 'Pan marraqueta' ? ' marraqueta' : ' hallulla'); } const k = Math.round(q * 2) / 2; return FR(k) + ' ' + (k > 1 ? u[2] : u[1]); }
    const f = food(n, e); if (!f || !f.pg || /Ensalada/.test(n)) return '';
    const m = f.pn.match(/^(\d+)(?:\/(\d+))?\s+(.*)$/); const qty = m ? (m[2] ? +m[1] / +m[2] : +m[1]) : 1; let un = m ? m[3] : f.pn;
    const q = g / f.pg * qty; if (q < 0.15 || q > 8) return '';
    un = un.replace(/^unidad mediana$/, 'unidad').replace(/^unidades$/, 'unidad').replace(/^cucharadas$/, 'cucharada');
    const k = Math.round(q * 4) / 4; const pl = k > 1 && !/^(taza|lata|porción|unidad|lámina|cucharada|cucharadita|puñado|filete|bistec|chuleta|presa|trozo|vaso|copa)$/.test(un) ? '' : '';
    const plural = k > 1 ? un.replace(/^(taza|lata|porción|unidad|lámina|cucharada|cucharadita|puñado|filete|bistec|chuleta|presa|trozo|vaso|copa)\b/, w => w === 'porción' ? 'porciones' : w === 'unidad' ? 'unidades' : w + 's') : un;
    return '≈ ' + FR(k) + ' ' + plural + pl;
  }
  const nombre = (n, e) => n.replace(' (escurrido)', '') + (e === 'cocido' ? ' (cocido)' : e === 'crudo' ? ' (crudo)' : '');


  /* ---------- alimentos que no come ---------- */
  const EXCL = {
    lacteos: ['🥛 Lácteos', /Yogur|Leche|Quesillo|cottage|Queso|Crema de leche|whey|^Mantequilla$/],
    huevo: ['🥚 Huevo', /Huevo|Clara/],
    pescado: ['🐟 Pescados y mariscos', /Atún|Jurel|Salmón|Merluza/],
    pollo: ['🍗 Pollo y pavo', /pollo|pavo/i],
    carne: ['🥩 Carne de vacuno', /Carne molida|Vacuno/],
    cerdo: ['🐖 Cerdo', /cerdo|Vienesa/i],
    gluten: ['🌾 Gluten (pan, fideos, avena)', /Seitán|Pan |Pan$|Fideos|Avena|Cuscús|Tortilla|Galletas de agua|Mote|Harina|Cereal|Granola|Pizza|Empanada|Sopaipilla/],
    frutos_secos: ['🌰 Frutos secos', /Almendras|Nueces/],
    mani: ['🥜 Maní', /Maní/],
    legumbres: ['🫘 Legumbres', /Lentejas|Porotos|Garbanzos|Hummus|Arvejas/],
    soya: ['🌱 Soya / tofu', /Tofu|Tempeh|[Ss]oya|Edamame/],
  };
  // dietas: un toque marca varios grupos
  const DIETAS = { vegetariana: ['🥗 Vegetariana', ['pollo', 'carne', 'cerdo', 'pescado']], vegana: ['🌱 Vegana', ['pollo', 'carne', 'cerdo', 'pescado', 'huevo', 'lacteos']] };
  const dietaDe = ex => { const e = ex || []; return ['vegana', 'vegetariana'].find(k => DIETAS[k][1].every(x => e.includes(x))) || ''; };
  // alergias o alimentos escritos a mano: se guardan como 'x:texto' y excluyen todo alimento cuyo nombre lo contenga
  const nrm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const raiz = t => { const w = nrm(t); return w.length > 4 ? w.replace(/(es|s)$/, '') : w; };
  const xMatch = (n, t) => { const r = raiz(t); return r.length >= 3 && nrm(n).includes(r); };
  const coincide = t => [...new Set(BASE.filter(a => xMatch(a.n, t)).map(a => a.n.replace(' (escurrido)', '')))];
  const exLabel = k => String(k).startsWith('x:') ? '⚠️ ' + k.slice(2) : (EXCL[k] || [k])[0];
  const excluido = (n, ex) => (ex || []).some(k => String(k).startsWith('x:') ? xMatch(n, k.slice(2)) : EXCL[k] && EXCL[k][1].test(n));
  const DES_OK = { p: /Clara|Huevo|Yogur|cottage|Atún|whey|Quesillo|Pechuga de pavo|Proteína vegetal|Tofu|Tempeh/, c: /Pan|Avena|Galletas|Tortilla|Plátano|Manzana|Pera|Kiwi|Mandarina|Naranja/, g: /Almendras|Nueces|Maní|Mantequilla de maní|Palta|chía|Linaza/ };
  const COM_OK = { p: /Pechuga|Trutro|Carne molida|Vacuno|Lomo de cerdo|Merluza|Salmón|Atún|Jurel|Huevo|Clara|Tofu|Tempeh|Seitán|soya texturizada|Edamame/, c: /Arroz|Fideos|Quínoa|Papa|Camote|Choclo|Lentejas|Porotos|Garbanzos|Cuscús|Mote/, g: /Aceite de oliva|Palta|Aceitunas/ };
  // cambia los alimentos que no come por otros del mismo tipo que sí calcen con esa comida
  function limpiar(op, meta, comida, ex) { if (!(ex || []).length) return op;
    const fuerte = comida === 'almuerzo' || comida === 'cena';
    for (let vuelta = 0; vuelta < 8; vuelta++) { const i = op.items.findIndex(x => excluido(x.n, ex)); if (i < 0) break; const r = rolDe(op.items[i]);
      if (r === 'f') { op = quitar(op, i, meta); continue; }
      const ok = (fuerte ? COM_OK : DES_OK)[r]; let ls = CAT[r] ? alternativas(Object.assign({}, op.items[i], { r })).filter(x => !excluido(x.n, ex)) : []; const pref = ok ? ls.filter(x => ok.test(x.n)) : []; if (pref.length) ls = pref;
      if (!ls.length) { op = quitar(op, i, meta); continue; }
      const elegido = ls[Math.floor(Math.random() * ls.length)]; op = cambiar(op, i, elegido.n, elegido.e, meta); }
    return op; }
  /* ---------- día de descanso: ¾ de los carbohidratos ---------- */
  const DESC = 0.75;
  const metasDescanso = m => m && m.kcal ? { kcal: Math.round((m.kcal - m.carb * (1 - DESC) * 4) / 10) * 10, prot: m.prot, carb: Math.round(m.carb * DESC), gras: m.gras } : m;
  function opDescanso(op) { return { t: op.t, items: op.items.map(x => { if (rol(x) !== 'c') return x; const st = PASO(x.n); return Object.assign({}, x, { g: Math.max(st, Math.round(x.g * DESC / st) * st) }); }) }; }
  /* ---------- evolución entre los dos últimos InBody y sugerencia ---------- */
  // compara el InBody elegido (f, o el último) con el anterior a él
  function evolucion(inbody, obj, f) {
    const ls = (inbody || []).filter(x => x && Number(x.peso)).slice().sort((a, b) => String(a.f).localeCompare(String(b.f)));
    let ib = f ? ls.findIndex(y => y.f === f) : -1; if (ib < 0) ib = ls.length - 1; if (ib < 1) return null;
    const a = ls[ib - 1], b = ls[ib]; const n = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
    const dias = Math.max(1, Math.round((new Date(b.f) - new Date(a.f)) / 864e5)); const mes = 30 / dias;
    const gA = n(a.mgc) ?? (n(a.pgc) != null ? a.peso * a.pgc / 100 : null), gB = n(b.mgc) ?? (n(b.pgc) != null ? b.peso * b.pgc / 100 : null);
    const d = { dias, peso: b.peso - a.peso, grasa: gA != null && gB != null ? gB - gA : null, musc: n(a.mme) != null && n(b.mme) != null ? b.mme - a.mme : null };
    const gm = d.grasa != null ? d.grasa * mes : null, mm = d.musc != null ? d.musc * mes : null; let dk = 0, txt = '';
    if (obj === 'bajar') { if (gm == null) txt = 'Falta % de grasa para evaluar.'; else if (gm > -0.5) { dk = -150; txt = 'La grasa casi no bajó: resta ~150 kcal.'; } else if (mm != null && mm < -0.5) { dk = 100; txt = 'Bajó grasa pero también músculo: suma ~100 kcal y mantén la proteína alta.'; } else if (gm < -2.5) { dk = 100; txt = 'Baja muy rápido: suma ~100 kcal para cuidar el músculo.'; } else txt = 'Va bien: mantén la pauta.'; }
    else if (obj === 'subir') { if (mm == null) txt = 'Falta músculo esquelético para evaluar.'; else if (mm < 0.25) { dk = 150; txt = 'El músculo casi no subió: suma ~150 kcal.'; } else if (gm != null && gm > 1) { dk = -100; txt = 'Sube mucha grasa: resta ~100 kcal.'; } else txt = 'Va bien: mantén la pauta.'; }
    else if (obj === 'recomp') { if (gm == null) txt = 'Falta % de grasa para evaluar.'; else if (gm > 0.3 && (mm == null || mm < 0.2)) { dk = -100; txt = 'Sube grasa sin subir músculo: resta ~100 kcal.'; } else if (mm != null && mm < -0.3) { dk = 100; txt = 'Está perdiendo músculo: suma ~100 kcal.'; } else txt = 'Va bien: mantén la pauta.'; }
    else { if (Math.abs(d.peso * mes) > 1) { dk = d.peso > 0 ? -100 : 100; txt = d.peso > 0 ? 'Está subiendo de peso: resta ~100 kcal.' : 'Está bajando de peso: suma ~100 kcal.'; } else txt = 'Peso estable: mantén la pauta.'; }
    return Object.assign(d, { desde: a.f, hasta: b.f, dk, txt }); }
  /* ---------- PDF (HTML negro listo para imprimir / guardar como PDF) ---------- */
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = x => r(x).toLocaleString('es-CL');
  const MK = '<svg viewBox="123 138 394 461" style="width:46px;height:auto"><path fill="#ea203a" fill-rule="evenodd" d="M480,198 393,198 393,534 512,431 512,323 478,352 478,415 431,456 427,457 427,233 453,232 478,288 478,308 512,279ZM160,198 123,285 213,363 213,456 210,457 162,415 162,352 128,323 128,431 247,534 247,342 165,271 183,232 212,232 213,279 247,308 247,198Z"/><path fill="#cbcbcb" fill-rule="evenodd" d="M516,138 333,138 333,539 320,554 307,539 307,138 124,138 160,172 273,173 273,557 320,598 367,557 367,173 479,172Z"/></svg>';
  function pdfHTML(pauta, metas, per) {
    const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const fd = s => { const [y, m, d] = String(s).split('-').map(Number); return d + ' de ' + MES[m - 1] + ' de ' + y; };
    const datos = [['Nombre', per.nombre], ['Fecha', fd(pauta.fecha)], ['Edad', per.edad ? per.edad + ' años' : ''], ['Estatura', per.estatura ? per.estatura + ' cm' : ''],
      ['Peso', per.peso ? String(per.peso).replace('.', ',') + ' kg' : ''], ['% Grasa', per.pgc != null ? String(per.pgc).replace('.', ',') + ' %' : ''], ['Masa muscular', per.mme ? String(per.mme).replace('.', ',') + ' kg' : ''],
      ['Objetivo', (OBJ[metas.obj] || {}).l || '']].filter(x => x[1]);
    const cel = op => { const t = suma(op.items); return `<td>${op.t ? `<div class="pl">${esc(op.t)}</div>` : ''}<ul>${op.items.map(it => `<li><b>${nf(it.g)} g</b> ${esc(nombre(it.n, it.e))}${medida(it.n, it.e, it.g) ? ` <span>(${esc(medida(it.n, it.e, it.g))})</span>` : ''}</li>`).join('')}</ul><div class="tt">${nf(t.kcal)} kcal · P ${nf(t.prot)} · C ${nf(t.carb)} · G ${nf(t.gras)}</div></td>`; };
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Pauta nutricional · ${esc(per.nombre)}</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet">
<style>@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{background:#0e0c0f;color:#f2eef0;margin:0;font:13px/1.4 Barlow,system-ui,sans-serif}
.pg{max-width:900px;min-width:860px;margin:0 auto;padding:22px}@media print{.pg{min-width:0}}.hd{display:flex;align-items:center;gap:14px;border-bottom:2px solid #d71f30;padding-bottom:12px;margin-bottom:14px}
h1{font:800 30px/1 'Barlow Condensed',sans-serif;margin:0;letter-spacing:.02em;text-transform:uppercase}.sub{color:#a69ea3;font:600 12px 'Barlow Condensed',sans-serif;letter-spacing:.2em;text-transform:uppercase}
h2{font:700 15px 'Barlow Condensed',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#ff5a68;margin:16px 0 8px}
table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{border:1px solid #2f2a2e;padding:7px 9px;vertical-align:top;text-align:left}th{background:#1b181c;font:700 13px 'Barlow Condensed',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#cbcbcb}
.dt td{background:#161317}.dt td:nth-child(odd){color:#a69ea3;width:16%}.dt td:nth-child(even){font-weight:600}
.mt{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.mt div{background:#1b181c;border:1px solid #2f2a2e;border-radius:10px;padding:10px;text-align:center}.mt b{display:block;font:800 26px/1 'Barlow Condensed',sans-serif}.mt span{color:#a69ea3;font-size:12px}
.ml{display:flex;flex-wrap:wrap;gap:2px 12px;justify-content:space-between;align-items:baseline;margin:16px 0 6px}.ml h2{margin:0}.ml span{color:#a69ea3;font-size:12px}
ul{margin:0;padding:0;list-style:none}li{padding:2px 0}li span{color:#a69ea3}.tt{margin-top:6px;padding-top:5px;border-top:1px dashed #2f2a2e;color:#a69ea3;font-size:11.5px}
.pl{font:700 14px 'Barlow Condensed',sans-serif;letter-spacing:.03em;color:#f2eef0;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #d71f30}.ft{margin-top:18px;color:#6d656a;font-size:11px;text-align:center}.blk{break-inside:avoid}
@media print{.pg{max-width:none;padding:9mm 9mm 6mm}.blk{padding-top:7mm}.blk .ml{margin-top:0}.noprint{display:none}}
.noprint{position:fixed;right:16px;bottom:16px;background:#d71f30;color:#fff;border:0;border-radius:12px;padding:14px 20px;font:700 16px Barlow,sans-serif;cursor:pointer}</style></head>
<body><div class="pg"><div class="hd">${MK}<div><div class="sub">Titanium Sport Center</div><h1>Pauta nutricional</h1></div></div>
<h2>Datos personales</h2><table class="dt">${datos.reduce((rows, d, i) => { if (i % 2 === 0) rows.push([]); rows[rows.length - 1].push(d); return rows; }, []).map(row => `<tr>${row.map(([l, v]) => `<td>${esc(l)}</td><td>${esc(v)}</td>`).join('')}${row.length < 2 ? '<td></td><td></td>' : ''}</tr>`).join('')}</table>
<h2>Metas diarias</h2><div class="mt"><div><b>${nf(metas.kcal)}</b><span>kcal</span></div><div><b style="color:#ff5a68">${nf(metas.prot)} g</b><span>Proteína</span></div><div><b style="color:#f3b45b">${nf(metas.carb)} g</b><span>Carbohidratos</span></div><div><b style="color:#7cc0ff">${nf(metas.gras)} g</b><span>Grasas</span></div></div>
${pauta.comidas.map(c => `<div class="blk"><div class="ml"><h2>${esc(c.l)}</h2><span>≈ ${nf(c.meta.kcal)} kcal · P ${nf(c.meta.prot)} · C ${nf(c.meta.carb)} · G ${nf(c.meta.gras)} — elige 1 opción</span></div>
<table><tr><th>Opción 1</th><th>Opción 2</th><th>Opción 3</th></tr><tr>${c.ops.map(cel).join('')}</tr></table></div>`).join('')}
<div class="ft" style="color:#a69ea3;font-size:12px">😴 Días de descanso: come ¾ de la porción de carbohidratos (arroz, papa, pan, avena, fruta) ≈ ${nf(metasDescanso(metas).kcal)} kcal · C ${nf(metasDescanso(metas).carb)} g.${per.excluir && per.excluir.length ? ' · No incluye: ' + esc(per.excluir.map(k => exLabel(k).replace(/^\S+\s/, '')).join(', ')) + '.' : ''}</div>
<div class="ft">Pesos en gramos según se indica (cocido o crudo). Verduras libres. Agua 2–3 litros al día. · Titanium Sport Center · ${esc(per.coach || 'Franco Palavecino')}</div></div>
<button class="noprint" onclick="window.print()">Guardar PDF / Imprimir</button></body></html>`;
  }

  // muestra la pauta dentro de la app (sin abrir otra ventana): así siempre se puede volver
  function verPDF(html) {
    document.getElementById('tl-pdfv')?.remove();
    const v = document.createElement('div'); v.id = 'tl-pdfv';
    v.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0e0c0f;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top)';
    v.innerHTML = '<div style="display:flex;gap:8px;padding:10px 12px;border-bottom:1px solid #2f2a2e;align-items:center"><button data-pv="x" style="height:44px;padding:0 16px;border-radius:12px;border:1px solid #2f2a2e;background:#1b181c;color:#f2eef0;font:600 16px Barlow,sans-serif">‹ Volver</button><span style="flex:1"></span><button data-pv="p" style="height:44px;padding:0 16px;border-radius:12px;border:0;background:#d71f30;color:#fff;font:700 16px Barlow,sans-serif">Guardar PDF / Compartir</button></div><iframe title="Pauta nutricional" style="flex:1;border:0;width:100%;background:#0e0c0f"></iframe>';
    document.body.appendChild(v); const fr = v.querySelector('iframe'); fr.srcdoc = html.replace('<button class="noprint" onclick="window.print()">Guardar PDF / Imprimir</button>', '');
    // en el celular se ve como la hoja completa (achicada), igual que el PDF
    const zoom = z => { try { const b = fr.contentDocument.body; b.style.zoom = z; } catch (_) {} };
    const ajustar = () => zoom(Math.min(1, (fr.clientWidth - 4) / 900));
    fr.addEventListener('load', ajustar); addEventListener('resize', ajustar);
    v.addEventListener('click', e => { const b = e.target.closest('[data-pv]'); if (!b) return; if (b.dataset.pv === 'x') { removeEventListener('resize', ajustar); v.remove(); document.getElementById('tl-print')?.remove(); document.getElementById('tl-print-css')?.remove(); return; }
      imprimir(html); });
  }
  // imprime desde la página principal (en iPhone/iPad imprimir un iframe saca la pantalla de la app, no la pauta)
  function imprimir(html) {
    document.getElementById('tl-print')?.remove(); document.getElementById('tl-print-css')?.remove();
    const d = new DOMParser().parseFromString(html, 'text/html'); d.querySelector('.noprint')?.remove();
    const css = (d.querySelector('style')?.textContent || '').replace('html,body{', ':host{display:block;');
    const host = document.createElement('div'); host.id = 'tl-print'; document.body.appendChild(host);
    host.attachShadow({ mode: 'open' }).innerHTML = '<style>' + css + '</style>' + d.body.innerHTML;
    const st = document.createElement('style'); st.id = 'tl-print-css';
    st.textContent = '#tl-print{display:none}@media print{@page{size:A4;margin:0}html,body{background:#0e0c0f!important;margin:0!important;padding:0!important;zoom:1!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}body>*:not(#tl-print){display:none!important}#tl-print{display:block!important}}';
    document.head.appendChild(st); setTimeout(() => window.print(), 60); } // queda oculto en pantalla; se borra al cerrar la vista
  window.TL_NUTRI = { verPDF, imprimir, EXCL, DIETAS, dietaDe, coincide, exLabel, excluido, limpiar, metasDescanso, opDescanso, evolucion, OBJ, ACT, COMIDAS, CAT_L, datos, basal, calcMetas, generar, suma, medida, nombre, food, pdfHTML, factor, rol, rolDe, alternativas, cambiar, quitar, variar };
})();
