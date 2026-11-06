/* Titanium · lector de informes InBody / BodyGo.
   Lee una foto o pantallazo con OCR (Tesseract, gratis, corre en el celular) y extrae
   los datos principales. Los valores se muestran para confirmar antes de guardar. */
(function () {
  const CAMPOS = [
    // clave, etiqueta visible, unidad, [sinónimos], [mín, máx], decimales, mejor ('sube' | 'baja' | null)
    ['peso', 'Peso', 'kg', ['peso corporal', 'peso', 'weight'], [25, 250], 1, null],
    ['pgc', '% Grasa', '%', ['porcentaje de grasa corporal', 'porcentaje de grasa', 'pgc', 'percent body fat', 'pbf', 'grasa corporal %', 'grasa corporal'], [3, 70], 1, 'baja'],
    ['mme', 'Masa muscular', 'kg', ['masa muscular esqueletica', 'musculo esqueletico', 'skeletal muscle mass', 'smm', 'masa muscular'], [8, 90], 1, 'sube'],
    ['visceral', 'Grasa visceral', 'nivel', ['nivel de grasa visceral', 'grasa visceral', 'visceral fat level', 'visceral'], [1, 30], 0, 'baja'],
    ['imc', 'IMC', '', ['indice de masa corporal', 'imc', 'bmi'], [12, 60], 1, null],
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
    imc: { que: 'Relación entre tu peso y tu estatura. Sirve como referencia general, pero no distingue músculo de grasa: con mucho músculo puede salir alto.',
      zona: () => Z(15, 40, [[18.5, 'Bajo', 'warn'], [25, 'Normal', 'ok'], [30, 'Sobrepeso', 'mid'], [99, 'Obesidad', 'warn']]) },
  };
  window.TL_INBODY_CAMPOS = CAMPOS;

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[|]/g, ' ').replace(/[ \t]+/g, ' ');
  const num = s => Number(String(s).replace(',', '.'));

  function extraer(texto) {
    const t = norm(texto); const out = {}; const colas = {};
    for (const [k, , , syn, [mn, mx]] of CAMPOS) {
      for (const label of syn) {
        let from = 0, found = null;
        while (!found) {
          const i = t.indexOf(label, from); if (i < 0) break;
          const tail = t.slice(i + label.length, i + label.length + 60);
          const nums = [...tail.matchAll(/(\d{1,4}(?:[.,]\d{1,2})?)/g)].map(m => num(m[1]));
          const v = nums.find(n => n >= mn && n <= mx);
          if (v != null) { found = v; colas[k] = nums; } else from = i + label.length;
        }
        if (found != null) { out[k] = found; break; }
      }
    }
    // BodyGo/InBody: la fila «Grasa corporal» trae primero los kg y después el %. Si el valor leído
    // coincide con kg (≈ % × peso), se usa el número de la misma fila que corresponde al porcentaje.
    if (out.peso && out.pgc && colas.pgc) { const pct = out.pgc / out.peso * 100;
      const alt = colas.pgc.find(n => n !== out.pgc && Math.abs(n - pct) <= 0.6);
      if (alt != null) { out.mgc = out.pgc; out.pgc = alt; } }
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
  window.tlInbodyLeer = async function (file, onProgress) {
    const T = await cargarTesseract(); const canvas = await preparar(file);
    const r = await T.recognize(canvas, 'spa+eng', { logger: m => { if (onProgress && m.status === 'recognizing text') onProgress(Math.round((m.progress || 0) * 100)); } });
    const texto = r?.data?.text || '';
    return { vals: extraer(texto), texto };
  };
  window.tlInbodyExtraer = extraer;
})();
