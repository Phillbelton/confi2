/**
 * Misma API que lib.js pero emitiendo HTML, para imprimir el manual a PDF.
 * Los archivos de contenido no cambian: lib.js despacha a este módulo cuando
 * la variable de entorno MANUAL_RENDER vale 'html'.
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** **negrita** · __código__ · //cursiva// */
function inline(texto) {
  let t = esc(texto);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/__([^_]+)__/g, '<code>$1</code>');
  // Perezoso: la cursiva admite barras internas (ej. “c/u”).
  t = t.replace(/\/\/([^\n]+?)\/\//g, '<em>$1</em>');
  return t;
}

const C = {
  turquesa: '#0ABDC6', petroleo: '#1B6B8A', petroleoOsc: '#14556F', tinta: '#0F3D4F',
  magenta: '#D6006C', gris: '#5E6E77', grisClaro: '#8896A0',
};

let capN = 0;

function parte(numero, titulo, bajada) {
  return [`<section class="parte">
    <div class="parte-num">PARTE ${esc(numero)}</div>
    <h1 class="parte-tit">${esc(titulo)}</h1>
    ${bajada ? `<p class="parte-baj">${esc(bajada)}</p>` : ''}
  </section>`];
}

function cap(numero, titulo) {
  capN++;
  return `<h2 class="cap" id="cap-${numero}"><span class="cap-n">${esc(numero)}.</span> ${esc(titulo)}</h2>`;
}

const sub = (t) => `<h3 class="sub">${esc(t)}</h3>`;
const sub3 = (t) => `<h4 class="sub3">${esc(t)}</h4>`;
const p = (t) => `<p>${inline(t)}</p>`;
const vinetas = (items) => [`<ul>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`];
const pasos = (items) => [`<ol>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>`];
const aire = (alto = 160) => `<div style="height:${Math.round(alto / 20)}px"></div>`;

function caja(titulo, lineas, tipo = 'info') {
  return `<div class="caja caja-${tipo}">
    ${titulo ? `<div class="caja-tit">${esc(titulo)}</div>` : ''}
    ${lineas.map((l) => `<p>${inline(l)}</p>`).join('')}
  </div>`;
}

function tabla(encabezados, filas) {
  return `<table>
    <thead><tr>${encabezados.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead>
    <tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${String(c).split('¶').map(inline).join('<br>')}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

function consola(lineas, titulo) {
  return `<div class="consola">
    ${titulo ? `<div class="consola-tit">${esc(titulo)}</div>` : ''}
    <pre>${lineas.map((l) => (l.startsWith('#') ? `<span class="cmt">${esc(l)}</span>` : esc(l))).join('\n')}</pre>
  </div>`;
}

module.exports = { C, parte, cap, sub, sub3, p, vinetas, pasos, caja, tabla, aire, consola, inline };
