#!/bin/bash

# Quick server test status checker

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

LOG_DIR="server/test-logs"

echo "=========================================="
echo "SERVER TEST STATUS"
echo "=========================================="
echo ""

# Check if logs exist
if [ ! -f "$LOG_DIR/latest-summary.txt" ]; then
    echo -e "${YELLOW}No test results found.${NC}"
    echo ""
    echo "Run tests with:"
    echo "  ./run-server-tests.sh"
    exit 0
fi

# Show summary
cat "$LOG_DIR/latest-summary.txt"

echo ""

# Check if there are errors
if [ -f "$LOG_DIR/latest-errors.log" ] && [ -s "$LOG_DIR/latest-errors.log" ]; then
    echo -e "${RED}  Tests have failures${NC}"
    echo ""
    echo "View errors:"
    echo "  ./view-server-errors.sh"
    echo "  cat $LOG_DIR/latest-errors.log"
else
    echo -e "${GREEN}  All tests passing${NC}"
fi

echo ""
echo "Last run: $(ls -lt $LOG_DIR/test-run-*.log 2>/dev/null | head -1 | awk '{print $6, $7, $8}')"
echo "=========================================="
