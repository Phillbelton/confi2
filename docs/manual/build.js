/**
 * Ensambla el manual de la plataforma Quelita (.docx).
 * Correr:  node docs/manual/build.js
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, ImageRun,
  Header, Footer, PageNumber, TableOfContents, LevelFormat, convertInchesToTwip,
} = require('docx');
const { C, SIN_BORDES, NONE } = require('./lib');

const contenidoA = require('./contenido-a');
const contenidoB = require('./contenido-b');
const contenidoC = require('./contenido-c');

const RAIZ = path.join(__dirname, '..', '..');
const LOGO = path.join(RAIZ, 'frontend', 'public', 'brand', 'logo.png');

/* ─────────────────────────── PORTADA ─────────────────────────── */
function portada() {
  const hijos = [];

  // Banda superior de marca
  hijos.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    borders: SIN_BORDES,
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 9360, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: C.turquesa },
        margins: { top: 60, bottom: 60, left: 0, right: 0 },
        children: [new Paragraph({ children: [] })],
      })],
    })],
  }));

  hijos.push(new Paragraph({ spacing: { after: 900 }, children: [] }));

  if (fs.existsSync(LOGO)) {
    hijos.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
      children: [new ImageRun({
        type: 'png',
        data: fs.readFileSync(LOGO),
        transformation: { width: 210, height: 137 },
      })],
    }));
  }

  hijos.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({
      text: 'CONFITERÍA QUELITA', bold: true, size: 26, color: C.petroleo, characterSpacing: 160,
    })],
  }));

  hijos.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: 'Manual de la', size: 40, color: C.tinta })],
  }));
  hijos.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
    children: [new TextRun({ text: 'plataforma', bold: true, size: 64, color: C.tinta })],
  }));

  // Regla candy
  hijos.push(new Table({
    width: { size: 2600, type: WidthType.DXA },
    columnWidths: [866, 867, 867],
    alignment: AlignmentType.CENTER,
    borders: SIN_BORDES,
    rows: [new TableRow({
      children: [C.turquesa, C.magenta, 'F5A623'].map((color) => new TableCell({
        width: { size: 866, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: color },
        margins: { top: 40, bottom: 40 },
        children: [new Paragraph({ children: [] })],
      })),
    })],
  }));

  hijos.push(new Paragraph({ spacing: { after: 400 }, children: [] }));
  hijos.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({
      text: 'Guía completa de la tienda, el panel de administración',
      size: 23, color: C.gris,
    })],
  }));
  hijos.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 1600 },
    children: [new TextRun({ text: 'y el servidor donde funciona', size: 23, color: C.gris })],
  }));

  const hoy = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
  hijos.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: hoy, size: 20, color: C.grisClaro, characterSpacing: 30 })],
  }));

  hijos.push(new Paragraph({ children: [new PageBreak()] }));
  return hijos;
}

/* ─────────────────────────── ÍNDICE ─────────────────────────── */
function indice() {
  return [
    new Paragraph({
      spacing: { before: 200, after: 40 },
      children: [new TextRun({ text: 'CONTENIDO', bold: true, size: 22, color: C.turquesa, characterSpacing: 100 })],
    }),
    new Paragraph({
      spacing: { after: 260 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: C.turquesa, space: 8 } },
      children: [new TextRun({ text: 'Índice', bold: true, size: 44, color: C.tinta })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({
        text: 'Para actualizar los números de página: clic derecho sobre el índice y “Actualizar campos”.',
        italics: true, size: 18, color: C.grisClaro,
      })],
    }),
    new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-2' }),
  ];
}

/* ─────────────────────────── DOCUMENTO ─────────────────────────── */
const cuerpo = [
  ...portada(),
  ...indice(),
  ...contenidoA(),
  ...contenidoB(),
  ...contenidoC(),
];

const doc = new Document({
  creator: 'Confitería Quelita',
  title: 'Manual de la plataforma — Confitería Quelita',
  description: 'Guía completa de la tienda, el panel de administración y el hosteo con Docker.',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 21, color: '1A2E38' } },
      heading1: { run: { font: 'Calibri', bold: true, color: C.tinta }, paragraph: { spacing: { before: 360, after: 140 } } },
      heading2: { run: { font: 'Calibri', bold: true, color: C.petroleo }, paragraph: { spacing: { before: 260, after: 100 } } },
      heading3: { run: { font: 'Calibri', bold: true, color: C.tinta }, paragraph: { spacing: { before: 200, after: 80 } } },
    },
  },
  numbering: {
    config: [
      {
        reference: 'vinetas',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertInchesToTwip(0.28), hanging: convertInchesToTwip(0.18) } },
                   run: { color: C.turquesa, bold: true } },
        }],
      },
      {
        reference: 'pasos',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertInchesToTwip(0.32), hanging: convertInchesToTwip(0.22) } },
                   run: { color: C.turquesa, bold: true } },
        }],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1200, right: 1440, bottom: 1200, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DCE6EA', space: 6 } },
          children: [new TextRun({
            text: 'Confitería Quelita · Manual de la plataforma',
            size: 16, color: C.grisClaro, characterSpacing: 20,
          })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.grisClaro })],
        })],
      }),
    },
    children: cuerpo,
  }],
});

const salida = path.join(RAIZ, 'docs', 'Manual-Quelita.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(salida, buf);
  console.log('✅ Generado:', salida, '·', (buf.length / 1024).toFixed(0), 'KB');
});
