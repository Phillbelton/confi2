/** Parte 6: hosteo en VM con Docker + anexos. */
const { parte, cap, sub, sub3, p, vinetas, pasos, caja, tabla, aire, consola } = require('./lib');

module.exports = function contenidoC() {
  const d = [];
  const add = (...x) => x.forEach((i) => d.push(i));

  add(...parte(6, 'Hosteo en máquina virtual con Docker',
    'Cómo vive la tienda en un servidor: qué es Docker, qué piezas corren, cómo se despliega y cómo se mantiene.'));

  add(cap(29, 'La idea: por qué Docker'));
  add(p('Una tienda como esta no es un solo programa. Necesita una base de datos, un servidor que procese los pedidos, otro que arme las páginas y algo que reciba las visitas de internet. Instalar todo eso a mano en un servidor es lento, difícil de repetir y propenso a que //“en mi computador funcionaba”//.'));
  add(p('**Docker** resuelve ese problema empaquetando cada pieza en un **contenedor**: una caja cerrada que trae adentro el programa y todo lo que necesita para funcionar. Las cajas se levantan con un comando y funcionan igual en cualquier servidor.'));
  add(aire(60));
  add(caja('LA ANALOGÍA', [
    'Piensa en contenedores de barco. No importa qué haya adentro ni a qué puerto lleguen: todos tienen la misma forma, se apilan igual y se mueven con la misma grúa. Docker hace eso con programas.',
  ], 'info'));
  add(p('Hoy la tienda corre en una **máquina virtual** —un computador simulado dentro de otro— para ensayar el despliegue antes de contratar un servidor real. Lo importante: **todo lo que se practica ahí sirve tal cual en el servidor definitivo**. Cambian la dirección y el dominio; los comandos son los mismos.'));

  add(cap(30, 'Las piezas que corren'));
  add(p('Son cuatro contenedores trabajando juntos, más uno opcional:'));
  add(aire(60));
  add(tabla(
    ['Contenedor', 'Qué hace', 'Visible desde internet'],
    [
      ['**mongo**', 'La base de datos. Guarda productos, pedidos, usuarios y configuración.', 'No — solo lo alcanzan los otros contenedores'],
      ['**backend**', 'El motor. Procesa pedidos, calcula precios y tramos, procesa las imágenes que subes.', 'No directamente'],
      ['**frontend**', 'Arma las páginas que ve el cliente.', 'No directamente'],
      ['**caddy**', 'El portero. Recibe todas las visitas y las reparte a quien corresponda.', '**Sí — es la única puerta**'],
      ['**cloudflared**', 'Opcional. Crea una dirección pública temporal para mostrar la tienda.', 'Solo si se enciende'],
    ],
    [1700, 4700, 2960]
  ));
  add(aire(140));
  add(caja('POR QUÉ IMPORTA QUE SOLO CADDY ESTÉ EXPUESTO', [
    'La base de datos **no tiene puerta al exterior**. Aunque alguien conociera la dirección del servidor, no puede conectarse a ella: solo los contenedores de adentro la alcanzan. Es la diferencia entre tener la caja fuerte en la bodega o en la vereda.',
  ], 'ok'));

  add(cap(31, 'Cómo fluye una visita'));
  add(p('Cuando alguien abre la tienda, esto es lo que ocurre en menos de un segundo:'));
  add(...pasos([
    'El navegador pide la página a la dirección del servidor. Llega a **caddy**.',
    'Caddy mira qué se está pidiendo y decide a quién enviarlo.',
    'Si es una página, se la pide al **frontend**, que la arma y la devuelve.',
    'Si son datos —productos, precios, el carrito— va al **backend**, que consulta a **mongo**.',
    'Si es una imagen, caddy la entrega directamente desde el disco, sin molestar a nadie más. Por eso las fotos cargan rápido.',
  ]));
  add(caja('LA REGLA DE ORO DEL ENRUTADO', [
    'Todo lo que empiece con __/api__ va al backend. Todo lo que empiece con __/uploads__ son imágenes que sirve caddy. **Todo lo demás** va al frontend.',
  ], 'info'));

  add(cap(32, 'Dónde viven los datos'));
  add(p('Los contenedores son desechables: se pueden borrar y volver a crear sin perder nada. Lo que **sí** debe sobrevivir se guarda aparte, en espacios llamados **volúmenes**:'));
  add(aire(60));
  add(tabla(
    ['Volumen', 'Qué guarda', 'Si se pierde…'],
    [
      ['__mongo_data__', 'Toda la base: productos, pedidos, clientes, configuración.', 'Se pierde el negocio. Es lo que hay que respaldar sí o sí.'],
      ['__uploads_data__', 'Todas las imágenes subidas y sus versiones.', 'Hay que volver a subir todas las fotos.'],
      ['__caddy_data__', 'Certificados de seguridad (HTTPS).', 'Se regeneran solos.'],
    ],
    [2200, 4300, 2860]
  ));
  add(aire(140));
  add(caja('LA DISTINCIÓN QUE HAY QUE ENTENDER', [
    'Apagar y volver a levantar los contenedores **no borra nada**: los datos están en los volúmenes.',
    'Existe un comando que borra también los volúmenes (lleva la opción __-v__). **Ese sí destruye todo.** Es la única operación verdaderamente peligrosa de esta sección.',
  ], 'aviso'));

  add(cap(33, 'Poner la tienda en marcha'));
  add(p('El despliegue completo desde cero. Cada paso indica qué hace.'));

  add(sub3('1 · Entrar al servidor'));
  add(p('Se entra por **SSH**, una consola remota. Si la dirección cambió (es común en redes caseras), primero hay que encontrarla buscando qué equipo responde en el puerto de conexión: el servidor no responde al //ping// por seguridad.'));
  add(consola([
    '# Conectarse (pedirá la contraseña)',
    'ssh quelita@<dirección-del-servidor>',
  ]));

  add(sub3('2 · Traer el código'));
  add(p('Se descarga el proyecto desde su repositorio.'));
  add(consola([
    'git clone -b main https://github.com/Phillbelton/confi2.git',
    'cd ~/confi2',
  ]));

  add(sub3('3 · Configurar las claves'));
  add(p('Dos archivos guardan la configuración sensible: contraseñas de la base, claves de sesión y el usuario administrador inicial. **No están en el repositorio** —por seguridad— así que se crean a partir de las plantillas incluidas.'));
  add(consola([
    'cp .env.docker.example .env',
    'cp backend/.env.production.docker.example backend/.env.production',
    '# editar ambos y completar contraseñas y claves',
  ]));
  add(caja('SOBRE ESTOS ARCHIVOS', [
    'La contraseña de la base debe ser **la misma** en los dos archivos, o el motor no podrá conectarse.',
    'Las claves de sesión se generan al azar y deben ser largas. Hay un comando en las plantillas para generarlas.',
    'La contraseña del administrador debe ser robusta: el sistema **rechaza** las contraseñas débiles conocidas.',
  ], 'aviso'));

  add(sub3('4 · Construir'));
  add(p('Docker arma las cajas. Es el paso más largo (varios minutos) y el más delicado en servidores modestos: construir las dos piezas a la vez puede agotar la memoria y colgar la máquina. Por eso se hace **de a una**.'));
  add(consola([
    '# Liberar memoria antes de construir',
    'docker compose stop frontend backend',
    '',
    '# Construir primero el motor, después las páginas',
    'docker compose build backend',
    'docker compose build frontend',
  ]));

  add(sub3('5 · Levantar'));
  add(consola([
    'docker compose up -d',
    'docker compose ps    # los cuatro deben aparecer arriba',
  ]));
  add(p('Tras levantar, el frontend tarda entre cinco y quince segundos en responder. Si la tienda da error apenas se levanta, hay que esperar un momento y recargar.'));

  add(sub3('6 · Cargar los datos iniciales'));
  add(p('Una instalación nueva parte con la base vacía. Estos comandos crean el usuario administrador, la estructura de categorías y marcas, y el contenido visual de la tienda.'));
  add(consola([
    'docker compose exec backend node dist/scripts/seedAdmin.js',
    'docker compose exec backend node dist/scripts/seedCategories.js',
    'docker compose exec backend node dist/scripts/seedBrands.js',
    'docker compose exec backend node dist/scripts/seedCategoryBanners.js',
    'docker compose exec backend node dist/scripts/seedHomeBanners.js',
  ]));
  add(p('El catálogo de productos entra aparte, desde la planilla Excel, con el importador. Después conviene reconstruir el índice del buscador.'));

  add(cap(34, 'Actualizar a una versión nueva'));
  add(p('Cuando hay cambios publicados, la actualización sigue siempre la misma secuencia:'));
  add(consola([
    'cd ~/confi2',
    'git pull                              # traer los cambios',
    'docker compose stop frontend backend  # liberar memoria',
    'docker compose build backend',
    'docker compose build frontend',
    'docker compose up -d                  # levantar de nuevo',
  ]));
  add(caja('LOS DATOS NO SE TOCAN', [
    'Actualizar reconstruye los contenedores, **no los volúmenes**. Productos, pedidos e imágenes siguen intactos. Es una operación segura que puede repetirse cuantas veces haga falta.',
  ], 'ok'));

  add(cap(35, 'Mostrar la tienda por internet'));
  add(p('Si el servidor está en una red doméstica, no es alcanzable desde fuera. Para mostrar la tienda a alguien —un cliente, un socio— existe un **túnel**: una dirección pública temporal que apunta al servidor sin abrir nada en el router.'));
  add(consola([
    '# Encender el túnel',
    'docker compose --profile demo up -d cloudflared',
    '',
    '# Ver la dirección pública generada',
    'docker compose logs cloudflared | grep trycloudflare',
    '',
    '# Apagarlo al terminar',
    'docker compose stop cloudflared',
  ]));
  add(caja('DOS ADVERTENCIAS SOBRE EL TÚNEL', [
    'La dirección **cambia cada vez** que el túnel se reinicia. No sirve para publicidad ni para imprimir en un folleto.',
    'Mientras esté encendido, el panel de administración también queda accesible desde internet. Está protegido por contraseña, pero conviene **encenderlo solo durante la demostración**.',
  ], 'aviso'));

  add(cap(36, 'Respaldos y mantenimiento'));
  add(sub3('Respaldar la base de datos'));
  add(p('Es la tarea de mantenimiento **más importante**. Un respaldo periódico de la base protege contra el borrado accidental, la corrupción de datos y la falla del disco.'));
  add(consola([
    '# Genera una copia de toda la base',
    'docker compose exec backend node dist/scripts/backup.js',
  ]));
  add(caja('LA REGLA DE LOS RESPALDOS', [
    'Un respaldo que vive en el **mismo servidor** que la base no es un respaldo: si el servidor falla, se pierden los dos. Hay que copiarlo periódicamente a otro lugar —un disco externo, otro computador o un servicio en la nube.',
  ], 'aviso'));
  add(sub3('Revisar el estado'));
  add(consola([
    'docker compose ps                       # ¿están todos arriba?',
    'docker compose logs backend --tail 40   # últimos mensajes del motor',
    'df -h /                                 # ¿queda espacio en disco?',
    'docker system prune -f                  # limpiar restos de versiones viejas',
  ]));
  add(p('El último comando libera espacio borrando capas de construcciones anteriores. **No toca los volúmenes**, así que es seguro.'));

  add(cap(37, 'Problemas frecuentes'));
  add(aire(60));
  add(tabla(
    ['Síntoma', 'Causa probable', 'Qué hacer'],
    [
      ['La tienda no responde', 'Algún contenedor caído', 'Revisar con __docker compose ps__ y levantar con __up -d__'],
      ['Error al entrar al panel', 'Demasiados intentos de acceso', 'Esperar quince minutos o reiniciar el motor'],
      ['La construcción se cuelga', 'Memoria agotada', 'Detener contenedores y construir de a uno'],
      ['Las imágenes no se ven', 'Ruta o volumen mal montado', 'Verificar que caddy esté arriba y revisar sus registros'],
      ['No encuentro el servidor', 'La dirección cambió', 'Buscar qué equipo responde en el puerto de conexión; el //ping// no sirve'],
      ['Se perdió el arte de categorías', 'Importación en modo reemplazar', 'Volver a ejecutar el comando que carga las imágenes de categoría'],
    ],
    [2500, 2900, 3960]
  ));
  add(aire(140));
  add(caja('DÓNDE MIRAR CUANDO ALGO FALLA', [
    'En producción los errores del motor **no aparecen** en los registros normales: se escriben en un archivo. Para verlos hay que consultar ese archivo dentro del contenedor. El equipo técnico tiene el comando exacto en el manual de despliegue del repositorio.',
  ], 'info'));

  add(cap(38, 'Del ensayo al servidor definitivo'));
  add(p('La máquina virtual actual es un ensayo. El paso a un servidor real cambia poco:'));
  add(aire(60));
  add(tabla(
    ['Aspecto', 'Hoy (ensayo)', 'Servidor definitivo'],
    [
      ['**Dirección**', 'Cambia sola, red local', 'Fija y pública'],
      ['**Acceso**', 'Solo desde la misma red o por túnel', 'Desde cualquier parte, con dominio propio'],
      ['**Seguridad**', 'Sin certificado', 'HTTPS automático y gratuito'],
      ['**Comandos**', '—', '**Exactamente los mismos**'],
    ],
    [1900, 3500, 3960]
  ));
  add(aire(140));
  add(p('Para el volumen de esta tienda, un servidor de dos núcleos y cuatro gigabytes de memoria en un centro de datos de Santiago es suficiente y ronda los veinticinco dólares al mes. La cercanía importa: reduce el tiempo de respuesta para los clientes chilenos.'));
  add(caja('LO ÚNICO QUE CAMBIA EN LA CONFIGURACIÓN', [
    'Se reemplaza la dirección por el dominio en los dos archivos de configuración, y se ajusta una línea del portero para que sepa cuál es el dominio. Con eso, el certificado de seguridad se emite y se renueva solo.',
  ], 'ok'));

  // ══════════════════ ANEXO ══════════════════
  add(...parte('A', 'Anexo', 'Glosario y comandos de referencia.'));

  add(cap(39, 'Glosario'));
  add(aire(60));
  add(tabla(
    ['Término', 'Significado'],
    [
      ['**Presentación**', 'Una forma de vender el producto: unidad, display, embalaje.'],
      ['**Tramo**', 'Regla de descuento por cantidad dentro de una presentación.'],
      ['**SKU**', 'Código único e inmutable de un producto.'],
      ['**Categoría raíz**', 'Categoría de primer nivel, la que aparece en el menú principal.'],
      ['**Colección**', 'Selección de productos agrupados por una idea, no por categoría.'],
      ['**Banner**', 'Imagen promocional con enlace y ubicación asignada.'],
      ['**Contenedor**', 'Caja que empaqueta un programa con todo lo que necesita.'],
      ['**Volumen**', 'Espacio donde se guardan los datos que deben sobrevivir.'],
      ['**SSH**', 'Consola remota para administrar el servidor.'],
      ['**Túnel**', 'Dirección pública temporal que expone el servidor sin abrir el router.'],
    ],
    [2300, 7060]
  ));

  add(cap(40, 'Comandos de referencia'));
  add(p('Se ejecutan dentro del servidor, en la carpeta del proyecto.'));
  add(consola([
    '# ─── Estado y diagnóstico ───',
    'docker compose ps',
    'docker compose logs backend --tail 40',
    'df -h /',
    '',
    '# ─── Ciclo de vida ───',
    'docker compose up -d',
    'docker compose restart backend',
    'docker compose stop',
    '',
    '# ─── Actualizar ───',
    'git pull',
    'docker compose build backend',
    'docker compose build frontend',
    'docker compose up -d',
    '',
    '# ─── Datos iniciales ───',
    'docker compose exec backend node dist/scripts/seedAdmin.js',
    'docker compose exec backend node dist/scripts/seedCategoryBanners.js',
    'docker compose exec backend node dist/scripts/seedHomeBanners.js',
    '',
    '# ─── Respaldo ───',
    'docker compose exec backend node dist/scripts/backup.js',
    '',
    '# ─── Túnel de demostración ───',
    'docker compose --profile demo up -d cloudflared',
    'docker compose logs cloudflared | grep trycloudflare',
    'docker compose stop cloudflared',
  ]));
  add(aire(160));
  add(caja('EL COMANDO QUE NUNCA DEBES ESCRIBIR SIN PENSAR', [
    '__docker compose down -v__ — la opción __-v__ borra los volúmenes, es decir **toda la base de datos y todas las imágenes**. No pide confirmación y no tiene deshacer.',
  ], 'aviso'));

  return d;
};
