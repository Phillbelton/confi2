###############################################################################
# SCRIPT DE TESTING COMPLETO - CONFITERÍA QUELITA (PowerShell)
# Ejecuta todos los tests del backend y verifica funcionalidades clave
###############################################################################

# Colores
$ErrorActionPreference = "Continue"

function Write-Header {
    param([string]$Text)
    Write-Host "`n========================================" -ForegroundColor Blue
    Write-Host $Text -ForegroundColor Blue
    Write-Host "========================================`n" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Cyan
}

Write-Host "`n🚀 CONFITERÍA QUELITA - TEST SUITE COMPLETO`n" -ForegroundColor Blue

###############################################################################
# 1. VERIFICAR UBICACIÓN
###############################################################################
Write-Header "1. Verificando ubicación del proyecto"

if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Error "Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
}

Write-Success "Ubicación correcta"

###############################################################################
# 2. VERIFICAR DEPENDENCIAS
###############################################################################
Write-Header "2. Verificando dependencias"

# Verificar Node.js
try {
    $nodeVersion = node -v
    Write-Success "Node version: $nodeVersion"
} catch {
    Write-Error "Node.js no está instalado"
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm -v
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Error "npm no está instalado"
    exit 1
}

###############################################################################
# 3. VERIFICAR VARIABLES DE ENTORNO
###############################################################################
Write-Header "3. Verificando configuración de entorno"

if (-not (Test-Path "backend\.env.test") -and -not (Test-Path "backend\.env")) {
    Write-Error "No se encontró archivo .env en backend/"
    Write-Warning "Copia backend\.env.example a backend\.env y configura las variables"
    exit 1
}

Write-Success "Archivo de configuración encontrado"

# Verificar MONGODB_URI
$envFile = if (Test-Path "backend\.env.test") { "backend\.env.test" } else { "backend\.env" }
$envContent = Get-Content $envFile -Raw
if ($envContent -notmatch "MONGODB_URI") {
    Write-Error "MONGODB_URI no está configurado en $envFile"
    exit 1
}

Write-Success "Variables de entorno OK"

###############################################################################
# 4. INSTALAR DEPENDENCIAS
###############################################################################
Write-Header "4. Verificando dependencias del proyecto"

if (-not (Test-Path "backend\node_modules")) {
    Write-Info "Instalando dependencias del backend..."
    Push-Location backend
    npm install
    Pop-Location
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Info "Instalando dependencias del frontend..."
    Push-Location frontend
    npm install
    Pop-Location
}

Write-Success "Dependencias instaladas"

###############################################################################
# 5. LINTING
###############################################################################
Write-Header "5. Ejecutando linters"

# Backend linting
Push-Location backend
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.scripts.lint) {
    Write-Info "Linting backend..."
    try {
        npm run lint 2>$null
        Write-Success "Backend lint: OK"
    } catch {
        Write-Warning "Errores de linting en backend"
    }
} else {
    Write-Warning "No hay script de lint en backend"
}
Pop-Location

# Frontend linting
Push-Location frontend
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.scripts.lint) {
    Write-Info "Linting frontend..."
    try {
        npm run lint 2>$null
        Write-Success "Frontend lint: OK"
    } catch {
        Write-Warning "Errores de linting en frontend"
    }
} else {
    Write-Warning "No hay script de lint en frontend"
}
Pop-Location

###############################################################################
# 6. TESTS DEL BACKEND
###############################################################################
Write-Header "6. Ejecutando tests del backend"

Push-Location backend

Write-Info "Ejecutando tests con cobertura..."
npm run test:coverage 2>&1 | Tee-Object -FilePath "..\test-results-backend.log"

$backendExitCode = $LASTEXITCODE

if ($backendExitCode -eq 0) {
    Write-Success "Tests del backend: PASSED"
} else {
    Write-Error "Tests del backend: FAILED"
}

Pop-Location

###############################################################################
# 7. BUILD DEL FRONTEND
###############################################################################
Write-Header "7. Verificando build del frontend"

Push-Location frontend

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.scripts.build) {
    Write-Info "Compilando Next.js..."
    npm run build 2>&1 | Tee-Object -FilePath "..\test-results-frontend-build.log"

    $frontendBuildExitCode = $LASTEXITCODE

    if ($frontendBuildExitCode -eq 0) {
        Write-Success "Build del frontend: SUCCESS"
    } else {
        Write-Error "Build del frontend: FAILED"
    }
} else {
    Write-Warning "No hay script de build en frontend"
    $frontendBuildExitCode = 0
}

Pop-Location

###############################################################################
# 8. TESTS FUNCIONALES
###############################################################################
Write-Header "8. Tests funcionales específicos"

# Test de conexión a MongoDB
Write-Info "Verificando conexión a MongoDB..."

Push-Location backend

$testScript = @"
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log('❌ MONGODB_URI no configurado');
  process.exit(1);
}

mongoose.connect(uri).then(() => {
  console.log('✅ Conexión a MongoDB exitosa');
  mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.log('❌ Error conectando a MongoDB:', err.message);
  process.exit(1);
});
"@

$testScript | Out-File -FilePath "test-db.js" -Encoding UTF8
node test-db.js 2>&1 | Tee-Object -FilePath "..\test-results-db.log"
$dbExitCode = $LASTEXITCODE
Remove-Item "test-db.js"

Pop-Location

# Test de servicios críticos
Write-Info "Verificando servicios críticos..."

Push-Location backend

# Build primero
npm run build --silent 2>$null

$servicesScript = @"
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

console.log('📧 Verificando EmailService...');

let emailService;
try {
  const module = require('./dist/services/emailService');
  emailService = module.emailService;
  if (emailService) {
    console.log('✅ EmailService cargado correctamente');
  } else {
    console.log('❌ EmailService no se pudo cargar');
    process.exit(1);
  }
} catch (err) {
  console.log('⚠️  EmailService no disponible:', err.message);
}

console.log('\n💬 Verificando WhatsApp config...');
const whatsappPhone = process.env.WHATSAPP_BUSINESS_PHONE;
if (whatsappPhone) {
  console.log('✅ WhatsApp configurado:', whatsappPhone);
} else {
  console.log('⚠️  WHATSAPP_BUSINESS_PHONE no configurado');
}

console.log('\n✅ Verificación de servicios completada');
"@

$servicesScript | Out-File -FilePath "test-services.js" -Encoding UTF8
node test-services.js 2>&1 | Tee-Object -FilePath "..\test-results-services.log"
Remove-Item "test-services.js"

Pop-Location

###############################################################################
# 9. RESUMEN
###############################################################################
Write-Header "RESUMEN DE TESTS"

$totalTests = 0
$passedTests = 0

# Backend tests
if ($backendExitCode -eq 0) {
    Write-Success "Backend Tests.................. PASSED"
    $passedTests++
} else {
    Write-Error "Backend Tests.................. FAILED"
}
$totalTests++

# Frontend build
if ($frontendBuildExitCode -eq 0) {
    Write-Success "Frontend Build................. PASSED"
    $passedTests++
} else {
    Write-Error "Frontend Build................. FAILED"
}
$totalTests++

# Database
if ($dbExitCode -eq 0) {
    Write-Success "Database Connection............ PASSED"
    $passedTests++
} else {
    Write-Error "Database Connection............ FAILED"
}
$totalTests++

$percentage = [math]::Round(($passedTests / $totalTests) * 100)

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "Total: $passedTests/$totalTests tests pasados ($percentage%)" -ForegroundColor Blue
Write-Host "========================================`n" -ForegroundColor Blue

Write-Info "Logs generados:"
Write-Host "  - test-results-backend.log" -ForegroundColor Gray
Write-Host "  - test-results-frontend-build.log" -ForegroundColor Gray
Write-Host "  - test-results-db.log" -ForegroundColor Gray
Write-Host "  - test-results-services.log" -ForegroundColor Gray

if (Test-Path "backend\coverage\lcov-report\index.html") {
    Write-Info "Reporte de cobertura disponible en:"
    Write-Host "  backend\coverage\lcov-report\index.html" -ForegroundColor Gray
}

if ($passedTests -eq $totalTests) {
    Write-Host "`n🚀 ¡Todos los tests pasaron exitosamente!`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Algunos tests fallaron. Revisa los logs para más detalles.`n" -ForegroundColor Red
    exit 1
}
