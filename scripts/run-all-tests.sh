#!/bin/bash

###############################################################################
# CONFITERÍA QUELITA - RUN ALL TESTS SCRIPT
#
# Executes all testing scripts and generates comprehensive report
# Usage: ./scripts/run-all-tests.sh
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Header
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🍬  CONFITERÍA QUELITA - TEST SUITE  🍬                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}\n"

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2

    if curl -s --head --request GET "$url" | grep "200\|404" > /dev/null; then
        echo -e "${GREEN}✓${NC} $name is running"
        return 0
    else
        echo -e "${RED}✗${NC} $name is NOT running"
        return 1
    fi
}

# Check services
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Checking Services${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

BACKEND_RUNNING=0
FRONTEND_RUNNING=0

if check_service "http://localhost:5000/health" "Backend"; then
    BACKEND_RUNNING=1
fi

if check_service "http://localhost:3000" "Frontend"; then
    FRONTEND_RUNNING=1
fi

echo ""

# Warnings if services not running
if [ $BACKEND_RUNNING -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Backend is not running. Start with:${NC}"
    echo -e "${YELLOW}   cd backend && npm run dev${NC}\n"
fi

if [ $FRONTEND_RUNNING -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Frontend is not running. Start with:${NC}"
    echo -e "${YELLOW}   cd frontend && npm run dev${NC}\n"
fi

# Ask user if they want to continue
if [ $BACKEND_RUNNING -eq 0 ] || [ $FRONTEND_RUNNING -eq 0 ]; then
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Exiting...${NC}"
        exit 1
    fi
fi

# Run test-all.js
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Running Test Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

node scripts/test-all.js
TEST_EXIT_CODE=$?

# Run test-report.js
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Generating HTML Report${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

node scripts/test-report.js
REPORT_EXIT_CODE=$?

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
fi

if [ $REPORT_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ HTML report generated: test-report.html${NC}"

    # Try to open report
    if command -v xdg-open &> /dev/null; then
        echo -e "${CYAN}Opening report in browser...${NC}"
        xdg-open test-report.html &
    elif command -v open &> /dev/null; then
        echo -e "${CYAN}Opening report in browser...${NC}"
        open test-report.html &
    elif command -v start &> /dev/null; then
        echo -e "${CYAN}Opening report in browser...${NC}"
        start test-report.html &
    else
        echo -e "${YELLOW}Open test-report.html manually in your browser${NC}"
    fi
else
    echo -e "${RED}✗ Failed to generate report${NC}"
fi

echo ""

# Exit with test exit code
exit $TEST_EXIT_CODE
