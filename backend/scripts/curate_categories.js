// Curate categories for quelita_catalogo_*.xlsx
// Maps Bicom-derived categories + product names into 7 user-defined root taxonomy.
const xlsx = require('xlsx');

const IN = process.argv[2];
const OUT = process.argv[3];
if (!IN || !OUT) {
  console.error('Usage: node curate_categories.js <input.xlsx> <output.xlsx>');
  process.exit(1);
}

const ROOTS = {
  CONFI: 'Confitería',
  CHOCO: 'Chocolatería',
  HELA: 'Heladería',
  BEB: 'Bebidas y líquidos',
  CUMPLE: 'Cumpleaños',
  REPO: 'Repostería',
  SNAGAL: 'Snacks y Galletas',
};

const up = s => String(s || '').toUpperCase();
const has = (name, ...kws) => { const n = up(name); return kws.some(k => n.includes(k)); };

// --- HELADERÍA detection: brands + small ML format + word "HELADO" + cassata brands
function isHelado(name) {
  if (has(name, 'HELADO', 'CASSATA', 'CASATA', 'FIORENTINA', 'CHOMP', 'CENTELLA', 'EGOCENTRICO',
    'CROCANTY', 'DISFRITI', 'KRIKO', 'XPLORI', 'ZOORPRESA', 'KITKAT 85', 'KITKAT GOLD',
    'SABORY BRICK', 'GUALLARAUCO CHEESE', 'PALETON', 'CHOCOLITO', 'PURA FRUTA',
    'DANKY', 'MEGA FRAMBUESA', 'MEGA SAHNE', 'MEGA ALMENDRA', 'MEGA COOKIES',
    'SANGURUCHO', 'COLA DE TIGRE', 'PALO LOCO', 'SUPER SONICO', 'SUPER TANKER',
    'TWINGO', 'CHARLOT', 'TRULULU 70', 'FINI 70')) return true;
  // CHARLOT 3 LECHES 1LT, etc.: 1LT pote
  return false;
}

function detectHeladeriaTier2(name) {
  if (has(name, 'CASSATA', 'CASATA', 'FIORENTINA', 'CASSATIN')) return 'Cassatas y tortas';
  if (has(name, 'TORTA HELADA', 'TRES LECHES')) return 'Cassatas y tortas';
  if (has(name, '1LT', '1 LT', 'BRICK', 'POTE')) return 'Pote';
  if (has(name, 'CONO ', 'BARQUILLO')) return 'Conos y barquillos';
  if (has(name, 'VASITO')) return 'Vasitos';
  return 'Palito e individual'; // default for helado
}

// --- CHICLES
function isChicle(name) {
  return has(name, 'BIGTIME', 'TUBO ROLLER', 'GUMMY ROLLER', 'CHICLE', 'AGRANDADO');
}

// --- CHOCOLATERÍA individual brands
function isChocoIndividual(name) {
  return has(name, 'BON O BON', 'ROCKLETS', 'CHOKITA', 'PRESTIGIO', 'CAPRI ', 'KIT KAT', 'SUPER 8',
    'RICOLATE', 'INKAT', 'CHOCMAN', 'HOBBY', 'NIKOLO', 'GOLPE', 'CHIR LITO', 'TUYO ', 'TIFANYS',
    'DOBLON', 'CHOCO CRUNCH MIX', 'TOP NUSS', 'VERONA', 'NUTTINO', 'PESETA MANJAR', 'PESETA FRESA',
    'PANCHITO', 'OBSESION', 'MONEDAS DE CHOCOLATE', 'CHOC.RELLENO', 'MAXIMUSS', 'BERBAU MIX',
    'MINI OBLEA BON O BON', 'CHOCMELOS', 'GOLAZO LECHE', 'TRES NEGRITO', 'BACHATA',
    'MANTECOL', 'PLUTONITA', 'LOLY CHOC', 'LA VACA LECHERA', 'MANICHOC', 'KILATE',
    'CALUGON', 'PEPA COCO', 'LOCO BAÑADO', 'NUTTY STAR', 'SAHNE NUSS', 'SANHE NUSS');
}

// --- BIZCOCHOS Y QUEQUES (snacks dulces empacados)
function isBizcocho(name) {
  return has(name, 'BIMBO CAKE', 'MANKEKE', 'GANSITO', 'BROWNIE', 'QUEQUE', 'TIGRETON',
    'DELI COOKIE', 'WAFER MINI FRUNA', 'PAN DE PASCUA', 'DELICIA FRAMBUESA', 'CEREALBAR',
    'WINERGY', 'TAFI COYAK', 'ARBOLITO', 'BASTON VIENA');
}

// --- GALLETAS DULCES
function isGalletaDulce(name) {
  return has(name, 'GALLETA ', 'OBLEA');
}

// --- MENTAS
function isMenta(name) {
  return has(name, 'ALKA ', 'ALKA2', 'KEGOL', 'MENTITA', 'MEDIA HORA', 'MENTA AMBROSOLI',
    'MENTA CHOCOLATE', 'FREEGELLS', 'BIGTIME MENTA');
}

// --- MARSHMALLOWS
function isMarsh(name) {
  return has(name, 'MARSHMELLOW', 'MARSHMALLOW', 'MARSH MORF', 'TOBOGAN MARSHMELLOW', 'MALVA',
    'MALLOW POP', 'MAGIC MALLOW', 'MC MALLOW');
}

// --- TURRONES Y MANTECOL
function isTurron(name) {
  return has(name, 'TURRON', 'MANTECOL');
}

// --- PIÑATAS / MIX cumpleañeros
function isPiñata(name) {
  return has(name, 'PIÑATA', 'BOLSON PIÑATERO', 'FIESTA MIX', 'CANDY MIX 900', 'CANDY SURTIDO 400');
}

// --- COTILLÓN candy toys
function isCotillon(name) {
  return has(name, 'CANDY SPRAY', 'CANDY COOLER', 'CANDY TIKTAKA', 'CANDY DINO', 'CANDY PATINETA',
    'CANDY FLIPPER', 'CANDY PEGALOCO', 'MABU SORPRESA', 'ROBOT LANZA', 'OJOS LOCOS', 'MANO CLAP',
    'BUSTERS', 'CANDY ROCKS', 'MINI PIZZA', 'MINI BURGER', 'MINI HOT DOG', 'PATITA XPLOT', 'EXPLOTA');
}

// --- CAFÉ
function isCafe(name) {
  return has(name, 'CAFÉ NESCAFE', 'NESCAFE', 'DOLCA');
}

// --- AVENA / CEREALES → Otros
function isCereal(name) {
  return has(name, 'AVENA QUAKER', 'AVENA TRADICIONAL', 'AVENA INSTANTANEA', 'CHOCO CRACS', 'CEREAL PILLOWS');
}

// --- CHUPETES extra
function isChupete(name) {
  return has(name, 'CHUPETE', 'CHUPETON', 'CHUPETÓN', 'BOMBA LOLLI', 'BON BON BUM', 'LANGUETAZO',
    'LOLLI', 'POPOTE', 'PICO DULCE', 'LOLY FRUTA', 'TIRA POP', 'PALO LOCO COLA', 'PALO LOCO FRUTILLA',
    'PALETA SANDIA', 'PALETA BOQUITA', 'PALETA CORAZON', 'PALETA ESCOBITA', 'PALETA TWISTER',
    'PALETA ', 'CHUPETÓNCITO');
}

// --- GOMITAS extra (Ambrosoli line)
function isGomita(name) {
  return has(name, 'GOMIT', 'GUMMY', 'JALEA', 'HUESITOS', 'JELLY', 'TRULULU', 'ARAÑAS',
    'MOGUL', 'FRUGELE', 'FRUTALES 800', 'CALAVERA', 'RATONCITO', 'PEELERZ', 'FLIPY',
    'LOOP ', 'LOOPS', 'AMBROSITO', 'AMBROSAURIO', 'AMBERRIE', 'AMBROSOLI', 'SANDIA 90GR',
    'SANDIA 20X25', 'FULL 24X27', 'SUNY CLASIC', 'GUSANO ACIDO', 'GUSANITO', 'GOMELA',
    'RELLENOS FRUTALES', 'FRUTALES 181', 'FRUTILLAS A LA CREMA', 'CHUBI', 'BOWLING',
    'ALMENDRA CONFITADA', 'GOMATON', 'BACHATA COCO', 'TOP NUSS', 'GAJO ',
    'DATE ', 'CHICOCO', 'KILOMBO', 'ASTERIX', 'BOBOLON', 'AGRANDADO', '303 24X14',
    'KRAPULITO', 'NARANJITAS BAÑADAS', 'ZUKO MANZANA', 'GUSANOS ACI', 'GUSANO ACI',
    'FRUTALES 396', 'FRUTALES 181', 'SANDIA MANGA');
}

// --- CARAMELOS / MASTICABLES
function isCaramelo(name) {
  return has(name, 'CALUGA', 'MASTIC', 'TOFFEE', 'CARAMELO', 'DUCREM', 'GUNYS ACID',
    'AMBROSELLA', 'LOKISSIMO SODA', 'SODA SOUR', 'LAGARTIJA', 'GUAGUITA', 'OBA OBA',
    'CUBANITO', 'TABLETON', 'BOCA LOCA', 'FRUTIYA', 'SANDIA YA', 'PLATANO YA',
    'SPLOT ACID', 'TORTAZO', 'RUN RUN', 'TURRON GALLETA', 'SUSTANCIA FRUNA',
    'CHIR LITO', 'MANGA CABRITAS', 'MANGA SUFLE', 'RELLENITO', 'DATE DATE',
    'CALUGON', 'LAGUITO');
}

// --- POPPING BOBA
function isBoba(name) {
  return has(name, 'POPPING BOBA', 'GUNYS POPPING');
}

// --- ÁCIDOS (Gunys / Fini ácidos / etc.)
function isAcido(name) {
  return has(name, 'GUNYS ACID', 'FINI TUBOS', 'GUMMY ROLLER SOUR', 'SODA SOUR');
}

// --- ARTESANAL Quelita
function isArtesanal(name) {
  return has(name, 'BANDEJA ', 'CUCHUFLI', 'TRUFA', 'TRUFON', 'EMPOLVADO', 'MIL HOJA',
    'VAINA', 'PALOMITO ', 'BASTONES DE NAVIDAD', 'SUSTANCIAS', 'MERENGUITO',
    'HELADO DE INVIERNO');
}

// --- OTROS no encaja (papel/limpieza/tabaco) — cuidado: 'HUEVO PAÑUELO' es chocolate Pascua
function isOtros(name) {
  if (has(name, 'HUEVO PAÑUELO')) return false; // override
  return has(name, 'PAÑUELO ELITE', 'ROLLO TERMICO', 'BOLSA TELA', 'PAN RALLADO', 'BRISTOL',
    'OCB ', 'ELEMENT PAPEL', 'BLUNT ', 'ENCENDEDOR', 'FRIEGA DE LA ABUELA', 'SABANAS LION',
    'BANDEJA DE CULTIVO', 'BANDEJA PORTADORA', 'TABACO');
}

// --- HUEVOS DE PASCUA
function isHuevoPascua(name) {
  return has(name, 'HUEVO PAÑUELO', 'HUEVITO', 'CONEJITO CHOCOLATE');
}

// =====================================================================

function curate(row) {
  const oldCat = String(row.categoria || '').trim();
  const name = row.nombre || '';
  const out = ans => ({ categoria: ans });

  // Hard overrides by product name regardless of old category
  if (isOtros(name)) return { categoria: 'Otros', activo: 'FALSE' };
  if (oldCat === 'Grow') return { categoria: 'Otros > Grow', activo: 'FALSE' };

  // 1) HELADOS — by name detection wins over old category
  if (isHelado(name)) {
    return out(`${ROOTS.HELA} > ${detectHeladeriaTier2(name)}`);
  }
  if (oldCat.startsWith('Heladería')) {
    // already heladería at any tier — preserve specifics
    if (oldCat === 'Heladería > Cassatas') return out(`${ROOTS.HELA} > Cassatas y tortas`);
    if (oldCat === 'Heladería > Cassatas > Crema chocolate') return out(`${ROOTS.HELA} > Cassatas y tortas > Crema chocolate`);
    if (oldCat === 'Heladería > Cassatas > Crema') return out(`${ROOTS.HELA} > Cassatas y tortas > Crema`);
    if (oldCat === 'Heladería > Palitos') return out(`${ROOTS.HELA} > Palito e individual`);
    if (oldCat === 'Heladería > Vasitos') return out(`${ROOTS.HELA} > Vasitos`);
    if (oldCat === 'Heladería > Conos') return out(`${ROOTS.HELA} > Conos y barquillos`);
    return out(`${ROOTS.HELA} > ${detectHeladeriaTier2(name)}`);
  }

  // 2) Bebidas by content name
  if (isCafe(name)) return out(`${ROOTS.BEB} > Café`);
  if (oldCat === 'Bebidas > Gaseosas' || has(name, 'CACHANTUN GASIFICADA', '7UP ZERO')) return out(`${ROOTS.BEB} > Gaseosas`);
  if (oldCat === 'Bebidas > Aguas' || has(name, 'CACHANTUN SIN GAS', 'AGUA STA MONICA', 'BIDON AGUA')) return out(`${ROOTS.BEB} > Aguas`);
  if (oldCat === 'Bebidas > Aguas saborizadas') return out(`${ROOTS.BEB} > Aguas saborizadas`);
  if (oldCat === 'Bebidas > Jugos' || has(name, 'GUALLARAUCO ') && has(name, '1000CC', '500ML', 'ORANGE VITAMIN', 'RED VITAMIN')) return out(`${ROOTS.BEB} > Jugos`);
  if (oldCat === 'Bebidas > Energéticas' || has(name, 'FASTLYTE', 'URBAN FLOW', 'GATORADE', 'POWERADE')) return out(`${ROOTS.BEB} > Energéticas e isotónicas`);
  if (oldCat === 'Bebidas > Lácteos') return out(`${ROOTS.BEB} > Lácteas`);
  if (oldCat === 'Bebidas') {
    if (has(name, 'GATORADE', 'POWERADE', 'MONSTER', 'RED BULL', 'ROCKSTAR', 'SPEED', 'FASTLYTE', 'URBAN FLOW')) return out(`${ROOTS.BEB} > Energéticas e isotónicas`);
    if (has(name, 'KAPO', 'REFRESKID', 'JUGO', 'ZUKO', 'WATTS', 'JUMEX', 'GUALLARAUCO')) return out(`${ROOTS.BEB} > Jugos`);
    if (has(name, 'AQUARIUS', 'BENEDICTINO', 'VITAL ')) return out(`${ROOTS.BEB} > Aguas saborizadas`);
    if (has(name, 'BIDON AGUA', 'AGUA STA', 'CACHANTUN S/G', 'CACHANTUN SIN GAS')) return out(`${ROOTS.BEB} > Aguas`);
    if (has(name, 'LIPTON', 'NESTEA', 'TÉ ', 'TE ')) return out(`${ROOTS.BEB} > Té frío`);
    if (has(name, 'LECHE', 'YOGUR', 'YOPI')) return out(`${ROOTS.BEB} > Lácteas`);
    return out(`${ROOTS.BEB} > Gaseosas`); // default for Bebidas
  }

  // 3) Galletas
  if (oldCat === 'Galletas > Dulces') return out(`${ROOTS.SNAGAL} > Galletas dulces`);
  if (oldCat === 'Galletas > Dulces > Con relleno') return out(`${ROOTS.SNAGAL} > Galletas dulces > Con relleno`);
  if (oldCat === 'Galletas > Saladas') return out(`${ROOTS.SNAGAL} > Galletas saladas`);
  if (oldCat === 'Galletas > Obleas') return out(`${ROOTS.SNAGAL} > Obleas`);
  if (oldCat === 'Galletas > Alfajores') return out(`${ROOTS.SNAGAL} > Alfajores`);
  if (oldCat.startsWith('Galletas')) return out(`${ROOTS.SNAGAL} > Galletas dulces`);

  // 4) Snacks
  if (oldCat === 'Snacks > Papas fritas') return out(`${ROOTS.SNAGAL} > Papas fritas`);
  if (oldCat === 'Snacks > Salados') return out(`${ROOTS.SNAGAL} > Salados`);
  if (oldCat === 'Snacks > Maní') return out(`${ROOTS.SNAGAL} > Maní`);
  if (oldCat === 'Snacks > Cabritas') return out(`${ROOTS.SNAGAL} > Cabritas`);
  if (oldCat === 'Snacks') return out(`${ROOTS.SNAGAL} > Salados`);

  // 5) Bizcochos / Queques (snack dulce empacado)
  if (isBizcocho(name)) return out(`${ROOTS.SNAGAL} > Bizcochos y queques`);
  if (has(name, 'PINGÜINO 120', 'RAYITA VAINILLA')) return out(`${ROOTS.SNAGAL} > Bizcochos y queques`);
  if (has(name, 'GALLETA ')) return out(`${ROOTS.SNAGAL} > Galletas dulces`);

  // 6) Chocolatería individuales
  if (oldCat === 'Chocolates > Barras') return out(`${ROOTS.CHOCO} > Tabletas`);
  if (oldCat === 'Chocolates > Bombones') return out(`${ROOTS.CHOCO} > Bombones`);
  if (oldCat === 'Chocolates > Bolsas') return out(`${ROOTS.CHOCO} > Bolsas e individuales`);
  if (oldCat.startsWith('Chocolates')) return out(`${ROOTS.CHOCO} > Tabletas`);
  if (isChocoIndividual(name)) return out(`${ROOTS.CHOCO} > Bolsas e individuales`);

  // 7) Halloween / Pascua / Cumpleaños
  if (isHuevoPascua(name)) return out(`${ROOTS.CUMPLE} > Pascua > Huevitos`);
  if (oldCat === 'Halloween') return out(`${ROOTS.CUMPLE} > Halloween`);
  if (oldCat === 'Pascua') return out(`${ROOTS.CUMPLE} > Pascua`);
  if (oldCat === 'Pascua > Huevitos' || oldCat === 'Cumpleaños > Huevitos') return out(`${ROOTS.CUMPLE} > Pascua > Huevitos`);
  if (oldCat === 'Pascua > Bandejas') return out(`${ROOTS.CUMPLE} > Pascua > Bandejas`);
  if (oldCat === 'Pascua > Figuras de conejo' || oldCat === 'Cumpleaños > Figuras de conejo') return out(`${ROOTS.CUMPLE} > Pascua > Figuras`);
  if (oldCat === 'Cumpleaños > Globos') return out(`${ROOTS.CUMPLE} > Globos`);
  if (oldCat === 'Cumpleaños > Velas') return out(`${ROOTS.CUMPLE} > Velas`);
  if (isCotillon(name)) return out(`${ROOTS.CUMPLE} > Cotillón`);
  if (isPiñata(name)) return out(`${ROOTS.CUMPLE} > Piñatas y bolsones`);

  // 8) Confitería refinada
  if (isBoba(name)) return out(`${ROOTS.CONFI} > Popping boba`);
  if (isMarsh(name)) return out(`${ROOTS.CONFI} > Marshmallows`);
  if (isMenta(name)) return out(`${ROOTS.CONFI} > Mentas`);
  if (isTurron(name)) return out(`${ROOTS.CONFI} > Turrones y mantecol`);
  if (isChicle(name)) return out(`${ROOTS.CONFI} > Chicles`);
  if (isChupete(name)) return out(`${ROOTS.CONFI} > Chupetes y paletas`);
  if (isAcido(name)) return out(`${ROOTS.CONFI} > Caramelos ácidos`);
  if (isGomita(name)) return out(`${ROOTS.CONFI} > Gomitas`);
  if (isCaramelo(name)) return out(`${ROOTS.CONFI} > Caramelos y masticables`);
  if (isArtesanal(name)) return out(`${ROOTS.CONFI} > Artesanal`);

  // Pre-existing Bicom confitería subtypes
  if (oldCat === 'Confitería > Caramelos') return out(`${ROOTS.CONFI} > Caramelos y masticables`);
  if (oldCat === 'Confitería > Chupetes') return out(`${ROOTS.CONFI} > Chupetes y paletas`);
  if (oldCat === 'Confitería > Chicles') return out(`${ROOTS.CONFI} > Chicles`);
  if (oldCat === 'Confitería > Gomitas') return out(`${ROOTS.CONFI} > Gomitas`);
  if (oldCat === 'Confitería > Marshmallows') return out(`${ROOTS.CONFI} > Marshmallows`);

  // Artesanía
  if (oldCat === 'Artesanía') return out(`${ROOTS.CONFI} > Artesanal`);

  // 9) Repostería
  if (oldCat === 'Repostería') {
    if (has(name, 'COBERTURA')) return out(`${ROOTS.REPO} > Coberturas`);
    if (has(name, 'CREMA ')) return out(`${ROOTS.REPO} > Cremas`);
    if (has(name, 'MANJAR', 'DULCE DE LECHE')) return out(`${ROOTS.REPO} > Manjar`);
    if (has(name, 'PAPEL ', 'STICKER', 'CAPSULA', 'MOLDE')) return out(`${ROOTS.REPO} > Insumos`);
    if (has(name, 'PALITO CHOCOLATE')) return out(`${ROOTS.REPO} > Decoración`);
    return out(`${ROOTS.REPO} > Insumos`);
  }
  if (oldCat === 'Repostería > Galletas') return out(`${ROOTS.REPO} > Insumos`);
  if (oldCat === 'Repostería > Decoración') return out(`${ROOTS.REPO} > Decoración`);
  if (oldCat === 'Repostería > Manjar') return out(`${ROOTS.REPO} > Manjar`);

  // 10) Cereales/Avena → Otros
  if (isCereal(name)) return { categoria: 'Otros', activo: 'FALSE' };

  // 11) Default Confitería ambiguous
  if (oldCat === 'Confitería' || oldCat === '') return out(ROOTS.CONFI);
  if (oldCat === 'Cumpleaños') return out(`${ROOTS.CUMPLE} > Cotillón`);

  return { categoria: oldCat };
}

// Flatten any tier-3 result to tier-2 (1 root > 1 sub).
// Quelita catalog is <2k SKUs — 3 tiers innecesario.
function flatten2Tiers(cat) {
  const parts = String(cat || '').split('>').map(s => s.trim()).filter(Boolean);
  if (parts.length <= 2) return cat;
  return `${parts[0]} > ${parts[1]}`;
}

const wb = xlsx.readFile(IN);
const sheetName = wb.SheetNames[0];
const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

const stats = { changed: 0, unchanged: 0, deactivated: 0 };
const after = {};

for (const r of rows) {
  const cur = curate(r);
  cur.categoria = flatten2Tiers(cur.categoria);
  if (cur.categoria !== r.categoria) stats.changed++;
  else stats.unchanged++;
  r.categoria = cur.categoria;
  if (cur.activo) {
    r.activo = cur.activo;
    if (cur.activo === 'FALSE') stats.deactivated++;
  }
  after[r.categoria] = (after[r.categoria] || 0) + 1;
}

const newSheet = xlsx.utils.json_to_sheet(rows, { header: Object.keys(rows[0]) });
wb.Sheets[sheetName] = newSheet;
xlsx.writeFile(wb, OUT);

console.log('\n=== Stats ===');
console.log('Cambiadas:', stats.changed);
console.log('Sin cambio:', stats.unchanged);
console.log('Desactivadas:', stats.deactivated);
console.log('\n=== Categorías resultantes ===');
Object.entries(after).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(String(n).padStart(4), c));
console.log('\nTotal categorías distintas:', Object.keys(after).length);
console.log('Escrito:', OUT);
