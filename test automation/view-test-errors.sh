#!/bin/bash

# Quick script to view test errors

LOG_DIR="client/test-logs"

echo "=========================================="
echo "TEST ERROR VIEWER"
echo "=========================================="
echo ""

# Check if logs exist
if [ ! -d "$LOG_DIR" ]; then
    echo "No test logs found. Run tests first:"
    echo "  ./run-client-tests.sh"
    exit 1
fi

# Show latest summary
if [ -f "$LOG_DIR/latest-summary.txt" ]; then
    echo "LATEST TEST SUMMARY:"
    echo "=========================================="
    cat "$LOG_DIR/latest-summary.txt"
    echo ""
fi

# Show latest errors
if [ -f "$LOG_DIR/latest-errors.log" ]; then
    echo "LATEST ERRORS:"
    echo "=========================================="
    cat "$LOG_DIR/latest-errors.log"
    echo ""
fi

# List all error files
echo "AVAILABLE ERROR LOGS:"
echo "=========================================="
ls -lht "$LOG_DIR"/*errors* 2>/dev/null | head -10

echo ""
echo "To view a specific log:"
echo "  cat $LOG_DIR/latest.log"
echo "  cat $LOG_DIR/latest-errors.log"
echo "  cat $LOG_DIR/<suite-name>-errors.txt"
