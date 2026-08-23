/** Partes 4–5: panel de administración y operación diaria. */
const { parte, cap, sub, sub3, p, vinetas, pasos, caja, tabla, aire, consola } = require('./lib');

module.exports = function contenidoB() {
  const d = [];
  const add = (...x) => x.forEach((i) => d.push(i));

  // ══════════════════ PARTE 4 ══════════════════
  add(...parte(4, 'El panel de administración', 'Sección por sección: qué hace cada pantalla y cómo usarla.'));

  add(cap(14, 'Entrar al panel'));
  add(p('El panel vive en la dirección del sitio seguida de __/admin__. Se entra con el correo y la contraseña de administrador.'));
  add(caja('SI NO PUEDES ENTRAR', [
    '**“Demasiados intentos”**: por seguridad, el sistema bloquea tras varios intentos fallidos. Espera quince minutos y vuelve a probar.',
    '**“Acceso denegado”**: estás usando una cuenta que no es de administrador, o entrando por la puerta equivocada. Los funcionarios entran por __/funcionario__.',
    '**Pantalla en blanco**: recarga la página. Si persiste, el servidor puede estar reiniciándose; espera un minuto.',
  ], 'aviso'));
  add(p('Una vez dentro, el menú lateral da acceso a todas las secciones. Se puede plegar para ganar espacio, y el buscador rápido (la lupa del encabezado) permite saltar a cualquier pantalla escribiendo su nombre.'));

  add(cap(15, 'Productos'));
  add(p('Es la sección que más vas a usar. La lista muestra todos los productos con su foto, SKU, categoría, precio y estado, y permite buscar, filtrar y ordenar.'));
  add(sub('Crear un producto'));
  add(p('El formulario está dividido en bloques. Los campos marcados con asterisco son obligatorios:'));
  add(aire(60));
  add(tabla(
    ['Bloque', 'Qué se completa'],
    [
      ['**Identificación**', 'Nombre del producto (obligatorio), descripción (obligatoria, mínimo diez caracteres), SKU y código de barras. El SKU se genera solo si lo dejas vacío.'],
      ['**Clasificación**', 'Categoría (obligatoria, al menos una), marca, formato y sabores. La categoría se elige encadenando los niveles y presionando “Agregar”.'],
      ['**Venta y precios**', 'El precio y la presentación principal: cómo se vende y cuántas unidades trae. Aquí también se cargan los tramos por cantidad.'],
      ['**Otras presentaciones**', 'Las formas adicionales de venta, cada una con su precio y sus propios tramos.'],
      ['**Imágenes**', 'Hasta cinco fotos. La primera es la principal; se pueden reordenar.'],
      ['**Visibilidad**', 'Si el producto está activo (visible en la tienda) y si es destacado.'],
    ],
    [2200, 7160]
  ));
  add(aire(120));
  add(caja('LA VISTA PREVIA', [
    'Mientras completas el formulario, a la derecha se ve **cómo quedará la tarjeta del producto** en la tienda. En celular ese panel se abre con el botón flotante “Vista previa”. Úsalo: es la forma más rápida de detectar un nombre demasiado largo o un precio mal escrito.',
  ], 'info'));
  add(sub('Editar un producto'));
  add(p('Al editar cambian dos cosas respecto de la creación: el **SKU queda bloqueado** (es la identidad del producto) y las imágenes ya guardadas aparecen en una galería donde se pueden eliminar una por una.'));

  add(cap(16, 'Categorías'));
  add(p('Las categorías se organizan en un árbol de hasta tres niveles. La pantalla muestra las categorías raíz y, al desplegarlas, sus subcategorías.'));
  add(sub('Las tres imágenes de una categoría'));
  add(p('Cada categoría puede tener tres imágenes, cada una con un uso y una proporción distinta:'));
  add(aire(60));
  add(tabla(
    ['Imagen', 'Proporción', 'Dónde se usa'],
    [
      ['**Miniatura**', 'Cuadrada — 800 × 800', 'Listados del panel, menú de categorías, bloque destacado de la portada'],
      ['**Banner de catálogo**', 'Panorámica — 2000 × 300', 'La cabecera al filtrar por esa categoría, en pantallas grandes'],
      ['**Banner móvil**', 'Apaisada — 1000 × 400', 'La misma cabecera, en celular'],
    ],
    [2300, 2400, 4660]
  ));
  add(aire(120));
  add(caja('NO NECESITAS PREPARAR TRES ARCHIVOS', [
    'Sube **una sola imagen grande** y presiona “Subir imagen y generar los 3 tamaños”. El sistema recorta cada versión de forma inteligente, buscando la zona con más detalle. Si algún recorte no te convence, puedes reemplazar solo ese tamaño.',
    'Para que los tres recortes salgan bien, la imagen original debería medir al menos **2000 × 800 píxeles**.',
  ], 'ok'));
  add(sub('Atributos para filtrar'));
  add(p('Cada categoría puede definir **atributos propios** que después funcionan como filtros: por ejemplo “% de cacao” en Chocolatería. Los productos de sus subcategorías heredan esos atributos automáticamente, así que basta definirlos una vez en la raíz.'));

  add(cap(17, 'Marcas, formatos y sabores'));
  add(p('Tres listas simples que alimentan los filtros del catálogo. Se administran igual: crear, editar, activar o desactivar.'));
  add(...vinetas([
    '**Marcas**: además del nombre, admiten un logo.',
    '**Formatos**: el valor y la unidad (300 gr, 250 cc). El sistema puede detectarlos del nombre del producto.',
    '**Sabores**: un producto puede tener varios.',
  ]));
  add(caja('ANTES DE CREAR, BUSCA', [
    'Es fácil terminar con “Fruna”, “FRUNA” y “Fruna S.A.” como tres marcas distintas, lo que rompe los filtros. Revisa siempre si ya existe antes de crear una entrada nueva.',
  ], 'aviso'));

  add(cap(18, 'Colecciones'));
  add(p('Una **colección** es una selección de productos agrupados por una idea, no por su categoría: “Combo cumpleaños”, “Snacks para el cine”, “Picoteo de oficina”. Sirven para sugerir compras que el cliente no habría armado solo.'));
  add(p('Cada colección tiene nombre, imagen, emoji y una lista de productos que se eligen a mano y se pueden reordenar arrastrando. Las que marques para la portada aparecen en la sección de packs.'));

  add(cap(19, 'Banners y diseño de la portada'));
  add(p('Esta pantalla hace dos cosas distintas que conviene no confundir: administra las **imágenes promocionales** y define el **orden de la portada**.'));
  add(sub('Los banners'));
  add(p('Cada banner tiene una imagen (y opcionalmente otra para celular), textos, un enlace y una ubicación. La **ubicación** determina dónde aparece:'));
  add(aire(60));
  add(tabla(
    ['Ubicación', 'Dónde aparece', 'Tamaño sugerido'],
    [
      ['**Portada principal**', 'Las piezas grandes del inicio', '1920 × 364 (móvil: 700 × 330)'],
      ['**Promocional**', 'Los mosaicos de promociones', 'Según las columnas de la franja'],
      ['**Secundario**', 'Franjas delgadas tipo cinta', '2752 × 256'],
      ['**Top de categoría**', 'Cabecera de una categoría (campañas)', '2000 × 300'],
      ['**Top de colección**', 'Cabecera de una colección', '2000 × 300'],
    ],
    [2300, 3700, 3360]
  ));
  add(aire(120));
  add(p('El formulario muestra el tamaño ideal dibujado a escala y una **vista previa en vivo**, así que no hace falta adivinar proporciones.'));
  add(caja('PROGRAMAR UNA CAMPAÑA', [
    'Los banners aceptan **fecha de inicio y de término**. Puedes dejar listo el banner de Halloween en septiembre con fecha para octubre: aparece y desaparece solo, sin que nadie tenga que acordarse.',
  ], 'dato'));
  add(sub('El orden de la portada'));
  add(p('En la misma pantalla se ordenan las secciones de la portada arrastrándolas, y se encienden o apagan con un interruptor. Los cambios se aplican de inmediato en la tienda.'));
  add(p('Las secciones de producto son **configurables**: puedes definir su título, de dónde salen los productos (más vendidos, ofertas, novedades, destacados o una colección) y cuántos mostrar. Eso permite tener, por ejemplo, un carrusel “Especial Navidad” apuntando a una colección de temporada.'));

  add(cap(20, 'Apariencia'));
  add(p('Dos decisiones de diseño que se cambian con un clic y afectan a toda la tienda:'));
  add(sub3('Navegación de categorías'));
  add(p('Elige entre la **barra de categorías** (todas visibles bajo el encabezado) o el **menú desplegable** (un botón junto al logo). Explicado en el capítulo 9.'));
  add(sub3('Presentaciones en la tarjeta'));
  add(p('Define cómo se muestran las presentaciones en las tarjetas del catálogo, para los productos que se venden de varias formas:'));
  add(aire(60));
  add(tabla(
    ['Opción', 'Cómo se ve'],
    [
      ['**Inline simple**', 'Selector dentro de la tarjeta y el mejor descuento en una línea. Compacto.'],
      ['**Inline con escalera**', 'Igual, pero con todos los tramos desplegables. Más información a la vista.'],
      ['**Vista rápida**', 'Tarjeta limpia con un botón que abre un panel inferior. La grilla se ve más ordenada.'],
    ],
    [2400, 6960]
  ));

  add(cap(21, 'Pedidos'));
  add(p('El corazón de la operación diaria. La lista muestra los pedidos con su número, cliente, total y estado, y permite filtrar por estado, fecha o forma de pago. Los pedidos que llevan mucho tiempo sin atención aparecen marcados como **urgentes**.'));
  add(sub('El ciclo de un pedido'));
  add(...pasos([
    '**Pendiente** — recién ingresado, esperando confirmación.',
    '**Confirmado** — validado con el cliente; se le envía correo.',
    '**En preparación** — se está armando.',
    '**Listo** — esperando retiro o despacho.',
    '**Entregado** — cerrado.',
  ]));
  add(p('También puede quedar **cancelado**, registrando el motivo.'));
  add(sub('Editar un pedido'));
  add(p('Se pueden agregar o quitar productos, cambiar cantidades y ajustar el costo de envío. El total se recalcula respetando los tramos por cantidad, y al guardar se le puede avisar al cliente por correo.'));
  add(sub('WhatsApp integrado'));
  add(p('Cada pedido tiene un botón de WhatsApp que abre la conversación con **un mensaje ya redactado** según el estado: confirmación, aviso de que está listo, o coordinación de entrega. El mensaje incluye el número de pedido, el detalle y la dirección o el horario de retiro, y el sistema deja registrado que se contactó al cliente.'));
  add(caja('EL PANEL DE FUNCIONARIO', [
    'En __/funcionario__ existe una versión reducida de esta pantalla, pensada para quien solo atiende pedidos. Tiene lo necesario para operar, sin acceso al catálogo, precios ni configuración.',
  ], 'info'));

  add(cap(22, 'Usuarios y auditoría'));
  add(p('En **Usuarios** se crean y administran las cuentas del equipo, asignando el rol de administrador o funcionario, y se pueden desactivar sin borrarlas.'));
  add(p('En **Auditoría** queda registrado quién hizo qué y cuándo: creaciones, ediciones y eliminaciones, con el detalle de lo que cambió. Es la herramienta para resolver el clásico “¿quién modificó este precio?”.'));

  add(cap(23, 'Importación desde Excel'));
  add(p('Para cargar o actualizar el catálogo en masa. El sistema lee una planilla con los productos y crea automáticamente las categorías, marcas, formatos y sabores que no existan.'));
  add(caja('LOS DOS MODOS', [
    '**Agregar**: suma o actualiza productos sin tocar los que no aparecen en la planilla. Es el modo seguro para el día a día.',
    '**Reemplazar**: deja el catálogo exactamente igual a la planilla, desactivando lo que no esté en ella. Úsalo solo cuando la planilla sea la fuente definitiva.',
  ], 'aviso'));
  add(caja('DESPUÉS DE IMPORTAR EN MODO REEMPLAZAR', [
    'Ese modo **recrea las categorías**, y al hacerlo se pierden sus imágenes. Hay que volver a cargarlas: si el arte es el de fábrica, el equipo técnico lo restituye con un comando; si son fotos tuyas, se vuelven a subir desde el panel.',
    'Conviene revisar la portada después de una importación grande, porque las secciones que apuntan a una categoría pueden quedar apuntando a nada.',
  ], 'aviso'));

  // ══════════════════ PARTE 5 ══════════════════
  add(...parte(5, 'Operación diaria', 'Guías paso a paso para las tareas más frecuentes.'));

  add(cap(24, 'Dar de alta un producto'));
  add(...pasos([
    'Entra a **Productos** y presiona //Nuevo producto//.',
    'Escribe el **nombre** completo, tal como quieres que lo vea el cliente.',
    'Escribe una **descripción** de al menos una frase. Es lo que ayuda a que el producto aparezca en Google.',
    'Deja el **SKU** vacío para que se genere solo, salvo que estés sincronizando con tu Excel.',
    'Elige la **categoría**: selecciona el nivel principal, luego el subnivel si aplica, y presiona //Agregar//.',
    'Completa **marca, formato y sabor** si corresponden.',
    'En **Venta y precios**, escribe el precio y elige cómo se vende. Si no es por unidad, indica cuántas unidades trae.',
    'Si hay descuento por cantidad, presiona //Agregar tramo// e indica desde cuántas unidades y a qué precio.',
    'Si el producto se vende de otras formas, agrégalas en **Otras presentaciones**.',
    'Sube las **fotos**, la mejor primero.',
    'Revisa la **vista previa** de la derecha.',
    'Deja **Producto activo** encendido y presiona //Crear producto//.',
  ]));
  add(caja('ERRORES QUE MÁS SE REPITEN', [
    'Olvidar la categoría: el producto se crea pero **no aparece** en el catálogo navegable.',
    'Cargar solo la presentación por unidad cuando el producto también se vende por display: el mayorista no lo encuentra.',
    'Subir la foto con el logo o la marca de agua del proveedor.',
  ], 'aviso'));

  add(cap(25, 'Cambiar el aspecto de la portada'));
  add(sub3('Reordenar o esconder una sección'));
  add(...pasos([
    'Entra a **Banners** y baja hasta el diseño de la portada.',
    'Arrastra las secciones para cambiar el orden, o usa el interruptor para esconderlas.',
    'Guarda. Abre la tienda en otra pestaña y recarga para comprobar.',
  ]));
  add(sub3('Cambiar el texto de la portada principal'));
  add(p('Los dos paneles grandes del inicio son **banners** con ubicación “Portada principal”. Para cambiar sus títulos o su imagen, edítalos en la lista de banners. Los dos primeros activos son los que se muestran.'));

  add(cap(26, 'Preparar una campaña de temporada'));
  add(p('El caso típico: llega Halloween y quieres vestir la tienda sin improvisar el mismo día.'));
  add(...pasos([
    'Prepara el arte: una pieza panorámica de 2000 × 300 y, si puedes, una de 1000 × 400 para celular.',
    'En **Banners**, crea uno con ubicación //Top de categoría// y enlázalo a la categoría de la campaña.',
    'Define **fecha de inicio y término**. Fuera de esa ventana el banner no se muestra.',
    'Crea una **colección** con los productos de la campaña y márcala para la portada.',
    'Opcional: en el diseño de la portada, apunta el bloque destacado a esa categoría.',
    'Verifica en la tienda que la cabecera de la categoría muestre el arte nuevo.',
  ]));
  add(caja('AL TERMINAR LA CAMPAÑA', [
    'Si pusiste fecha de término, el banner desaparece solo. La colección sí hay que desmarcarla de la portada a mano — o dejarla, si sigue teniendo sentido.',
  ], 'info'));

  add(cap(27, 'Atender un pedido'));
  add(...pasos([
    'Entra a **Pedidos**. Los urgentes están marcados.',
    'Abre el pedido y revisa el detalle: productos, presentaciones, cantidades y total.',
    'Confirma con el cliente por **WhatsApp** usando el botón del pedido, que trae el mensaje redactado.',
    'Si hay cambios, edita el pedido: agrega o quita productos y ajusta el envío. El total se recalcula solo.',
    'Cambia el estado a **Confirmado**. El cliente recibe un correo.',
    'Al prepararlo, pásalo a **En preparación** y luego a **Listo**.',
    'Cuando el cliente lo reciba, márcalo como **Entregado**.',
  ]));

  add(cap(28, 'Rutinas recomendadas'));
  add(aire(60));
  add(tabla(
    ['Cada', 'Tarea'],
    [
      ['**Día**', 'Revisar pedidos pendientes y los marcados como urgentes.'],
      ['**Semana**', 'Actualizar el banner de ofertas. Revisar productos sin foto y sumar las que falten.'],
      ['**Mes**', 'Revisar precios y tramos. Limpiar marcas o formatos duplicados. Mirar los productos más vistos para ajustar destacados.'],
      ['**Temporada**', 'Preparar la campaña siguiente con anticipación y fechas programadas.'],
    ],
    [1500, 7860]
  ));
  add(aire(140));
  add(caja('LA MEJORA DE MAYOR IMPACTO', [
    'Hoy la mayoría de los productos **no tiene fotografía** y la tienda muestra un recuadro gris en su lugar. Ninguna decisión de diseño compensa eso: una sesión de fotos, aunque sea con celular sobre fondo blanco, subiría el nivel de toda la tienda más que cualquier otro cambio.',
    'Un orden razonable para empezar: los más vendidos, después los de mayor margen, después el resto.',
  ], 'dato'));

  return d;
};
