/**
 * Genera el PDF del manual reusando EXACTAMENTE el mismo contenido del .docx:
 * lib.js despacha a lib-html.js cuando MANUAL_RENDER=html, así que los
 * archivos contenido-*.js no se duplican.
 *
 * Correr:  MANUAL_RENDER=html node docs/manual/build-pdf.js
 */
process.env.MANUAL_RENDER = 'html';

const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/sk/Downloads/confi2-b303ac1f5567c79d53453ea010b86ad89b494018/frontend/node_modules/@playwright/test');

const RAIZ = path.join(__dirname, '..', '..');
const LOGO = path.join(RAIZ, 'frontend', 'public', 'brand', 'logo.png');

const contenidoA = require('./contenido-a');
const contenidoB = require('./contenido-b');
const contenidoC = require('./contenido-c');

const cuerpo = [...contenidoA(), ...contenidoB(), ...contenidoC()].join('\n');

const logoData = fs.existsSync(LOGO)
  ? `data:image/png;base64,${fs.readFileSync(LOGO).toString('base64')}`
  : '';

const hoy = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Manual de la plataforma — Confitería Quelita</title>
<style>
  @page { size: Letter; margin: 20mm 18mm 18mm; }
  :root{
    --turquesa:#0ABDC6; --petroleo:#1B6B8A; --petroleo-osc:#14556F; --tinta:#0F3D4F;
    --magenta:#D6006C; --gris:#5E6E77; --gris-claro:#8896A0; --linea:#DCE6EA;
  }
  *{box-sizing:border-box}
  body{
    font-family:"Segoe UI",Calibri,system-ui,sans-serif;
    font-size:10.5pt; line-height:1.62; color:#1A2E38; margin:0;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }

  /* ── Portada ── */
  .portada{ page-break-after:always; text-align:center; padding-top:34mm; position:relative }
  .portada .banda{ position:absolute; top:-20mm; left:-18mm; right:-18mm; height:9mm; background:var(--turquesa) }
  .portada img{ width:56mm; margin:0 auto 12mm; display:block }
  .portada .marca{ font-size:11pt; font-weight:700; letter-spacing:.34em; color:var(--petroleo); margin-bottom:7mm }
  .portada .t1{ font-size:23pt; color:var(--tinta); line-height:1.15 }
  .portada .t2{ font-size:37pt; font-weight:800; color:var(--tinta); line-height:1.05; margin-bottom:9mm }
  .portada .regla{ width:46mm; height:2.6mm; margin:0 auto 11mm; display:flex }
  .portada .regla i{ flex:1 }
  .portada .baj{ font-size:11.5pt; color:var(--gris); line-height:1.7 }
  .portada .fecha{ margin-top:38mm; font-size:9.5pt; color:var(--gris-claro); letter-spacing:.13em }

  /* ── Índice ── */
  .indice{ page-break-after:always }
  .indice .kicker{ font-size:9.5pt; font-weight:700; letter-spacing:.24em; color:var(--turquesa) }
  .indice h1{ font-size:24pt; color:var(--tinta); margin:1mm 0 3mm; padding-bottom:3mm; border-bottom:2px solid var(--turquesa) }
  .indice ol{ list-style:none; padding:0; margin:0; column-count:2; column-gap:12mm }
  .indice li{ font-size:9.5pt; padding:1.15mm 0; color:var(--petroleo); break-inside:avoid }
  .indice li.p{ font-weight:800; color:var(--tinta); margin-top:4mm; font-size:10pt;
                border-bottom:1px solid var(--linea); padding-bottom:1.2mm }
  .indice li.p:first-child{ margin-top:0 }

  /* ── Aperturas de parte ── */
  .parte{ page-break-before:always; padding-top:26mm; margin-bottom:9mm }
  .parte-num{ font-size:10pt; font-weight:800; letter-spacing:.26em; color:var(--turquesa) }
  .parte-tit{ font-size:29pt; font-weight:800; color:var(--tinta); margin:2mm 0 3mm; line-height:1.1 }
  .parte-baj{ font-size:11.5pt; font-style:italic; color:var(--gris); border-top:2px solid var(--turquesa);
              padding-top:3mm; margin:0 }

  /* ── Jerarquía ── */
  h2.cap{ font-size:16.5pt; font-weight:800; color:var(--tinta); margin:9mm 0 3mm;
          break-after:avoid; page-break-after:avoid }
  h2.cap .cap-n{ color:var(--turquesa) }
  h3.sub{ font-size:12.5pt; font-weight:700; color:var(--petroleo); margin:6mm 0 2mm; break-after:avoid }
  h4.sub3{ font-size:11pt; font-weight:700; color:var(--tinta); margin:4.5mm 0 1.5mm; break-after:avoid }
  p{ margin:0 0 2.6mm }
  strong{ color:var(--tinta); font-weight:700 }
  em{ color:var(--gris) }
  code{ font-family:Consolas,"Courier New",monospace; font-size:9.3pt; background:#EEF4F6;
        color:var(--petroleo-osc); padding:.4mm 1.3mm; border-radius:1mm }

  ul,ol{ margin:0 0 3mm; padding-left:6mm }
  li{ margin-bottom:1.5mm }
  ul li::marker{ color:var(--turquesa) }
  ol li::marker{ color:var(--turquesa); font-weight:700 }

  /* ── Recuadros ── */
  .caja{ border-left:3.5pt solid; padding:3.4mm 4mm; margin:4mm 0; break-inside:avoid; border-radius:0 2mm 2mm 0 }
  .caja p{ margin:0 0 1.6mm } .caja p:last-child{ margin:0 }
  .caja-tit{ font-size:9pt; font-weight:800; letter-spacing:.09em; margin-bottom:1.8mm }
  .caja-info{ background:#EAF7F8; border-color:var(--turquesa) }
  .caja-info .caja-tit{ color:var(--petroleo-osc) }
  .caja-ok{ background:#EAF7F0; border-color:#1FA463 } .caja-ok .caja-tit{ color:#12784A }
  .caja-aviso{ background:#FFF6E6; border-color:#E8912D } .caja-aviso .caja-tit{ color:#B4740A }
  .caja-dato{ background:#FDEEF5; border-color:var(--magenta) } .caja-dato .caja-tit{ color:var(--magenta) }

  /* ── Tablas ── */
  table{ width:100%; border-collapse:collapse; margin:3mm 0 4mm; font-size:9.6pt; break-inside:avoid }
  thead{ display:table-header-group }
  th{ background:var(--petroleo); color:#fff; text-align:left; padding:2.1mm 2.6mm; font-size:9.2pt; font-weight:700 }
  td{ padding:2mm 2.6mm; border-bottom:.6pt solid #E8EFF2; vertical-align:top }
  tbody tr:nth-child(odd){ background:#F7FAFB }

  /* ── Consola ── */
  .consola{ background:#10323F; border-radius:2.5mm; padding:4mm 4.5mm; margin:3.5mm 0 4.5mm; break-inside:avoid }
  .consola-tit{ font-size:8.6pt; font-weight:700; color:#9FD9DE; letter-spacing:.1em; margin-bottom:2mm }
  .consola pre{ margin:0; font-family:Consolas,"Courier New",monospace; font-size:9pt;
                color:#E8F6F8; white-space:pre-wrap; line-height:1.66 }
  .consola .cmt{ color:#8FB6C2; font-style:italic }
</style></head><body>

<div class="portada">
  <div class="banda"></div>
  ${logoData ? `<img src="${logoData}" alt="Quelita">` : ''}
  <div class="marca">CONFITERÍA QUELITA</div>
  <div class="t1">Manual de la</div>
  <div class="t2">plataforma</div>
  <div class="regla"><i style="background:#0ABDC6"></i><i style="background:#D6006C"></i><i style="background:#F5A623"></i></div>
  <div class="baj">Guía completa de la tienda, el panel de administración<br>y el servidor donde funciona</div>
  <div class="fecha">${hoy}</div>
</div>

<div class="indice">
  <div class="kicker">CONTENIDO</div>
  <h1>Índice</h1>
  <ol id="toc"></ol>
</div>

${cuerpo}

<script>
  // Índice construido desde los títulos reales del documento.
  const toc = document.getElementById('toc');
  document.querySelectorAll('.parte, h2.cap').forEach((el) => {
    const li = document.createElement('li');
    if (el.classList.contains('parte')) {
      li.className = 'p';
      const n = el.querySelector('.parte-num').textContent.replace('PARTE ', '');
      li.textContent = n + ' · ' + el.querySelector('.parte-tit').textContent;
    } else {
      li.textContent = el.textContent.trim();
    }
    toc.appendChild(li);
  });
</script>
</body></html>`;

const htmlPath = path.join(__dirname, 'manual.html');
fs.writeFileSync(htmlPath, html, 'utf8');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const salida = path.join(RAIZ, 'docs', 'Manual-Quelita.pdf');
  await page.pdf({
    path: salida,
    format: 'Letter',
    printBackground: true,
    margin: { top: '20mm', right: '18mm', bottom: '18mm', left: '18mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:7pt;color:#8896A0;width:100%;padding:0 18mm;text-align:right;
      font-family:'Segoe UI',sans-serif;">Confitería Quelita · Manual de la plataforma</div>`,
    footerTemplate: `<div style="font-size:7.5pt;color:#8896A0;width:100%;padding:0 18mm;text-align:center;
      font-family:'Segoe UI',sans-serif;"><span class="pageNumber"></span></div>`,
  });
  await browser.close();

  const kb = (fs.statSync(salida).size / 1024).toFixed(0);
  console.log('✅ Generado:', salida, '·', kb, 'KB');
})();
