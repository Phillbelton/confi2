# Deploy Quelita en la VM (y futuro VPS) — runbook completo desde cero

Guía paso a paso para levantar TODO el stack vía SSH: encontrar la VM, clonar,
configurar, buildear, sembrar datos y activar el túnel de demo. Cada paso
explica **qué hace y por qué**, y al final hay una sección de problemas
conocidos con su solución (incluidos los que ya nos mordieron antes).

> **Stack:** 4 contenedores Docker — `mongo` (BD local con auth, sin puerto
> expuesto), `backend` (Express :5000), `frontend` (Next.js standalone :3000)
> y `caddy` (reverse proxy :80, lo ÚNICO expuesto: enruta `/api` → backend,
> `/uploads` → volumen de imágenes, resto → frontend). Un 5º contenedor
> opcional `cloudflared` (perfil `demo`) da la URL pública del túnel.
>
> **Credenciales VM:** usuario `quelita` / password `quelitaserver`.
> Repo público: `https://github.com/Phillbelton/confi2` (deployar rama `main`).

---

## Paso 0 — Encontrar la IP de la VM (el clásico)

La VM usa **DHCP: la IP cambia** al reiniciar router/VM. Historial: `.172 →
.173 → .174 → .182 → .183 → .184` y en 2026-06-27 la **subred entera cambió**
de `192.168.5.x` a `192.168.6.x`. Nunca asumas la IP anterior.

**⚠️ El ping NO sirve**: el firewall de la VM (UFW) dropea ICMP. La firma
correcta de la VM es **puertos 22 (SSH) y 80 (HTTP) abiertos**.

Desde **PowerShell en Windows** (escanea el puerto 22 en toda la subred —
ajusta `192.168.6` si tu red usa otra):

```powershell
# Escaneo TCP del puerto 22 en paralelo (tarda ~20-30s)
$subnet = "192.168.6"
1..254 | ForEach-Object -Parallel {
  $ip = "$($using:subnet).$_"
  if ((Test-NetConnection $ip -Port 22 -WarningAction SilentlyContinue -InformationLevel Quiet)) {
    Write-Host "SSH abierto en: $ip"
  }
} -ThrottleLimit 60
```

Desde **Git Bash** (alternativa):

```bash
subnet=192.168.6
for i in $(seq 1 254); do
  (timeout 1 bash -c "exec 3<>/dev/tcp/$subnet.$i/22" 2>/dev/null && echo "SSH abierto en: $subnet.$i") &
done; wait
```

Si aparecen varios con :22, el de la VM es el que también responde en :80.
Para saber tu subred actual: `ipconfig` (Windows) y mira la puerta de enlace.

**Consejo permanente:** fija la IP por DHCP-reservation en el router (asociar
la MAC de la VM a una IP fija) y este paso desaparece para siempre.

---

## Paso 1 — Conectarse por SSH

```bash
# Si la IP cambió desde la última vez, borra la huella vieja (evita el error
# "REMOTE HOST IDENTIFICATION HAS CHANGED"):
ssh-keygen -R <IP>

# Conexión (pedirá el password: quelitaserver)
ssh -o StrictHostKeyChecking=accept-new quelita@<IP>
```

- Si configuraste la clave `claude-quelita` en el notebook:
  `ssh -o BatchMode=yes quelita@<IP>` entra sin password.
- Todo lo que sigue se ejecuta **dentro de la VM**, salvo que se indique lo
  contrario.

---

## Paso 2 — Prerrequisitos del sistema (solo primera vez / VPS nuevo)

La VM actual ya los tiene. En un VPS nuevo:

```bash
# Sistema al día
sudo apt update && sudo apt upgrade -y

# Docker + Compose (script oficial) y permiso para usarlo sin sudo
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# ⚠️ Salir y volver a entrar por SSH para que el grupo docker aplique
exit

# Swap de 4 GB extra (el build de Next muere por OOM sin esto en máquinas de 4 GB)
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10

# Firewall: solo SSH y web
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

---

## Paso 3 — Clonar el repo (desde cero)

```bash
cd ~
# Si existe un deploy anterior y quieres partir LIMPIO de verdad:
#   cd ~/confi2 && docker compose down          # baja contenedores (conserva volúmenes/datos)
#   docker compose down -v                      # ⚠️ SOLO si además quieres BORRAR datos e imágenes
#   cd ~ && mv confi2 confi2.bak.$(date +%F)    # respalda los .env antes de borrar nada

git clone -b main https://github.com/Phillbelton/confi2.git
cd ~/confi2
git log --oneline -1   # verifica que estás en el commit esperado
```

> Si ya existe `~/confi2` y solo quieres ACTUALIZAR (no partir de cero),
> salta a la sección "Actualizar un deploy existente" al final.

---

## Paso 4 — Variables de entorno (los dos .env, NO están en git)

**⚠️ Si venías de un deploy anterior, copia los .env del respaldo y listo**
(`cp ~/confi2.bak.*/.env . && cp ~/confi2.bak.*/backend/.env.production backend/`).
Para crearlos desde cero:

### 4a. `.env` de la raíz (lo lee docker-compose)

```bash
cp .env.docker.example .env
nano .env
```

Completar:
- `MONGO_USER=quelita` y `MONGO_PASSWORD=` → genera una:
  `openssl rand -hex 16`
- `NEXT_PUBLIC_API_URL=/api` → **dejar RELATIVO tal cual**. Así el navegador
  llama al mismo origen por el que entró (IP, túnel o dominio) y el admin
  funciona igual por LAN que por Cloudflare **sin rebuild**.
- `NEXT_PUBLIC_SITE_URL=http://<IP-de-la-VM>` (solo SEO/sitemap, no crítico).
- `NEXT_PUBLIC_WHATSAPP_NUMBER=56920178216` → ⚠️ la key es `_NUMBER`, no
  `_PHONE` (el nombre viejo hacía desaparecer el botón de WhatsApp).

### 4b. `backend/.env.production`

```bash
cp backend/.env.production.docker.example backend/.env.production
nano backend/.env.production
```

Completar:
- `MONGODB_URI=mongodb://quelita:<MISMO_MONGO_PASSWORD>@mongo:27017/confiteria_quelita?authSource=admin`
  → usuario/password **deben coincidir** con el `.env` de la raíz ("mongo" es
  el DNS interno del contenedor).
- `JWT_SECRET` y `JWT_REFRESH_SECRET` → dos valores DISTINTOS:
  `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
  (o `openssl rand -hex 64`).
- `FRONTEND_URL=http://<IP-de-la-VM>` — desde el fix de CORS ya no es crítico
  si la IP cambia (el backend acepta cualquier IP privada 192.168/10/172.16-31
  y `*.trycloudflare.com`), pero déjala correcta igual.
- `USE_CLOUDINARY=false` → **imágenes en disco local** (volumen
  `uploads_data`, servidas por Caddy). Así funciona todo el pipeline de
  variantes de sharp.
- `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` / `DEFAULT_ADMIN_NAME` →
  credenciales del admin que creará el seed. ⚠️ El seed **rechaza contraseñas
  débiles/conocidas** y exige complejidad (mayúscula+minúscula+número+símbolo,
  8+). Genera una decente y **guárdala** — para recuperarla después:
  `grep DEFAULT_ADMIN ~/confi2/backend/.env.production`.

---

## Paso 5 — Build de las imágenes (⚠️ EL paso delicado: OOM)

**Nunca** hagas `docker compose build` con los contenedores corriendo ni los
dos builds a la vez: con 4-5 GB de RAM la VM entra en thrashing, **se cae el
SSH** y el build de Next muere por OOM (exit 1 sin mensaje claro).

La receta que funciona — de a UNO y **detached** (sobrevive si el SSH se corta):

```bash
cd ~/confi2

# Si hay contenedores corriendo de antes, libera RAM primero:
docker compose stop frontend backend cloudflared 2>/dev/null || true

# Build del BACKEND, detached, con log:
nohup bash -c 'docker compose build backend; echo DONE_EXIT=$? >> ~/build.log' \
  > ~/build.log 2>&1 < /dev/null & disown

# Espera a que termine (pollea hasta ver DONE_EXIT=0):
tail -f ~/build.log        # Ctrl+C para salir del tail cuando aparezca DONE_EXIT

# Ídem FRONTEND (recién cuando el backend terminó):
nohup bash -c 'docker compose build frontend; echo DONE_EXIT=$? >> ~/build.log' \
  > ~/build.log 2>&1 < /dev/null & disown
tail -f ~/build.log
```

- `DONE_EXIT=0` = éxito. Cualquier otro número = falló; revisa `~/build.log`.
- **⚠️ NUEVO (desde el rediseño de tipografías):** el build del frontend
  **necesita internet** — `next/font` descarga Quicksand/Baloo 2/Caveat de
  Google Fonts en tiempo de build. Si la VM no resuelve DNS o no tiene salida,
  el build falla con un error de fetch de fuentes.
- El build del frontend demora varios minutos en la VM; es normal.

---

## Paso 6 — Levantar el stack

```bash
docker compose up -d          # levanta mongo + backend + frontend + caddy
docker compose ps             # los 4 deben quedar Up (mongo con "healthy")
```

Smoke test (desde la VM):

```bash
# ⚠️ el frontend tarda 5-15s en escuchar tras levantar: si da 502, reintenta
curl -s -o /dev/null -w "home: %{http_code}\n"    http://localhost/
curl -s -o /dev/null -w "api:  %{http_code}\n"    http://localhost/api/categories
curl -s -o /dev/null -w "admin: %{http_code}\n"   http://localhost/admin
```

Los tres deben dar `200`. Después prueba desde tu notebook en el navegador:
`http://<IP-de-la-VM>`.

---

## Paso 7 — Sembrar datos (orden importa)

Los seeds se corren con `docker compose exec backend node dist/scripts/<X>.js`
(**NO** `npm run seed:*` — eso usa ts-node, que no existe en la imagen de
prod; los scripts ya están compilados en `dist/scripts/`).

```bash
cd ~/confi2

# 1) Admin (usa DEFAULT_ADMIN_* del .env.production)
docker compose exec backend node dist/scripts/seedAdmin.js

# 2) Taxonomía base
docker compose exec backend node dist/scripts/seedCategories.js
docker compose exec backend node dist/scripts/seedBrands.js
docker compose exec backend node dist/scripts/seedTags.js

# 3) CATÁLOGO desde el Excel curado (los productos NO tienen seed):
#    a) copiar el Excel del notebook a la VM (correr EN EL NOTEBOOK, Git Bash):
#       ⚠️ en Git Bash la ruta es /c/Users/... (no C:/Users/...)
#       scp /c/Users/sk/Downloads/quelita_template_presentacion.xlsx quelita@<IP>:~/import.xlsx
#    b) meterlo al contenedor e importar (modo replace = catálogo limpio):
docker compose cp ~/import.xlsx backend:/app/import.xlsx
docker compose exec -T backend node dist/scripts/importCatalogExcel.js /app/import.xlsx --mode=replace
#    c) indexar el buscador:
docker compose exec backend node dist/scripts/backfillSearchText.js

# 4) Contenido visual de la tienda
docker compose exec backend node dist/scripts/seedCollectionPacks.js    # 6 packs de colección con arte
docker compose exec backend node dist/scripts/seedHomeBanners.js        # 6 banners de la home
docker compose exec backend node dist/scripts/seedCategoryBanners.js    # ⭐ NUEVO: hero + miniaturas de las 7 categorías raíz
```

Notas:
- Todos los seeds son **idempotentes** (se pueden re-correr sin duplicar) y
  los de imágenes **no pisan** lo que hayas subido a mano desde el admin
  (usa `--force` solo si quieres pisar).
- El import `--mode=replace` reemplaza el catálogo pero **NO** toca el admin.

---

## Paso 8 — Túnel público de Cloudflare (demo, opcional)

Sirve para mostrar la tienda desde internet (Starlink/CGNAT no permite abrir
puertos). Es un Quick Tunnel: gratis, sin cuenta, **URL efímera**.

```bash
# Levantar (perfil demo — no arranca solo con up -d normal):
docker compose --profile demo up -d cloudflared

# Obtener la URL pública (https://xxxx.trycloudflare.com):
docker compose logs cloudflared 2>&1 | grep -o 'https://[a-z-]*\.trycloudflare\.com' | tail -1

# Bajar el túnel al terminar el demo:
docker compose stop cloudflared
```

- **La URL cambia cada vez** que el contenedor reinicia. Si rebooteas la VM
  sin haberlo parado, revive solo con URL nueva (`restart: unless-stopped`) —
  vuelve a mirar los logs para la URL vigente.
- El túnel solo expone Caddy:80 (no SSH ni Mongo). El backend ya acepta
  `*.trycloudflare.com` en CORS, y el frontend usa `/api` relativo → **el
  admin funciona por el túnel sin tocar nada**.
- Recomendación: levantarlo solo durante el demo, no 24/7.

---

## Verificación final (checklist)

| Qué | Cómo | Esperado |
|-----|------|----------|
| Contenedores | `docker compose ps` | 4 Up (5 con túnel) |
| Home | `http://<IP>/` en navegador | tienda con banners y fuentes redondeadas |
| Catálogo por categoría | `http://<IP>/productos?categoria=confiteria` | hero con banner de arte + H1 "Confitería" |
| Imágenes | producto con foto → detalle | miniaturas cargan y cambian la principal |
| Admin | `http://<IP>/admin` → login | dashboard OK |
| Apariencia | `/admin/apariencia` | switch de navegación (barra/clásico) |
| Túnel | URL trycloudflare en otro dispositivo | tienda y admin operativos |
| Persistencia | `sudo reboot`, esperar 1-2 min | todo vuelve solo (volúmenes + restart) |

---

## Problemas conocidos y cómo superarlos

### "No encuentro la IP" / no puedo entrar por SSH
- **Ping no funciona por diseño** (UFW dropea ICMP): usa el escaneo del
  puerto 22 del Paso 0. La firma de la VM = 22 y 80 abiertos.
- La **subred puede cambiar** (nos pasó: 192.168.5.x → 192.168.6.x). Mira tu
  gateway con `ipconfig` y escanea ESA subred.
- Error `REMOTE HOST IDENTIFICATION HAS CHANGED`: la IP es reciclada de otra
  huella → `ssh-keygen -R <IP>` y reconectar.
- Solución definitiva: reserva DHCP en el router para la MAC de la VM.

### No puedo entrar al admin (por IP o por túnel)
1. **¿Login da error 500?** Antes era el CORS al cambiar la IP. Ya está
   arreglado en código (acepta IPs privadas y `*.trycloudflare.com`). Si aún
   pasa: revisa que el deploy tenga ese commit (`git log --oneline | head`) y
   mira el error real — **ojo: en prod los errores NO salen en
   `docker compose logs`**, winston escribe a archivo:
   `docker compose exec backend sh -c 'tail -50 logs/error-*.log'`.
2. **¿"Demasiados intentos de login"?** El rate limit de login es ~5 intentos
   /15 min por IP. Espera 15 min o reinicia el backend (el contador vive en
   memoria): `docker compose restart backend`.
3. **¿Credenciales?** Recupéralas en la VM:
   `grep DEFAULT_ADMIN ~/confi2/backend/.env.production`. Si el seedAdmin
   nunca corrió, córrelo (Paso 7.1).
4. **¿Por el túnel carga la página pero el login "no hace nada"?** Verifica
   que estás usando la URL del túnel VIGENTE (cambia en cada reinicio —
   sácala de los logs de cloudflared). El token queda en localStorage por
   origen: si cambió la URL, hay que loguearse de nuevo.
5. **¿404/blanco en /admin?** El frontend puede tardar 5-15s tras `up -d`;
   reintenta. Si persiste: `docker compose logs frontend --tail 40`.

### El build se cuelga / se cae el SSH / exit 1 sin explicación
Es el **OOM del build** (lo más importante de este runbook): parar
contenedores + build de a uno + detached, como en el Paso 5. Nunca buildees
con el stack corriendo. Si el SSH se cortó a mitad del build detached, al
reconectar revisa `tail ~/build.log` — el build siguió solo.

### El build del frontend falla bajando fuentes
`next/font` necesita internet en build (Google Fonts). Prueba
`docker run --rm alpine ping -c1 fonts.googleapis.com` — si no hay salida,
revisa DNS/red de la VM primero.

### `apt update` falla con "Release file ... is not valid yet"
El reloj de la VM se desfasó (VirtualBox lo pisa al pausar/reanudar). Fix:
```bash
sudo date -s "YYYY-MM-DD HH:MM:SS"   # hora real aproximada
sudo systemctl enable --now chrony && sudo chronyc makestep
```
Si reincide, con la VM apagada, desde el host:
`VBoxManage setextradata "quelita-server" "VBoxInternal/Devices/VMMDev/0/Config/GetHostTimeDisabled" 1`

### Las imágenes subidas no se ven
- Deben servirse por Caddy desde el volumen: `curl -I http://localhost/uploads/<ruta>` → 200.
- El frontend usa `<img>` sin optimizador (`images.unoptimized`) y URLs
  relativas — si tocaste `NEXT_PUBLIC_API_URL`, recuerda que las variables
  `NEXT_PUBLIC_*` se **hornean en build**: cambiarlas exige rebuild del
  frontend (`docker compose up -d --build frontend`).
- Miniaturas del detalle: arregladas en `main` (pedían anchos w200/w600 que
  no existen en disco). Si las ves rotas, el deploy está atrasado.

### Mongo no levanta / backend no conecta
- `MONGO_USER`/`MONGO_PASSWORD` del `.env` raíz deben calzar EXACTO con el
  `MONGODB_URI` de `backend/.env.production` (incluye `authSource=admin`).
- ⚠️ El password root de Mongo se fija en el PRIMER arranque del volumen: si
  lo cambiaste después, o borras el volumen (`docker compose down -v`, pierde
  datos) o vuelve al password original.

### Comandos exec dentro de heredocs SSH se "comen" el resto
Si corres `docker compose exec -T ...` dentro de un `ssh ... bash -s <<'EOF'`,
redirige stdin: `docker compose exec -T backend ... < /dev/null`, o hazlo en
llamadas SSH separadas.

### Espacio en disco
Los builds acumulan capas viejas: `docker system prune -f` (no toca
volúmenes). Ver espacio: `df -h /` y `docker system df`.

---

## Actualizar un deploy existente (sin partir de cero)

```bash
cd ~/confi2
git pull                                   # trae los commits nuevos (rama del clone)
docker compose stop frontend backend       # libera RAM para el build
# build de a uno detached (receta del Paso 5)...
docker compose up -d
# correr SOLO los seeds nuevos que apliquen (ej. tras este release):
docker compose exec backend node dist/scripts/seedCategoryBanners.js
```

## Cuando esto pase al VPS real (Santiago)

- Mismo repo, mismos comandos. Cambia: IP pública fija (adiós Paso 0),
  dominio `.cl`, y en el `Caddyfile` reemplazar `:80 { ... }` por
  `tudominio.cl { ... }` → Caddy saca HTTPS de Let's Encrypt solo.
- Recomendado: 2 vCPU / 4 GB (Vultr Santiago ~USD 24/mes) + el swap del
  Paso 2 igual (el build de Next lo agradece).
- `FRONTEND_URL=https://tudominio.cl` y `NEXT_PUBLIC_SITE_URL` con el dominio.
