/* Titanium · lector de informes InBody / BodyGo.
   Lee una foto o pantallazo con OCR (Tesseract, gratis, corre en el celular) y extrae
   los datos principales. Los valores se muestran para confirmar antes de guardar. */
(function () {
  const CAMPOS = [
    // clave, etiqueta visible, unidad, [sinónimos], [mín, máx], decimales, mejor ('sube' | 'baja' | null)
    ['peso', 'Peso', 'kg', ['peso corporal', 'peso', 'weight'], [25, 250], 1, null],
    ['pgc', '% Grasa', '%', ['porcentaje de grasa corporal', 'porcentaje de grasa', 'pgc', 'percent body fat', 'pbf', 'grasa corporal %', 'grasa corporal'], [3, 70], 1, 'baja'],
    ['mme', 'Masa muscular', 'kg', ['masa muscular esqueletica', 'musculo esqueletico', 'skeletal muscle mass', 'smm', 'masa muscular'], [8, 90], 1, 'sube'],
    ['mgc', 'Masa grasa', 'kg', ['masa de grasa corporal', 'masa grasa corporal', 'masa grasa', 'body fat mass'], [1, 150], 1, 'baja'],
    ['imc', 'IMC', '', ['indice de masa corporal', 'imc', 'bmi'], [12, 60], 1, null],
    ['visceral', 'Grasa visceral', 'nivel', ['nivel de grasa visceral', 'grasa visceral', 'visceral fat level', 'visceral'], [1, 30], 0, 'baja'],
    ['tmb', 'Metabolismo basal', 'kcal', ['tasa metabolica basal', 'metabolismo basal', 'basal metabolic rate', 'tmb', 'bmr'], [700, 4500], 0, null],
    ['agua', 'Agua corporal', 'L', ['agua corporal total', 'agua corporal', 'total body water', 'agua'], [12, 90], 1, null],
    ['edadMet', 'Edad metabólica', 'años', ['edad metabolica', 'metabolic age'], [10, 99], 0, 'baja'],
    ['score', 'Puntaje InBody', 'pts', ['puntuacion inbody', 'puntaje inbody', 'inbody score', 'puntuacion'], [30, 120], 0, 'sube'],
  ];
  window.TL_INBODY_CAMPOS = CAMPOS;

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[|]/g, ' ').replace(/[ \t]+/g, ' ');
  const num = s => Number(String(s).replace(',', '.'));

  function extraer(texto) {
    const t = norm(texto); const out = {};
    for (const [k, , , syn, [mn, mx]] of CAMPOS) {
      for (const label of syn) {
        let from = 0, found = null;
        while (!found) {
          const i = t.indexOf(label, from); if (i < 0) break;
          const tail = t.slice(i + label.length, i + label.length + 60);
          const nums = [...tail.matchAll(/(\d{1,4}(?:[.,]\d{1,2})?)/g)].map(m => num(m[1]));
          const v = nums.find(n => n >= mn && n <= mx);
          if (v != null) found = v; else from = i + label.length;
        }
        if (found != null) { out[k] = found; break; }
      }
    }
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
