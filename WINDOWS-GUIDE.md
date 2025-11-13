# 🪟 Guía para Windows - Confitería Quelita

Guía específica para ejecutar el proyecto en **Windows 10/11**.

---

## ⚡ Solución Rápida al Error

Si viste este error:
```
"." no se reconoce como un comando interno o externo
```

**Solución:** Usa los comandos actualizados:

```powershell
# En la RAÍZ del proyecto (C:\Users\sk\Desktop\Confiteria)
npm run check
```

Ya NO uses:
- ~~`./scripts/...`~~ (sintaxis de Linux/Mac)
- ~~Scripts `.sh`~~ (bash no existe en Windows)

---

## 🚀 Comandos para Windows

### Verificar Servicios

```powershell
# Desde la raíz del proyecto
npm run check
```

### Ejecutar Tests

```powershell
# Tests completos (consola + HTML)
npm test
npm run test:report

# O todo junto
npm run test:all
```

### Crear Admin

```powershell
npm run create-admin
```

### Iniciar Servicios

```powershell
# Backend (Terminal/PowerShell 1)
cd backend
npm run dev

# Frontend (Terminal/PowerShell 2)
cd frontend
npm run dev
```

---

## 📋 Setup Inicial en Windows

### 1. Verificar Requisitos

```powershell
# Verificar Node.js (debe ser >= 18)
node --version

# Verificar npm
npm --version

# Verificar MongoDB
# Opción A: MongoDB como Servicio de Windows
Get-Service | findstr MongoDB

# Opción B: MongoDB Compass
# Abre MongoDB Compass y verifica conexión a localhost:27017
```

### 2. Instalar Dependencias

```powershell
# Desde la raíz (C:\Users\sk\Desktop\Confiteria)
npm run install:all

# Si esto falla, hazlo manualmente:
npm install
cd backend
npm install
cd ..
cd frontend
npm install
cd ..
```

### 3. Configurar .env

**Backend:**
```powershell
cd backend
copy .env.example .env
notepad .env
# Edita los valores necesarios
```

**Frontend:**
```powershell
cd frontend
echo NEXT_PUBLIC_API_URL=http://localhost:5000/api > .env.local
notepad .env.local
# Verifica y guarda
```

### 4. Iniciar MongoDB

**Opción A: Servicio de Windows**
```powershell
# Iniciar
net start MongoDB

# O desde Servicios (services.msc)
# Buscar "MongoDB" y hacer clic en "Iniciar"
```

**Opción B: MongoDB Compass**
1. Abre MongoDB Compass
2. Conecta a `mongodb://localhost:27017`
3. Mantén Compass abierto

**Opción C: MongoDB Manualmente**
```powershell
# Si instalaste sin servicio
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongod.exe --dbpath="C:\data\db"
```

### 5. Crear Usuario Admin

```powershell
# Desde la raíz
npm run create-admin

# Output mostrará:
# Email: admin@confiteriaquelita.com
# Password: Admin123!@#
```

**Cambiar rol en MongoDB:**

**Opción A: MongoDB Compass (Más fácil)**
1. Conecta a `mongodb://localhost:27017`
2. Selecciona database: `confiteria_quelita_dev`
3. Abre colección `users`
4. Busca el usuario por email
5. Click "Edit Document"
6. Cambia `role: "cliente"` a `role: "admin"`
7. Click "Update"

**Opción B: mongosh (Línea de comandos)**
```powershell
# Abrir mongosh
mongosh

# Conectar a database
use confiteria_quelita_dev

# Actualizar rol
db.users.updateOne(
  { email: "admin@confiteriaquelita.com" },
  { $set: { role: "admin" } }
)

# Verificar
db.users.findOne({ email: "admin@confiteriaquelita.com" })

# Salir
exit
```

### 6. Iniciar Servicios

Necesitas **3 ventanas de PowerShell/CMD**:

**PowerShell 1 - Backend:**
```powershell
cd C:\Users\sk\Desktop\Confiteria\backend
npm run dev
```

**PowerShell 2 - Frontend:**
```powershell
cd C:\Users\sk\Desktop\Confiteria\frontend
npm run dev
```

**PowerShell 3 - Verificar:**
```powershell
cd C:\Users\sk\Desktop\Confiteria
npm run check
```

### 7. Ejecutar Tests

```powershell
# En la PowerShell 3 (o nueva)
cd C:\Users\sk\Desktop\Confiteria
npm test
```

---

## 🎯 Atajos con Windows Terminal

Si usas **Windows Terminal** (recomendado):

### Crear Perfil de Desarrollo

1. Abre Windows Terminal
2. Settings (Ctrl + ,)
3. "+ Add a new profile" → "New empty profile"
4. Nombre: "Confitería - Dev"
5. Command line:
   ```
   powershell.exe -NoExit -Command "cd C:\Users\sk\Desktop\Confiteria"
   ```
6. Starting directory:
   ```
   C:\Users\sk\Desktop\Confiteria
   ```

### Abrir Todo de una Vez

Crea un script `start-dev.ps1`:

```powershell
# start-dev.ps1
Start-Process wt -ArgumentList `
  "new-tab --title Backend powershell -NoExit -Command 'cd backend; npm run dev'", `
  "new-tab --title Frontend powershell -NoExit -Command 'cd frontend; npm run dev'"
```

Ejecuta:
```powershell
.\start-dev.ps1
```

---

## 🔧 Troubleshooting Windows

### 1. "npm: no se reconoce"

**Problema:** Node.js no está en PATH

**Solución:**
```powershell
# Reinstalar Node.js desde nodejs.org
# Reiniciar PowerShell
```

### 2. "mongod: no se reconoce"

**Problema:** MongoDB no está instalado o no está en PATH

**Solución:**
- Descargar MongoDB Community desde mongodb.com
- O usar MongoDB Atlas (cloud)
- O instalar con Chocolatey: `choco install mongodb`

### 3. "Puerto 3000 o 5000 ocupado"

**Ver qué usa el puerto:**
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

**Matar proceso:**
```powershell
# Encontrar PID del comando anterior
taskkill /PID <numero> /F
```

### 4. Scripts de PowerShell deshabilitados

**Error:** "No se pueden ejecutar scripts"

**Solución:**
```powershell
# Ejecutar como Administrador
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Reintentar comando
```

### 5. MongoDB no inicia como servicio

**Error:** "El servicio MongoDB no se inició"

**Solución A: Reinstalar servicio**
```powershell
# Como Administrador
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongod.exe --install --serviceName MongoDB --serviceDisplayName "MongoDB" --dbpath "C:\data\db"
net start MongoDB
```

**Solución B: Usar MongoDB Compass**
- Abre Compass
- Conecta manualmente
- Mantén abierto mientras desarrollas

### 6. CORS errors en Frontend

**Problema:** Frontend no puede conectar a Backend

**Solución:**
```powershell
# Verificar .env en backend
# FRONTEND_URL debe ser: http://localhost:3000
```

---

## 📁 Estructura Recomendada

```
C:\Users\sk\Desktop\Confiteria\
├── backend\
│   ├── .env            (¡Crear desde .env.example!)
│   ├── node_modules\
│   └── ...
│
├── frontend\
│   ├── .env.local      (Opcional pero recomendado)
│   ├── node_modules\
│   └── ...
│
├── scripts\
│   ├── check-services.js   ✓ (Funciona en Windows)
│   ├── check-services.bat  ✓ (Alternativa nativa)
│   ├── test-all.js         ✓ (Funciona en Windows)
│   └── ...
│
└── package.json        (Scripts npm)
```

---

## 🎨 Recomendaciones para Windows

### 1. Usar Windows Terminal

- Mejor experiencia que CMD
- Pestañas múltiples
- Copy/paste con Ctrl+C / Ctrl+V
- Descarga: Microsoft Store

### 2. Instalar Node.js LTS

- Versión recomendada: 20.x LTS
- Descarga: https://nodejs.org

### 3. MongoDB Compass

- GUI amigable para MongoDB
- Más fácil que comandos
- Descarga: https://www.mongodb.com/products/compass

### 4. VS Code

- Editor recomendado
- Terminal integrado
- Extensions útiles:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - MongoDB for VS Code

---

## ✅ Checklist de Setup

Verifica que todo esté correcto:

- [ ] Node.js >= 18 instalado
- [ ] npm funcionando
- [ ] MongoDB instalado y corriendo
- [ ] Proyecto clonado en `C:\Users\sk\Desktop\Confiteria`
- [ ] Dependencias instaladas (`npm run install:all`)
- [ ] `.env` creado en backend
- [ ] Usuario admin creado y rol cambiado
- [ ] Backend corriendo en http://localhost:5000
- [ ] Frontend corriendo en http://localhost:3000
- [ ] `npm run check` pasa todos los tests

---

## 🚀 Comando Rápido de Verificación

```powershell
# Ejecuta esto para ver el estado de todo
cd C:\Users\sk\Desktop\Confiteria
npm run check
```

**Resultado esperado:**
```
✓ Node.js (v20.x.x)
✓ npm (v10.x.x)
✓ MongoDB
✓ Backend (http://localhost:5000)
✓ Frontend (http://localhost:3000)
✓ Backend dependencies
✓ Frontend dependencies
✓ Backend .env
✓ Frontend .env.local (optional)

✓ All critical services are ready!
  You can run tests with: npm test
```

---

## 📞 Ayuda Adicional

Si sigues teniendo problemas:

1. Verifica versiones:
   ```powershell
   node --version
   npm --version
   ```

2. Limpia todo y reinstala:
   ```powershell
   cd backend
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install

   cd ..\frontend
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Recurse -Force .next
   Remove-Item package-lock.json
   npm install
   ```

3. Verifica que MongoDB esté corriendo:
   ```powershell
   Get-Process | findstr mongod
   ```

---

**¡Ahora puedes desarrollar en Windows sin problemas!** 🎉

Para testing completo, ve a: [QUICK-START-TESTING.md](./QUICK-START-TESTING.md)
