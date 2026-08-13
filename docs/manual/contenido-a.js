/** Partes 1–3: introducción, conceptos clave y tienda pública. */
const { parte, cap, sub, sub3, p, vinetas, pasos, caja, tabla, aire } = require('./lib');

module.exports = function contenidoA() {
  const d = [];
  const add = (...x) => x.forEach((i) => d.push(i));

  // ══════════════════ PARTE 1 ══════════════════
  add(...parte(1, 'Introducción', 'Qué es la plataforma, para quién es y cómo está organizada.'));

  add(cap(1, 'Qué es esta plataforma'));
  add(p('Esta es la tienda en línea de **Confitería Quelita**: un catálogo de más de mil cuatrocientos productos que se vende tanto **por unidad** como **por mayor**, con el precio ajustándose solo según la cantidad que el cliente lleve.'));
  add(p('El sistema tiene tres piezas que conviene distinguir desde el principio, porque el resto del manual las nombra constantemente:'));
  add(aire(60));
  add(tabla(
    ['Pieza', 'Qué es', 'Quién la usa'],
    [
      ['**La tienda**', 'El sitio público: portada, catálogo, fichas de producto, carrito y checkout.', 'Los clientes'],
      ['**El panel**', 'La administración: productos, categorías, pedidos, banners, usuarios.', 'Tú y tu equipo'],
      ['**La API**', 'El motor que conecta ambos y guarda los datos. No se usa a mano.', 'El sistema'],
    ],
    [1900, 4900, 2560]
  ));
  add(aire(120));
  add(caja('IDEA CENTRAL', [
    'Casi todo lo que se ve en la tienda se edita desde el panel, **sin necesidad de programar ni de volver a publicar el sitio**. Cambiar el orden de la portada, subir un banner de temporada o corregir un precio son tareas de minutos que quedan visibles al instante.',
  ], 'info'));

  add(cap(2, 'Los dos públicos'));
  add(p('La tienda atiende a dos clientes con lógicas muy distintas, y entender esa diferencia explica muchas decisiones del diseño:'));
  add(...vinetas([
    '**El cliente de detalle** compra una o pocas unidades para consumo propio. Le importa encontrar rápido, ver el producto y pagar sin fricción.',
    '**El cliente mayorista** —almacenes, kioscos, revendedores— compra por display o embalaje. Le importa el precio por unidad al llevar volumen, y suele cerrar el pedido conversando por WhatsApp.',
  ]));
  add(p('Por eso el catálogo muestra el precio de cada presentación y los descuentos por cantidad, y por eso la portada abre con dos puertas separadas. No es un adorno: es la estructura del negocio traducida a pantalla.'));

  add(cap(3, 'Roles y accesos'));
  add(p('Hay tres tipos de cuenta, cada una con su propia puerta de entrada:'));
  add(aire(60));
  add(tabla(
    ['Rol', 'Entra por', 'Qué puede hacer'],
    [
      ['**Administrador**', '__/admin__', 'Todo: productos, categorías, precios, banners, usuarios, pedidos, apariencia y auditoría.'],
      ['**Funcionario**', '__/funcionario__', 'Gestión de pedidos: ver, editar, cambiar estados, contactar al cliente. No toca el catálogo ni la configuración.'],
      ['**Cliente**', '__/login__', 'Su perfil, sus direcciones y el historial de sus pedidos.'],
    ],
    [2100, 1900, 5360]
  ));
  add(aire(120));
  add(caja('IMPORTANTE', [
    'Las tres puertas están separadas a propósito. Una cuenta de administrador **no puede** entrar por el acceso de clientes ni al revés: el sistema lo rechaza. Si alguien del equipo no logra entrar, lo primero a revisar es que esté usando la dirección correcta.',
  ], 'aviso'));

  // ══════════════════ PARTE 2 ══════════════════
  add(...parte(2, 'Conceptos clave', 'Cinco ideas que conviene tener claras antes de tocar el panel. Todo lo demás se apoya en ellas.'));

  add(cap(4, 'Presentaciones'));
  add(p('Una **presentación** es una forma de vender el mismo producto. Un caramelo puede venderse suelto, en display de veinticuatro o en embalaje de noventa y seis, y cada forma tiene su propio precio.'));
  add(p('El sistema reconoce cuatro tipos:'));
  add(aire(60));
  add(tabla(
    ['Tipo', 'Significado', 'Ejemplo'],
    [
      ['**Unidad**', 'Se vende suelto, de a uno.', 'Un chocolate individual'],
      ['**Cantidad mínima**', 'Hay que llevar al menos N unidades.', 'Mínimo 6 bolsas'],
      ['**Display**', 'Caja sellada con N unidades adentro.', 'Display de 24 chicles'],
      ['**Embalaje**', 'Caja grande de venta por mayor.', 'Embalaje de 96 unidades'],
    ],
    [2000, 4300, 3060]
  ));
  add(aire(120));
  add(p('Cada producto tiene **una presentación principal** —la que define su precio de referencia y el distintivo que aparece sobre la foto— y puede tener todas las adicionales que necesite. El cliente las elige en la ficha del producto.'));
  add(caja('POR QUÉ IMPORTA', [
    'Cerca del noventa por ciento del catálogo se vende en más de una presentación. Si cargas un producto con una sola cuando en realidad se vende de tres formas, estás perdiendo ventas: el mayorista no encuentra su formato y se va.',
  ], 'dato'));

  add(cap(5, 'Tramos por mayor'));
  add(p('Un **tramo** es una regla de precio del tipo //“desde tantas unidades, cada una cuesta menos”//. Se define por presentación y el sistema lo aplica solo cuando el cliente llega a esa cantidad en el carrito.'));
  add(p('Por ejemplo, para una bandeja de gomitas:'));
  add(aire(60));
  add(tabla(
    ['Cantidad', 'Precio por unidad', 'Lo que ve el cliente'],
    [
      ['1 a 23', '$2.200', 'Precio normal'],
      ['24 o más', '$2.000', '//24+ unidades a $2.000 c/u//'],
    ],
    [2400, 3000, 3960]
  ));
  add(aire(120));
  add(...vinetas([
    'El descuento es **automático**: no hay cupones ni convenios que gestionar.',
    'El cliente ve el tramo **antes** de agregar, lo que lo empuja a subir la cantidad.',
    'Cada presentación lleva sus propios tramos, porque el display ya viene con descuento incorporado.',
  ]));

  add(cap(6, 'SKU: la identidad del producto'));
  add(p('El **SKU** es el código único de cada producto (por ejemplo __QU-000716__). Se genera solo al crear el producto y **no se puede cambiar después**, porque es la llave con la que se enlazan las fotos y el archivo Excel del catálogo.'));
  add(caja('CUIDADO CON EL SKU', [
    'Si vas a cargar el catálogo desde Excel, el SKU de la planilla debe coincidir con el del sistema. Cuando coinciden, el sistema actualiza el producto existente; cuando no, crea uno nuevo y terminas con duplicados.',
  ], 'aviso'));

  add(cap(7, 'La taxonomía: cómo se ordena el catálogo'));
  add(p('Cuatro clasificaciones organizan los productos, y cada una cumple un rol distinto:'));
  add(aire(60));
  add(tabla(
    ['Clasificación', 'Para qué sirve', 'Ejemplo'],
    [
      ['**Categoría**', 'La estructura principal de navegación. Admite hasta tres niveles.', 'Confitería › Gomitas'],
      ['**Marca**', 'Quién fabrica el producto. Es un filtro del catálogo.', 'Fruna, Sabory, Nestlé'],
      ['**Formato**', 'El tamaño o gramaje.', '300 gr, 250 cc'],
      ['**Sabor**', 'El sabor, cuando aplica. Un producto puede tener varios.', 'Frutilla, menta'],
    ],
    [2100, 4700, 2560]
  ));
  add(aire(120));
  add(p('Las categorías son las más importantes: definen el menú de la tienda, la portada y las direcciones web. Las otras tres son filtros que ayudan al cliente a afinar la búsqueda.'));
  add(caja('REGLA PRÁCTICA', [
    'Un producto **debe** tener al menos una categoría. Marca, formato y sabor son opcionales, pero mientras más completos, mejor encuentra el cliente y mejor posiciona la tienda en los buscadores.',
  ], 'info'));

  add(cap(8, 'Cómo funcionan las imágenes'));
  add(p('Las imágenes se guardan **en el propio servidor**, no en un servicio externo. Cuando subes una foto, el sistema hace tres cosas automáticamente:'));
  add(...pasos([
    'La convierte a un formato liviano y moderno (WebP), que pesa mucho menos sin perder calidad visible.',
    'Genera **varias versiones en distintos tamaños** de la misma imagen.',
    'Entrega a cada visitante la versión que le conviene: la chica al celular, la grande al monitor.',
  ]));
  add(p('Ese último punto es la razón por la que la tienda carga rápido incluso con conexiones lentas: nadie descarga una foto de dos mil píxeles para verla en una tarjeta de doscientos.'));
  add(caja('LO QUE DEBES SABER AL SUBIR', [
    'Sube siempre la imagen **más grande que tengas**. El sistema achica solo, pero no puede inventar detalle que no existe.',
    'Formatos aceptados: JPG, PNG o WebP. Peso máximo: 5 MB por archivo.',
    'Para productos, lo ideal es una foto **cuadrada** de al menos 800 × 800 píxeles.',
  ], 'ok'));

  // ══════════════════ PARTE 3 ══════════════════
  add(...parte(3, 'La tienda pública', 'Qué ve el cliente y cómo está pensada cada pantalla.'));

  add(cap(9, 'La barra superior'));
  add(p('La barra que acompaña al cliente en todo el sitio contiene el logo, el buscador, el acceso a la cuenta y el carrito. Debajo puede ir la navegación por categorías.'));
  add(sub('Dos formas de navegar las categorías'));
  add(p('El sistema ofrece dos diseños y **tú eliges cuál mostrar** desde el panel, en Apariencia. Ambos funcionan igual de bien; la diferencia es de estilo y de espacio:'));
  add(aire(60));
  add(tabla(
    ['Diseño', 'Cómo se ve', 'Cuándo conviene'],
    [
      ['**Barra de categorías**', 'Una fila bajo el encabezado con todas las categorías a la vista. Al pasar el cursor se abre el panel de subcategorías; al hacer clic se entra al catálogo de esa categoría.', 'Cuando quieres que el cliente vea de inmediato todo lo que vendes. Es el estilo de los supermercados grandes.'],
      ['**Menú desplegable**', 'Un botón “Categorías” junto al logo que abre el panel completo.', 'Cuando prefieres un encabezado más limpio y compacto.'],
    ],
    [2300, 4400, 2660]
  ));
  add(aire(120));
  add(p('En celular no hay que elegir: siempre se usa el menú lateral que se abre con el botón de las tres líneas.'));
  add(sub('El buscador'));
  add(p('Al escribir, el buscador sugiere resultados en vivo: productos, marcas, categorías y colecciones. Funciona **sin acentos y por comienzo de palabra**, así que “gomita” encuentra “Gomitas” y “cafe” encuentra “Café”. También recuerda las últimas búsquedas del cliente.'));

  add(cap(10, 'La portada'));
  add(p('La portada está armada por **secciones que tú ordenas y activas** desde el panel. La configuración actual sigue una lógica de embudo: primero se le dice al cliente qué tipo de compra puede hacer, después dónde buscar, y recién entonces se le muestran productos.'));
  add(aire(60));
  add(tabla(
    ['Orden', 'Sección', 'Qué resuelve'],
    [
      ['1', '**Portada partida**', 'Dos puertas: una para la compra por mayor, otra para el detalle. Cada público se reconoce de inmediato.'],
      ['2', '**Compra por categoría**', 'Las categorías con su imagen y la cantidad de productos. Es la puerta de entrada al catálogo.'],
      ['3', '**Bloque destacado**', 'Una categoría de temporada con su arte y cuatro de sus productos, en una sola pieza.'],
      ['4', '**Lo más pedido**', 'Un carrusel con lo que más se vende.'],
      ['5', '**Packs por ocasión**', 'Las colecciones: selecciones armadas para cumpleaños, oficina, cine.'],
      ['6', '**Nuestras tiendas**', 'Los locales con mapa, horario y cómo llegar.'],
    ],
    [800, 2500, 6060]
  ));
  add(aire(120));
  add(caja('SECCIONES DISPONIBLES PERO APAGADAS', [
    'Además de las visibles hay otras guardadas y desactivadas: carruseles de ofertas, destacados y novedades, zonas de banners promocionales y un bloque de texto para la compra por mayor. **No están borradas**: puedes encenderlas cuando las necesites, y aparecerán con la configuración que ya tenían.',
  ], 'info'));

  add(cap(11, 'El catálogo'));
  add(p('Es la pantalla donde el cliente explora y filtra. Se llega desde el menú, desde la portada o desde el buscador.'));
  add(sub('La cabecera de categoría'));
  add(p('Al entrar a una categoría, arriba aparece una banda con su imagen, su nombre y la cantidad de productos. Esa imagen se define en tres niveles y el sistema usa el primero que encuentre:'));
  add(...pasos([
    'Un **banner de campaña** creado en el panel para esa categoría (sirve para Halloween, Navidad o cualquier temporada, y puede programarse con fecha de inicio y término).',
    'La **imagen propia de la categoría**, cargada desde el panel de Categorías.',
    'Un **fondo de color con su emoji**, si no hay ninguna imagen.',
  ]));
  add(p('Gracias a ese tercer nivel la cabecera nunca se ve vacía ni rota, aunque falte material gráfico.'));
  add(sub('Filtros'));
  add(p('En el costado (o en un panel deslizante en celular) el cliente puede filtrar por precio, marca, presentación, sabor y promociones. Cada filtro muestra **cuántos productos** quedarían al aplicarlo, y los que no darían resultados no se ofrecen.'));
  add(caja('LOS FILTROS SON DINÁMICOS', [
    'Las opciones cambian según lo que se esté viendo. Si el cliente está en Heladería, solo aparecen las marcas que venden helados. Esto se calcula solo: no hay nada que configurar.',
  ], 'ok'));

  add(cap(12, 'La ficha de producto'));
  add(p('Es donde se decide la compra. Contiene:'));
  add(...vinetas([
    'La **galería de fotos**, con miniaturas para cambiar la imagen principal.',
    'El **selector de presentación**, si el producto se vende de varias formas. Al cambiarlo, el precio se actualiza.',
    'El **precio** y, si existen, los **tramos por cantidad**.',
    'El selector de cantidad y el botón para agregar al carrito.',
    'Los datos del producto: marca, formato, sabor, código de barras.',
    'Productos relacionados de la misma categoría.',
    'Un botón de **WhatsApp** para consultar por ese producto.',
  ]));
  add(caja('EN CELULAR', [
    'El botón de agregar al carrito queda fijo en la parte baja de la pantalla mientras el cliente hace scroll, para que nunca tenga que buscarlo.',
  ], 'info'));

  add(cap(13, 'Carrito y compra'));
  add(p('El carrito **se guarda en el navegador del cliente**: si cierra la pestaña y vuelve mañana, sus productos siguen ahí. No necesita tener cuenta para armarlo.'));
  add(p('Al agregar un producto aparece un aviso breve que confirma la acción y permite ir al carrito. Dentro del carrito, cada línea muestra la presentación elegida y ajustar la cantidad recalcula el precio al instante si se cruza un tramo.'));
  add(sub('El checkout'));
  add(p('El proceso pide los datos de contacto, la dirección o el retiro en tienda, y la forma de pago. Al confirmar:'));
  add(...pasos([
    'Se crea el pedido con un número que el cliente puede usar para seguirlo.',
    'Se envía un correo de confirmación al cliente.',
    'El pedido aparece en el panel para que el equipo lo prepare.',
  ]));

  return d;
};
