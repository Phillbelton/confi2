#!/bin/bash

###############################################################################
# CONFITERÍA QUELITA - SERVICE HEALTH CHECK
#
# Quick check of all required services before running tests
# Usage: ./scripts/check-services.sh
###############################################################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🍬 Confitería Quelita - Service Health Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

ALL_OK=true

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo -e "${GREEN}✓ ${VERSION}${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    ALL_OK=false
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    echo -e "${GREEN}✓ v${VERSION}${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    ALL_OK=false
fi

# Check MongoDB
echo -n "Checking MongoDB... "
if pgrep -x mongod > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
elif systemctl is-active --quiet mongodb 2>/dev/null; then
    echo -e "${GREEN}✓ Running (systemd)${NC}"
elif systemctl is-active --quiet mongod 2>/dev/null; then
    echo -e "${GREEN}✓ Running (systemd)${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo -e "  ${YELLOW}Start with: sudo systemctl start mongodb${NC}"
    ALL_OK=false
fi

# Check Backend
echo -n "Checking Backend (http://localhost:5000)... "
if curl -s --head --request GET http://localhost:5000/health | grep "200\|404" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo -e "  ${YELLOW}Start with: cd backend && npm run dev${NC}"
    ALL_OK=false
fi

# Check Frontend
echo -n "Checking Frontend (http://localhost:3000)... "
if curl -s --head --request GET http://localhost:3000 | grep "200\|404" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo -e "  ${YELLOW}Start with: cd frontend && npm run dev${NC}"
    ALL_OK=false
fi

# Check Backend dependencies
echo -n "Checking Backend dependencies... "
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo -e "  ${YELLOW}Install with: cd backend && npm install${NC}"
    ALL_OK=false
fi

# Check Frontend dependencies
echo -n "Checking Frontend dependencies... "
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo -e "  ${YELLOW}Install with: cd frontend && npm install${NC}"
    ALL_OK=false
fi

# Check Backend .env
echo -n "Checking Backend .env... "
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${YELLOW}⚠ Missing${NC}"
    echo -e "  ${YELLOW}Copy from: cp backend/.env.example backend/.env${NC}"
fi

# Check Frontend .env.local
echo -n "Checking Frontend .env.local... "
if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${YELLOW}⚠ Missing (optional)${NC}"
    echo -e "  ${YELLOW}Create if needed for custom config${NC}"
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✓ All critical services are ready!${NC}"
    echo -e "${GREEN}  You can run tests with: npm run test:all${NC}"
    exit 0
else
    echo -e "${RED}✗ Some services are not ready${NC}"
    echo -e "${YELLOW}  Fix the issues above before running tests${NC}"
    exit 1
fi
