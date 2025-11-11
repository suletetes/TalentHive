#!/bin/bash

# TalentHive Client Test Runner - Errors Only
# This script runs tests and shows only failures with relevant error details

echo "=========================================="
echo "TALENTHIVE CLIENT - TEST SUITE"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p client/test-logs

# Error summary file
ERROR_SUMMARY="client/test-logs/error-summary.txt"
> "$ERROR_SUMMARY"

# Function to extract and display only errors
run_test() {
    local test_name=$1
    local test_path=$2
    local log_file=$3
    
    echo -n "Testing $test_name... "
    
    # Run test and capture output
    local temp_log="client/test-logs/temp_$log_file"
    cd client && npm test -- "$test_path" --reporter=verbose --run > "$temp_log" 2>&1
    local exit_code=$?
    cd ..
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        rm "$temp_log"
    else
        echo -e "${RED}✗ FAILED${NC}"
        
        # Extract only error information
        echo "" >> "$ERROR_SUMMARY"
        echo "========================================" >> "$ERROR_SUMMARY"
        echo "FAILED: $test_name" >> "$ERROR_SUMMARY"
        echo "========================================" >> "$ERROR_SUMMARY"
        
        # Extract FAIL lines and error messages
        grep -A 5 "FAIL\|Error:\|Expected\|Received\|AssertionError" "$temp_log" | \
            grep -v "node_modules\|at Object\|at process" >> "$ERROR_SUMMARY" 2>/dev/null
        
        # Save full log for reference
        mv "$temp_log" "client/test-logs/$log_file"
        
        echo "  → See client/test-logs/$log_file for full details"
    fi
    
    return $exit_code
}

# Track results
total_tests=0
passed_tests=0
failed_tests=0
declare -a failed_suites

echo "Running tests (errors only mode)..."
echo ""

# Test suites
tests=(
    "Authentication:src/test/auth.test.tsx:auth.log"
    "Profile:src/test/profile.test.tsx:profile.log"
    "Project:src/test/project.test.tsx:project.log"
    "Proposal:src/test/proposal.test.tsx:proposal.log"
    "Contract:src/test/contract.test.tsx:contract.log"
    "Payment:src/test/payment.test.tsx:payment.log"
    "Time Tracking:src/test/timeTracking.test.tsx:timetracking.log"
    "API Hooks:src/hooks/api/__tests__/hooks.test.ts:hooks.log"
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
