/* Despacho: en modo html, esta librería delega en lib-html.js. */
if (process.env.MANUAL_RENDER === 'html') { module.exports = require('./lib-html'); return; }
/**
 * Helpers de composición para el manual (docx-js).
 * Paleta de marca Quelita: turquesa, petróleo, magenta y crema.
 */
const {
  Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, PageBreak,
} = require('docx');

const C = {
  turquesa: '0ABDC6',
  petroleo: '1B6B8A',
  petroleoOsc: '14556F',
  tinta: '0F3D4F',
  magenta: 'D6006C',
  ambar: 'B4740A',
  verde: '12784A',
  gris: '5E6E77',
  grisClaro: '8896A0',
  crema: 'FFF8F1',
  cremaBorde: 'EFE3D7',
  celeste: 'EAF7F8',
  rosaSuave: 'FDEEF5',
  ambarSuave: 'FFF6E6',
  verdeSuave: 'EAF7F0',
  blanco: 'FFFFFF',
  lineaSuave: 'DCE6EA',
};

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const SIN_BORDES = { top: NONE, bottom: NONE, left: NONE, right: NONE };

/** Título de parte — abre página, número grande y regla inferior. */
function parte(numero, titulo, bajada) {
  const out = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { before: 1400, after: 0 },
      children: [
        new TextRun({ text: `PARTE ${numero}`, bold: true, size: 22, color: C.turquesa, characterSpacing: 60 }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 120, after: 160 },
      children: [new TextRun({ text: titulo, bold: true, size: 46, color: C.tinta })],
    }),
  ];
  if (bajada) {
    out.push(new Paragraph({
      spacing: { after: 200 },
      border: { top: { style: BorderStyle.SINGLE, size: 10, color: C.turquesa, space: 10 } },
      children: [new TextRun({ text: bajada, size: 22, color: C.gris, italics: true })],
    }));
  }
  return out;
}

/** Capítulo (H1 real para el índice). */
function cap(numero, titulo) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 420, after: 140 },
    keepNext: true,
    children: [
      new TextRun({ text: `${numero}. `, bold: true, size: 30, color: C.turquesa }),
      new TextRun({ text: titulo, bold: true, size: 30, color: C.tinta }),
    ],
  });
}

/** Subtítulo (H2). */
function sub(titulo) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    keepNext: true,
    children: [new TextRun({ text: titulo, bold: true, size: 24, color: C.petroleo })],
  });
}

/** Sub-subtítulo (H3). */
function sub3(titulo) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    keepNext: true,
    children: [new TextRun({ text: titulo, bold: true, size: 21, color: C.tinta })],
  });
}

/**
 * Párrafo con marcado ligero:
 *   **negrita**  ·  __código__  ·  //cursiva//
 */
function p(texto, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120, line: 300 },
    alignment: opts.align,
    children: runs(texto),
  });
}

function runs(texto) {
  const out = [];
  // La cursiva usa //…// y admite barras internas (ej. “c/u”): por eso el
  // cuantificador es perezoso en vez de una clase que excluya la barra.
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\/\/[^\n]+?\/\/)/g;
  let i = 0;
  let m;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > i) out.push(new TextRun({ text: texto.slice(i, m.index), size: 21, color: '1A2E38' }));
    const t = m[0];
    if (t.startsWith('**')) {
      out.push(new TextRun({ text: t.slice(2, -2), bold: true, size: 21, color: C.tinta }));
    } else if (t.startsWith('__')) {
      out.push(new TextRun({ text: t.slice(2, -2), font: 'Consolas', size: 19, color: C.petroleoOsc, shading: { type: ShadingType.CLEAR, fill: 'EEF4F6' } }));
    } else {
      out.push(new TextRun({ text: t.slice(2, -2), italics: true, size: 21, color: C.gris }));
    }
    i = m.index + t.length;
  }
  if (i < texto.length) out.push(new TextRun({ text: texto.slice(i), size: 21, color: '1A2E38' }));
  return out;
}

/** Lista con viñetas. */
function vinetas(items) {
  return items.map((t) => new Paragraph({
    numbering: { reference: 'vinetas', level: 0 },
    spacing: { after: 70, line: 290 },
    children: runs(t),
  }));
}

/** Lista numerada (pasos). */
function pasos(items) {
  return items.map((t) => new Paragraph({
    numbering: { reference: 'pasos', level: 0 },
    spacing: { after: 80, line: 290 },
    children: runs(t),
  }));
}

/** Recuadro destacado. tipo: info | ok | aviso | dato */
function caja(titulo, lineas, tipo = 'info') {
  const estilo = {
    info:  { fill: C.celeste,     barra: C.turquesa, tit: C.petroleoOsc },
    ok:    { fill: C.verdeSuave,  barra: '1FA463',   tit: C.verde },
    aviso: { fill: C.ambarSuave,  barra: 'E8912D',   tit: C.ambar },
    dato:  { fill: C.rosaSuave,   barra: C.magenta,  tit: C.magenta },
  }[tipo];

  const hijos = [];
  if (titulo) {
    hijos.push(new Paragraph({
      spacing: { after: lineas.length ? 70 : 0 },
      children: [new TextRun({ text: titulo, bold: true, size: 20, color: estilo.tit, characterSpacing: 20 })],
    }));
  }
  lineas.forEach((l, idx) => hijos.push(new Paragraph({
    spacing: { after: idx === lineas.length - 1 ? 0 : 70, line: 285 },
    children: runs(l),
  })));

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    borders: {
      top: NONE, bottom: NONE, right: NONE,
      left: { style: BorderStyle.SINGLE, size: 18, color: estilo.barra },
      insideHorizontal: NONE, insideVertical: NONE,
    },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 9360, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: estilo.fill },
        margins: { top: 180, bottom: 180, left: 240, right: 220 },
        children: hijos,
      })],
    })],
  });
}

/** Tabla de datos con encabezado de marca. */
function tabla(encabezados, filas, anchos) {
  const total = anchos.reduce((a, b) => a + b, 0);
  const cabecera = new TableRow({
    tableHeader: true,
    children: encabezados.map((h, i) => new TableCell({
      width: { size: anchos[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: C.petroleo },
      margins: { top: 110, bottom: 110, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 19, color: C.blanco })] })],
    })),
  });
  const cuerpo = filas.map((fila, r) => new TableRow({
    children: fila.map((celda, i) => new TableCell({
      width: { size: anchos[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: r % 2 ? C.blanco : 'F7FAFB' },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: String(celda).split('¶').map((linea, k) => new Paragraph({
        spacing: { after: 0, line: 275, before: k ? 40 : 0 },
        children: runs(linea),
      })),
    })),
  }));
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: anchos,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C.lineaSuave },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lineaSuave },
      left: NONE, right: NONE,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E8EFF2' },
      insideVertical: NONE,
    },
    rows: [cabecera, ...cuerpo],
  });
}

/** Espaciador vertical. */
function aire(alto = 160) {
  return new Paragraph({ spacing: { after: alto }, children: [] });
}

/** Bloque de comandos de terminal. */
function consola(lineas, titulo) {
  const hijos = [];
  if (titulo) {
    hijos.push(new Paragraph({
      spacing: { after: 90 },
      children: [new TextRun({ text: titulo, bold: true, size: 18, color: '9FD9DE', characterSpacing: 20 })],
    }));
  }
  lineas.forEach((l, i) => {
    const comentario = l.startsWith('#');
    hijos.push(new Paragraph({
      spacing: { after: i === lineas.length - 1 ? 0 : 50, line: 270 },
      children: [new TextRun({
        text: l,
        font: 'Consolas',
        size: 18,
        color: comentario ? '8FB6C2' : 'E8F6F8',
        italics: comentario,
      })],
    }));
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    borders: SIN_BORDES,
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 9360, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: '10323F' },
        margins: { top: 200, bottom: 200, left: 240, right: 200 },
        children: hijos,
      })],
    })],
  });
}

module.exports = { C, parte, cap, sub, sub3, p, vinetas, pasos, caja, tabla, aire, consola, runs, SIN_BORDES, NONE };
