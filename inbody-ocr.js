/* Titanium · lector de informes InBody / BodyGo.
   Lee una foto o pantallazo con OCR (Tesseract, gratis, corre en el celular) y extrae
   los datos principales. Los valores se muestran para confirmar antes de guardar. */
(function () {
  const CAMPOS = [
    // clave, etiqueta visible, unidad, [sinónimos], [mín, máx], decimales, mejor ('sube' | 'baja' | null), 'calc' = se calcula (no se escribe)
    ['peso', 'Peso', 'kg', ['peso corporal', 'peso', 'weight'], [25, 250], 1, null],
    ['pgc', '% Grasa', '%', ['porcentaje de grasa corporal', 'porcentaje de grasa', 'pgc', 'percent body fat', 'pbf', 'grasa corporal %', 'grasa corporal'], [3, 70], 1, 'baja'],
    ['mgc', 'Masa grasa', 'kg', [], [1, 200], 1, 'baja', 'calc'],
    ['mlg', 'Masa libre de grasa', 'kg', ['masa libre de grasa', 'peso corporal sin grasa', 'peso sin grasa', 'masa magra', 'fat free mass', 'ffm', 'lean body mass'], [15, 160], 1, 'sube'],
    ['mme', 'Músculo esquelético', 'kg', ['masa muscular esqueletica', 'musculo esqueletico', 'skeletal muscle mass', 'smm', 'masa muscular'], [8, 90], 1, 'sube'],
    ['pmm', '% Músculo', '%', [], [5, 80], 1, 'sube', 'calc'],
    ['visceral', 'Grasa visceral', 'nivel', ['nivel de grasa visceral', 'grasa visceral', 'visceral fat level', 'visceral'], [1, 30], 0, 'baja'],
    ['tmb', 'Metabolismo basal', 'kcal', ['tasa metabolica basal', 'metabolismo basal', 'basal metabolic rate', 'bmr', 'tmb'], [800, 4500], 0, null],
    ['cintura', 'Cintura', 'cm', ['perimetro de cintura', 'circunferencia de cintura', 'cintura', 'waist circumference'], [50, 200], 1, 'baja'],
  ];
  /* Explicación y zonas de referencia (ACE para % grasa, OMS para IMC, InBody para visceral). */
  const Z = (lo, hi, zonas) => ({ lo, hi, zonas }); // zonas: [hasta, etiqueta, tono]
  window.TL_INBODY_INFO = {
    peso: { que: 'Tu peso total. Míralo siempre junto al % de grasa y la masa muscular: puedes bajar grasa y subir músculo sin que la balanza cambie mucho.', zona: () => null },
    pgc: { que: 'Qué parte de tu peso es grasa. Es el mejor indicador de cómo va tu composición corporal.',
      zona: (v, sexo) => sexo === 'm' ? Z(8, 45, [[14, 'Muy bajo', 'warn'], [21, 'Atlético', 'ok'], [25, 'Fitness', 'ok'], [32, 'Aceptable', 'mid'], [99, 'Alto', 'warn']])
        : sexo === 'h' ? Z(3, 40, [[6, 'Muy bajo', 'warn'], [14, 'Atlético', 'ok'], [18, 'Fitness', 'ok'], [25, 'Aceptable', 'mid'], [99, 'Alto', 'warn']]) : null,
      tip: 'Baja con fuerza constante, buen descanso y una alimentación ordenada. Un ritmo sano es 0,5 a 1 punto por mes.' },
    mme: { que: 'El músculo que mueves al entrenar. Más músculo es más fuerza, mejor postura y un metabolismo más activo.', zona: () => null,
      tip: 'Sube con entrenamiento de fuerza progresivo y suficiente proteína. Ganar 0,5 kg al mes ya es un gran avance.' },
    visceral: { que: 'Grasa que rodea los órganos del abdomen. Es la más ligada a la salud (presión, azúcar, corazón), por eso bajarla es prioridad.',
      zona: () => Z(1, 20, [[9, 'Saludable', 'ok'], [14, 'Elevado', 'mid'], [99, 'Alto', 'warn']]),
      tip: 'Responde muy bien al ejercicio regular, dormir bien y reducir alcohol y azúcar.' },
    mgc: { que: 'Los kilos de grasa que tienes. Junto al músculo te dice si lo que bajas es grasa (bien) o músculo (mal).', zona: () => null,
      tip: 'La meta es que baje mes a mes mientras el músculo se mantiene o sube.' },
    pmm: { que: 'Qué parte de tu peso es músculo esquelético. Sube cuando ganas músculo o cuando bajas grasa: las dos cosas son avance.', zona: () => null },
    mlg: { que: 'Todo lo que no es grasa: músculo, huesos, órganos y agua. Con este dato se calcula tu metabolismo basal.', zona: () => null,
      tip: 'La meta es mantenerla o subirla mientras bajas grasa.' },
    tmb: { que: 'Las calorías que tu cuerpo gasta en reposo solo para funcionar. Es la base para calcular cuánto comer.', zona: () => null,
      tip: 'Más músculo = metabolismo basal más alto.' },
    cintura: { que: 'Perímetro de cintura medido con huincha a la altura del ombligo. Es el mejor reflejo de la grasa abdominal.',
      zona: (v, sexo) => sexo === 'm' ? Z(55, 120, [[80, 'Saludable', 'ok'], [88, 'Elevado', 'mid'], [999, 'Alto', 'warn']])
        : sexo === 'h' ? Z(65, 130, [[94, 'Saludable', 'ok'], [102, 'Elevado', 'mid'], [999, 'Alto', 'warn']]) : null,
      tip: 'Mídela siempre en el mismo punto, en ayunas y sin apretar la huincha.' },
  };
  window.TL_INBODY_CAMPOS = CAMPOS;
  // Datos que se calculan (no se leen ni se escriben): masa grasa = peso × % grasa, % músculo = músculo esquelético / peso.
  // El IMC ya no se usa: se quita de los informes antiguos al mostrarlos.
  window.TL_INBODY_DERIVAR = x => { if (!x) return x; const y = Object.assign({}, x); delete y.imc;
    if (y.peso && y.pgc && y.mgc == null) y.mgc = Math.round(y.peso * y.pgc) / 100;
    if (y.peso && y.mme) y.pmm = Math.round(y.mme / y.peso * 1000) / 10;
    if (y.peso && y.mlg == null && y.mgc != null && y.mgc < y.peso) y.mlg = Math.round((y.peso - y.mgc) * 10) / 10;
    return y; };

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[|]/g, ' ').replace(/[ \t]+/g, ' ');
  const num = s => Number(String(s).replace(',', '.'));

  // Etiquetas parecidas que NO son el dato (Fitdays: «Peso corporal sin grasa», «Peso objetivo», «Control de peso»…)
  const EXCLUIR = {
    peso: { despues: /^\s*(corporal\s+)?(sin grasa|libre de grasa|magr|objetivo|ideal|recomendado|actual\s*\/)/, antes: /(control de|proporcion de|objetivo|sin grasa)\s*$/ },
    pgc: { despues: /^\s*(\(kg\)|kg\b)/, antes: /(control de|masa de)\s*$/ },
    imc: { despues: /^\s*\(?\s*kg\s*\/\s*m/ },
  };
  // Una fila de números que sube con paso parejo es la escala de un gráfico (10 15 20 25…), no un dato.
  const esEscala = ns => { if (ns.length < 4) return false; const a = ns.slice(0, 5), d = a.slice(1).map((x, i) => x - a[i]);
    return d.every(x => x > 0) && Math.max(...d) <= Math.min(...d) * 2.5; };
  const fechaISO = t => { const m = t.match(/(?:prueba|fecha|test|date)[^0-9]{0,15}(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/) || t.match(/(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
    if (!m) return null; let [, a, b, c] = m; const [y, mo, d] = a.length === 4 ? [a, b, c] : [c, b, a];
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null; return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`; };

  function extraer(texto) {
    const t = norm(texto); const out = {}; const colas = {};
    for (const [k, , , syn, [mn, mx]] of CAMPOS) {
      for (const label of syn) {
        let from = 0, found = null;
        while (!found) {
          const i = t.indexOf(label, from); if (i < 0) break;
          const tail = t.slice(i + label.length, i + label.length + 60), ex = EXCLUIR[k];
          if (/[a-z]/.test(t[i + label.length] || '') || (i > 0 && /[a-z]/.test(t[i - 1])) ||
            (ex && ((ex.despues && ex.despues.test(tail)) || (ex.antes && ex.antes.test(t.slice(Math.max(0, i - 25), i)))))) { from = i + label.length; continue; }
          const nums = [...tail.matchAll(/(\d{1,4}(?:[.,]\d{1,2})?)/g)].map(m => num(m[1]));
          if (esEscala(nums)) { from = i + label.length; continue; }
          const v = nums.find(n => n >= mn && n <= mx);
          if (v != null) { found = v; colas[k] = nums; } else from = i + label.length;
        }
        if (found != null) { out[k] = found; break; }
      }
    }
    // Sin fila de peso: se reconstruye con «peso sin grasa» + kg de grasa de la misma fila del % (Fitdays).
    const ml = t.match(/(?:peso corporal sin grasa|peso sin grasa|masa libre de grasa|masa magra)\D{0,12}(\d{2,3}(?:[.,]\d)?)/);
    if (!out.peso && ml && colas.pgc) { const magra = num(ml[1]);
      for (const kg of colas.pgc) { const p = magra + kg, pct = kg / p * 100;
        if (p >= 25 && p <= 250 && colas.pgc.some(n => n !== kg && Math.abs(n - pct) <= 0.6)) { out.peso = Math.round(p * 10) / 10; break; } } }
    // BodyGo/InBody: la fila «Grasa corporal» trae primero los kg y después el %. Si el valor leído
    // coincide con kg (≈ % × peso), se usa el número de la misma fila que corresponde al porcentaje.
    if (out.peso && out.pgc && colas.pgc) { const pct = out.pgc / out.peso * 100;
      const alt = colas.pgc.find(n => n !== out.pgc && Math.abs(n - pct) <= 0.6);
      if (alt != null) { out.mgc = out.pgc; out.pgc = alt; } }
    // Fila «Grasa corporal  kg (rango)  %»: el par donde kg / peso ≈ % es el dato real, sin importar qué se leyó antes.
    if (out.peso) { let par = null;
      for (const ln of t.split('\n')) { if (!/grasa corporal|body fat mass/.test(ln) || /tasa|control|visceral|subcut/.test(ln)) continue;
        const ns = [...ln.matchAll(/(\d{1,3}(?:[.,]\d{1,2})?)/g)].map(m => num(m[1]));
        for (const kg of ns) { const pc = ns.find(n => n !== kg && n >= 3 && n <= 70 && Math.abs(kg / out.peso * 100 - n) <= 0.6); if (pc != null) { par = [kg, pc]; break; } }
        if (par) break; }
      if (par) { out.mgc = par[0]; out.pgc = par[1]; } }
    // Control cruzado con «peso sin grasa / masa magra»: % grasa = (peso − magra) / peso. Si lo leído no calza
    // (p. ej. tomó un número de la escala de un gráfico), se usa el número de la fila que sí calza o el cálculo.
    if (out.peso && ml) { const magra = num(ml[1]);
      if (magra > 0 && magra < out.peso) { const pct = (out.peso - magra) / out.peso * 100;
        if (out.pgc == null || Math.abs(out.pgc - pct) > 1.5) { const alt = (colas.pgc || []).find(n => Math.abs(n - pct) <= 0.8);
          out.pgc = alt != null ? alt : Math.round(pct * 10) / 10; delete out.mgc; } } }
    if (!out.mlg && ml) { const magra = num(ml[1]); if (magra >= 15 && magra <= 160 && (!out.peso || magra < out.peso)) out.mlg = magra; }
    const f = fechaISO(t); if (f) out.fecha = f;
    // coherencia: si hay peso y % grasa pero no masa grasa, se calcula
    if (out.peso && out.pgc && !out.mgc) out.mgc = Math.round(out.peso * out.pgc) / 100;
    if (out.peso && out.mgc && !out.pgc) out.pgc = Math.round(out.mgc / out.peso * 1000) / 10;
    return out;
  }

  let tess = null;
  function cargarTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (tess) return tess;
    tess = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      s.onload = () => res(window.Tesseract); s.onerror = () => rej(new Error('No se pudo cargar el lector')); document.head.appendChild(s); });
    return tess;
  }
  function preparar(file) { // escala de grises y tamaño cómodo para el OCR
    return new Promise((res, rej) => { const u = URL.createObjectURL(file), img = new Image();
      img.onload = () => { const max = 2400, k = Math.min(2, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); const x = c.getContext('2d');
        x.filter = 'grayscale(1) contrast(1.25)'; x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c); };
      img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('img')); }; img.src = u; });
  }
  // PDF: primero intenta leer el texto (informes digitales); si no trae texto, se convierte la 1ª página a imagen.
  let pdfjs = null;
  function cargarPdfJs() { if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib); if (pdfjs) return pdfjs;
    pdfjs = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'; res(window.pdfjsLib); };
      s.onerror = () => rej(new Error('No se pudo cargar el lector de PDF')); document.head.appendChild(s); }); return pdfjs; }
  const esPdf = f => f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name || ''));
  async function abrirPdf(file) { const L = await cargarPdfJs(); return L.getDocument({ data: await file.arrayBuffer() }).promise; }
  async function textoPdf(doc) { let out = ''; for (let i = 1; i <= Math.min(doc.numPages, 3); i++) { const pg = await doc.getPage(i); const tc = await pg.getTextContent();
      let y = null; for (const it of tc.items) { const yy = Math.round(it.transform[5]); out += (y != null && Math.abs(yy - y) > 3 ? '\n' : ' ') + it.str; y = yy; } out += '\n'; } return out; }
  // 1ª página del PDF como imagen JPG (para guardarla como informe y, si hace falta, leerla con OCR)
  window.tlPdfAImagen = async function (file) { const doc = await abrirPdf(file); const pg = await doc.getPage(1); const vp0 = pg.getViewport({ scale: 1 });
    const vp = pg.getViewport({ scale: Math.min(3, 2000 / Math.max(vp0.width, vp0.height)) }); const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: x, viewport: vp }).promise;
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9)); return new File([blob], (file.name || 'inbody').replace(/\.pdf$/i, '') + '.jpg', { type: 'image/jpeg' }); };
  window.tlInbodyLeer = async function (file, onProgress) {
    if (esPdf(file)) { try { const doc = await abrirPdf(file); const tx = await textoPdf(doc); const v = extraer(tx); if (v.peso && (v.pgc || v.mlg || v.tmb)) return { vals: v, texto: tx }; } catch (_) {}
      file = await window.tlPdfAImagen(file); }
    const T = await cargarTesseract(); const canvas = await preparar(file);
    const r = await T.recognize(canvas, 'spa+eng', { logger: m => { if (onProgress && m.status === 'recognizing text') onProgress(Math.round((m.progress || 0) * 100)); } });
    const texto = r?.data?.text || '';
    return { vals: extraer(texto), texto };
  };
  window.tlInbodyExtraer = extraer;
})();
