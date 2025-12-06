#!/bin/bash

# TalentHive Client Test Runner with Error Filtering
# Runs all tests, creates detailed logs, and shows only failures

set -e

echo "=========================================="
echo "TALENTHIVE CLIENT - TEST RUNNER"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Setup directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$SCRIPT_DIR/client"
LOG_DIR="$CLIENT_DIR/test-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MAIN_LOG="$LOG_DIR/test-run-$TIMESTAMP.log"
ERROR_LOG="$LOG_DIR/errors-$TIMESTAMP.log"
SUMMARY_LOG="$LOG_DIR/summary-$TIMESTAMP.txt"

# Create log directory
mkdir -p "$LOG_DIR"

# Clear old logs (keep last 5 runs)
echo "Cleaning old logs..."
cd "$LOG_DIR"
ls -t test-run-*.log 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
ls -t errors-*.log 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
ls -t summary-*.txt 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
cd "$SCRIPT_DIR"

echo -e "${CYAN}Log files:${NC}"
echo "  Main log: $MAIN_LOG"
echo "  Errors:   $ERROR_LOG"
echo "  Summary:  $SUMMARY_LOG"
echo ""

# Initialize logs
> "$MAIN_LOG"
> "$ERROR_LOG"
> "$SUMMARY_LOG"

echo "========================================" | tee -a "$SUMMARY_LOG"
echo "TEST RUN: $(date)" | tee -a "$SUMMARY_LOG"
echo "========================================" | tee -a "$SUMMARY_LOG"
echo "" | tee -a "$SUMMARY_LOG"

# Run tests
echo -e "${YELLOW}Running all client tests...${NC}"
echo ""

cd "$CLIENT_DIR"

# Run tests and capture output
if npm test --run 2>&1 | tee "$MAIN_LOG"; then
    TEST_EXIT_CODE=0
else
    TEST_EXIT_CODE=$?
fi

cd "$SCRIPT_DIR"

# Parse results
echo ""
echo -e "${CYAN}Analyzing results...${NC}"
echo ""

# Extract test summary
TOTAL_SUITES=$(grep -o "Test Files.*" "$MAIN_LOG" | tail -1 || echo "")
TOTAL_TESTS=$(grep -o "Tests.*" "$MAIN_LOG" | tail -1 || echo "")

echo "$TOTAL_SUITES" | tee -a "$SUMMARY_LOG"
echo "$TOTAL_TESTS" | tee -a "$SUMMARY_LOG"
echo "" | tee -a "$SUMMARY_LOG"

# Check if there are failures
if grep -q "failed" "$MAIN_LOG"; then
    echo -e "${RED}❌ TESTS FAILED${NC}" | tee -a "$SUMMARY_LOG"
    echo "" | tee -a "$SUMMARY_LOG"
    
    # Extract failed test information
    echo "========================================" | tee -a "$ERROR_LOG"
    echo "FAILED TESTS DETAILS" | tee -a "$ERROR_LOG"
    echo "========================================" | tee -a "$ERROR_LOG"
    echo "" | tee -a "$ERROR_LOG"
    
    # Extract FAIL lines with context
    grep -B 2 -A 10 "FAIL\|TestingLibraryElementError\|ReferenceError\|TypeError\|Error:" "$MAIN_LOG" | \
        grep -v "node_modules\|at Object\|at process\|⎯\|❯\|stderr" | \
        head -100 >> "$ERROR_LOG" 2>/dev/null || true
    
    # Show failed test names
    echo -e "${RED}Failed Tests:${NC}" | tee -a "$SUMMARY_LOG"
    grep "FAIL.*test\\.tsx" "$MAIN_LOG" | sed 's/.*FAIL  /  ✗ /' | tee -a "$SUMMARY_LOG"
    echo "" | tee -a "$SUMMARY_LOG"
    
    # Show error summary
    echo -e "${YELLOW}Error Summary (first 30 lines):${NC}"
    head -30 "$ERROR_LOG"
    echo ""
    echo -e "${CYAN}Full error details in: $ERROR_LOG${NC}"
    
else
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}" | tee -a "$SUMMARY_LOG"
fi

echo "" | tee -a "$SUMMARY_LOG"
echo "========================================" | tee -a "$SUMMARY_LOG"
echo "LOGS SAVED TO:" | tee -a "$SUMMARY_LOG"
echo "  Main:   $MAIN_LOG" | tee -a "$SUMMARY_LOG"
echo "  Errors: $ERROR_LOG" | tee -a "$SUMMARY_LOG"
echo "  Summary: $SUMMARY_LOG" | tee -a "$SUMMARY_LOG"
echo "========================================" | tee -a "$SUMMARY_LOG"

# Create symlinks to latest logs
ln -sf "$(basename "$MAIN_LOG")" "$LOG_DIR/latest.log"
ln -sf "$(basename "$ERROR_LOG")" "$LOG_DIR/latest-errors.log"
ln -sf "$(basename "$SUMMARY_LOG")" "$LOG_DIR/latest-summary.txt"

echo ""
echo -e "${CYAN}Quick access:${NC}"
echo "  Latest log:    client/test-logs/latest.log"
echo "  Latest errors: client/test-logs/latest-errors.log"
echo "  Latest summary: client/test-logs/latest-summary.txt"
echo ""

# Exit with test exit code
exit $TEST_EXIT_CODE
