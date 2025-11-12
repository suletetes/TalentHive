#!/bin/bash

# Run individual server test suites with detailed error reporting

echo "=========================================="
echo "SERVER TEST SUITE RUNNER"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Setup
SERVER_DIR="server"
LOG_DIR="$SERVER_DIR/test-logs"
mkdir -p "$LOG_DIR"

# Test suites
declare -A TEST_SUITES=(
    ["auth"]="auth.test.ts"
    ["profile"]="profile.test.ts"
    ["project"]="project.test.ts"
    ["proposal"]="proposal.test.ts"
    ["contract"]="contract.test.ts"
    ["payment"]="payment.test.ts"
    ["timetracking"]="timeTracking.test.ts"
    ["organization"]="organization.test.ts"
    ["servicepackage"]="servicePackage.test.ts"
    ["middleware"]="middleware.test.ts"
)

# Function to run a single test suite
run_suite() {
    local name=$1
    local file=$2
    local log_file="$LOG_DIR/${name}-$(date +%Y%m%d_%H%M%S).log"
    local error_file="$LOG_DIR/${name}-errors.txt"
    
    echo -n "Testing ${name}... "
    
    # Run test
    cd "$SERVER_DIR"
    if npm test -- "$file" --verbose > "$log_file" 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        rm -f "$error_file"
        cd ..
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        
        # Extract errors
        > "$error_file"
        echo "========================================" >> "$error_file"
        echo "FAILED: $name" >> "$error_file"
        echo "========================================" >> "$error_file"
        
        # Get failure summary
        grep "Test Suites.*failed\|Tests.*failed\|FAIL" "$log_file" | head -5 >> "$error_file"
        echo "" >> "$error_file"
        
        # Get error details
        grep -B 2 -A 8 "FAIL\|Error:\|Expected\|Received\|●" "$log_file" | \
            grep -v "node_modules\|at Object\|at Promise" | \
            head -40 >> "$error_file" 2>/dev/null
        
        echo "  → See $log_file"
        echo "  → Errors in $error_file"
        
        cd ..
        return 1
    fi
}

# Track results
total=0
passed=0
failed=0
declare -a failed_suites

# Run all suites
for name in "${!TEST_SUITES[@]}"; do
    file="${TEST_SUITES[$name]}"
    total=$((total + 1))
    
    if run_suite "$name" "$file"; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        failed_suites+=("$name")
    fi
done

# Summary
echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo "Total: $total | ${GREEN}Passed: $passed${NC} | ${RED}Failed: $failed${NC}"

if [ $failed -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed Suites:${NC}"
    for suite in "${failed_suites[@]}"; do
        echo "  ✗ $suite"
        if [ -f "$LOG_DIR/${suite}-errors.txt" ]; then
            echo ""
            echo -e "${YELLOW}Errors from $suite:${NC}"
            head -20 "$LOG_DIR/${suite}-errors.txt"
            echo ""
        fi
    done
fi

echo ""
echo "All logs saved in: $LOG_DIR/"
echo "=========================================="

[ $failed -eq 0 ] && exit 0 || exit 1
