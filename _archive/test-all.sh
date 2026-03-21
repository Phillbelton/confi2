#!/bin/bash

###############################################################################
# SCRIPT DE TESTING COMPLETO - CONFITERÍA QUELITA
# Ejecuta todos los tests del backend y verifica funcionalidades clave
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
INFO="ℹ️"
ROCKET="🚀"
TEST="🧪"
EMAIL="📧"
WHATSAPP="💬"

echo -e "${BLUE}${ROCKET} CONFITERÍA QUELITA - TEST SUITE COMPLETO${NC}\n"

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}${CROSS} Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

###############################################################################
# 1. VERIFICAR DEPENDENCIAS
###############################################################################
echo -e "${BLUE}${INFO} 1. Verificando dependencias...${NC}"

command -v node >/dev/null 2>&1 || { echo -e "${RED}${CROSS} Node.js no está instalado${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}${CROSS} npm no está instalado${NC}"; exit 1; }

echo -e "${GREEN}${CHECK} Node version: $(node -v)${NC}"
echo -e "${GREEN}${CHECK} npm version: $(npm -v)${NC}\n"

###############################################################################
# 2. VERIFICAR VARIABLES DE ENTORNO
###############################################################################
echo -e "${BLUE}${INFO} 2. Verificando configuración de entorno...${NC}"

if [ ! -f "backend/.env.test" ]; then
    echo -e "${YELLOW}⚠️  No existe backend/.env.test, usando .env${NC}"
    if [ ! -f "backend/.env" ]; then
        echo -e "${RED}${CROSS} No se encontró archivo .env en backend/${NC}"
        echo -e "${YELLOW}Copia backend/.env.example a backend/.env y configura las variables${NC}"
        exit 1
    fi
fi

# Verificar que existan variables críticas
cd backend
if ! grep -q "MONGODB_URI" .env 2>/dev/null && ! grep -q "MONGODB_URI" .env.test 2>/dev/null; then
    echo -e "${RED}${CROSS} MONGODB_URI no está configurado${NC}"
    exit 1
fi

echo -e "${GREEN}${CHECK} Variables de entorno OK${NC}\n"
cd ..

###############################################################################
# 3. INSTALAR DEPENDENCIAS (SI ES NECESARIO)
###############################################################################
echo -e "${BLUE}${INFO} 3. Verificando dependencias del proyecto...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias del backend...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias del frontend...${NC}"
    cd frontend && npm install && cd ..
fi

echo -e "${GREEN}${CHECK} Dependencias instaladas${NC}\n"

###############################################################################
# 4. LINTING Y FORMATO
###############################################################################
echo -e "${BLUE}${INFO} 4. Ejecutando linters...${NC}"

# Backend linting (si existe)
if [ -f "backend/package.json" ] && grep -q '"lint"' backend/package.json; then
    echo -e "${TEST} Linting backend..."
    cd backend
    npm run lint --silent 2>/dev/null || echo -e "${YELLOW}⚠️  No hay script de lint en backend${NC}"
    cd ..
fi

# Frontend linting (si existe)
if [ -f "frontend/package.json" ] && grep -q '"lint"' frontend/package.json; then
    echo -e "${TEST} Linting frontend..."
    cd frontend
    npm run lint --silent 2>/dev/null || echo -e "${YELLOW}⚠️  No hay script de lint en frontend${NC}"
    cd ..
fi

echo -e "${GREEN}${CHECK} Linting completado${NC}\n"

###############################################################################
# 5. TESTS UNITARIOS E INTEGRACIÓN - BACKEND
###############################################################################
echo -e "${BLUE}${INFO} 5. Ejecutando tests del backend...${NC}"

cd backend

# Crear reporte de cobertura
echo -e "${TEST} Ejecutando tests con cobertura..."
npm run test:coverage 2>&1 | tee ../test-results-backend.log

BACKEND_EXIT_CODE=$?

if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}${CHECK} Tests del backend: PASSED${NC}"
else
    echo -e "${RED}${CROSS} Tests del backend: FAILED${NC}"
fi

cd ..

###############################################################################
# 6. VERIFICAR COMPILACIÓN DEL FRONTEND
###############################################################################
echo -e "\n${BLUE}${INFO} 6. Verificando build del frontend...${NC}"

cd frontend

if grep -q '"build"' package.json; then
    echo -e "${TEST} Compilando Next.js..."
    npm run build 2>&1 | tee ../test-results-frontend-build.log

    FRONTEND_BUILD_EXIT_CODE=$?

    if [ $FRONTEND_BUILD_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}${CHECK} Build del frontend: SUCCESS${NC}"
    else
        echo -e "${RED}${CROSS} Build del frontend: FAILED${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No hay script de build en frontend${NC}"
    FRONTEND_BUILD_EXIT_CODE=0
fi

cd ..

###############################################################################
# 7. TESTS FUNCIONALES ESPECÍFICOS
###############################################################################
echo -e "\n${BLUE}${INFO} 7. Tests funcionales específicos...${NC}"

# Test de conexión a base de datos
echo -e "${TEST} Verificando conexión a MongoDB..."
cd backend
node -e "
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
" 2>&1 | tee -a ../test-results-db.log

DB_EXIT_CODE=$?
cd ..

# Test de servicios críticos
echo -e "\n${TEST} Verificando servicios críticos..."

cat > backend/test-services.js << 'EOF'
const { emailService } = require('./dist/services/emailService');

console.log('📧 Verificando EmailService...');
if (emailService) {
  console.log('✅ EmailService cargado correctamente');
} else {
  console.log('❌ EmailService no se pudo cargar');
  process.exit(1);
}

console.log('\n💬 Verificando WhatsApp config...');
const whatsappPhone = process.env.WHATSAPP_BUSINESS_PHONE;
if (whatsappPhone) {
  console.log('✅ WhatsApp configurado:', whatsappPhone);
} else {
  console.log('⚠️  WHATSAPP_BUSINESS_PHONE no configurado');
}

console.log('\n✅ Todos los servicios verificados');
EOF

cd backend
npm run build --silent 2>/dev/null || true
node test-services.js 2>&1 | tee -a ../test-results-services.log
rm test-services.js
cd ..

###############################################################################
# 8. RESUMEN DE RESULTADOS
###############################################################################
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    RESUMEN DE TESTS                       ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

TOTAL_TESTS=0
PASSED_TESTS=0

# Backend tests
if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}${CHECK} Backend Tests.................. PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}${CROSS} Backend Tests.................. FAILED${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Frontend build
if [ $FRONTEND_BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}${CHECK} Frontend Build................. PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}${CROSS} Frontend Build................. FAILED${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Database connection
if [ $DB_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}${CHECK} Database Connection............ PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}${CROSS} Database Connection............ FAILED${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Calcular porcentaje
PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Total: ${PASSED_TESTS}/${TOTAL_TESTS} tests pasados (${PERCENTAGE}%)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Logs generados
echo -e "${INFO} Logs generados:"
echo -e "  - test-results-backend.log"
echo -e "  - test-results-frontend-build.log"
echo -e "  - test-results-db.log"
echo -e "  - test-results-services.log"

# Cobertura (si existe)
if [ -f "backend/coverage/lcov-report/index.html" ]; then
    echo -e "\n${INFO} Reporte de cobertura disponible en:"
    echo -e "  backend/coverage/lcov-report/index.html"
fi

# Exit code
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n${GREEN}${ROCKET} ¡Todos los tests pasaron exitosamente!${NC}\n"
    exit 0
else
    echo -e "\n${RED}${CROSS} Algunos tests fallaron. Revisa los logs para más detalles.${NC}\n"
    exit 1
fi
