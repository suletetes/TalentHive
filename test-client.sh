#!/bin/bash

# TalentHive Client Test Runner
# This script runs tests and captures detailed failure information

echo "=========================================="
echo "TALENTHIVE CLIENT - TEST SUITE"
echo "=========================================="
echo ""

# Colors for output (if terminal supports it)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p client/test-logs

# Function to run a test and capture results
run_test() {
    local test_name=$1
    local test_path=$2
    local log_file=$3
    
    echo "----------------------------------------"
    echo "Running: $test_name"
    echo "----------------------------------------"
    
    cd client && npm test -- "$test_path" --reporter=verbose --run 2>&1 | tee "test-logs/$log_file"
    local exit_code=${PIPESTATUS[0]}
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $test_name"
    else
        echo -e "${RED}✗ FAILED${NC}: $test_name (see test-logs/$log_file for details)"
    fi
    
    echo ""
    cd ..
    return $exit_code
}

# Track overall results
total_tests=0
passed_tests=0
failed_tests=0

# Run all test suites
echo "Starting test execution..."
echo ""

# 1. Authentication Tests
run_test "Authentication Tests" "src/test/auth.test.tsx" "auth.log"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1)) || failed_tests=$((failed_tests + 1))

# 2. Profile Tests
run_test "Profile Tests" "src/test/profile.test.tsx" "profile.log"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1)) || failed_tests=$((failed_tests + 1))

# 3. Project Tests
run_test "Project Tests" "src/test/project.test.tsx" "project.log"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1)) || failed_tests=$((failed_tests + 1))

# 4. Proposal Tests
run_test "Proposal Tests" "src/test/proposal.test.tsx" "proposal.log"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1)) || failed_tests=$((failed_tests + 1))

# 5. Contract Tests
run_test "Contract Tests" "src/test/contract.test.tsx" "contract.log"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1)) || failed_tests=$((failed_tests + 1))

# 6. Payment Tests
run_test "Payment Tests" "src/test/payment.test.tsx" "payment.log"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1)) || failed_tests=$((failed_tests + 1))

# 7. Time Tracking Tests
run_test "Time Tracking Tests" "src/test/timeTracking.test.tsx" "timetracking.log"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1)) || failed_tests=$((failed_tests + 1))

# 8. API Hooks Tests
run_test "API Hooks Tests" "src/hooks/api/__tests__/hooks.test.ts" "hooks.log"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1)) || failed_tests=$((failed_tests + 1))

# 9. Socket Tests
run_test "Socket Tests" "src/services/socket/__tests__/socket.test.ts" "socket.log"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1)) || failed_tests=$((failed_tests + 1))

# Summary
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "Total Test Suites: $total_tests"
echo -e "${GREEN}Passed: $passed_tests${NC}"
echo -e "${RED}Failed: $failed_tests${NC}"
echo ""
echo "Detailed logs saved in: client/test-logs/"
echo "=========================================="

# Exit with error if any tests failed
[ $failed_tests -eq 0 ] && exit 0 || exit 1
