#!/bin/bash

# TalentHive Client Test Runner - Errors Only
# Shows only test failures with relevant error details

echo "=========================================="
echo "TALENTHIVE CLIENT - TEST SUITE"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$SCRIPT_DIR/client"
LOG_DIR="$CLIENT_DIR/test-logs"
ERROR_SUMMARY="$LOG_DIR/error-summary.txt"

mkdir -p "$LOG_DIR"
> "$ERROR_SUMMARY"

# Function to run test and check for failures
run_test() {
    local test_name=$1
    local test_path=$2
    local log_file=$3
    
    echo -n "Testing $test_name... "
    
    # Run test from client directory
    local temp_log="$LOG_DIR/temp_$log_file"
    (cd "$CLIENT_DIR" && npm test -- "$test_path" --run) > "$temp_log" 2>&1
    
    # Check if test failed by looking for "failed" in output
    if grep -q "Test Files.*failed\|Tests.*failed" "$temp_log"; then
        echo -e "${RED}✗ FAILED${NC}"
        
        # Extract error summary
        echo "" >> "$ERROR_SUMMARY"
        echo "========================================" >> "$ERROR_SUMMARY"
        echo "FAILED: $test_name" >> "$ERROR_SUMMARY"
        echo "========================================" >> "$ERROR_SUMMARY"
        
        # Get failure count
        grep "Test Files.*failed\|Tests.*failed" "$temp_log" | tail -1 >> "$ERROR_SUMMARY"
        echo "" >> "$ERROR_SUMMARY"
        
        # Extract specific error messages (limit to first 30 lines of errors)
        grep -B 1 "TestingLibraryElementError\|Error:\|AssertionError" "$temp_log" | \
            grep -v "node_modules\|at Object\|at process\|⎯\|❯\|stderr" | \
            head -30 >> "$ERROR_SUMMARY" 2>/dev/null
        
        # Save full log
        mv "$temp_log" "$LOG_DIR/$log_file"
        echo "  → Full log: client/test-logs/$log_file"
        
        return 1
    else
        echo -e "${GREEN}✓ PASSED${NC}"
        rm "$temp_log"
        return 0
    fi
}

# Track results
total_tests=0
passed_tests=0
failed_tests=0
declare -a failed_suites

echo "Running tests (errors only mode)..."
echo ""

# Test suites with correct paths
tests=(
    "Authentication:src/test/auth.test.tsx:auth.log"
    "Profile:src/test/profile.test.tsx:profile.log"
    "Project:src/test/project.test.tsx:project.log"
    "Proposal:src/test/proposal.test.tsx:proposal.log"
    "Contract:src/test/contract.test.tsx:contract.log"
    "Payment:src/test/payment.test.tsx:payment.log"
    "Time Tracking:src/test/timeTracking.test.tsx:timetracking.log"
    "API Hooks:src/hooks/api/__tests__/hooks.test.ts:hooks.log"
    "API Services:src/services/api/__tests__/services.test.ts:services.log"
    "Socket:src/services/socket/__tests__/socket.test.ts:socket.log"
)

for test in "${tests[@]}"; do
    IFS=':' read -r name path log <<< "$test"
    total_tests=$((total_tests + 1))
    
    if run_test "$name" "$path" "$log"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
        failed_suites+=("$name")
    fi
done

# Summary
echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "Total: $total_tests | ${GREEN}Passed: $passed_tests${NC} | ${RED}Failed: $failed_tests${NC}"

if [ $failed_tests -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed Test Suites:${NC}"
    for suite in "${failed_suites[@]}"; do
        echo "  ✗ $suite"
    done
    echo ""
    echo -e "${YELLOW}Error Summary:${NC}"
    cat "$ERROR_SUMMARY"
    echo ""
    echo "Full logs: client/test-logs/"
else
    echo -e "\n${GREEN}All tests passed!${NC}"
    rm "$ERROR_SUMMARY"
fi

echo "=========================================="

[ $failed_tests -eq 0 ] && exit 0 || exit 1
