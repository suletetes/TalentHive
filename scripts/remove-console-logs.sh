#!/bin/bash

# Script to remove console.log statements from frontend and backend
# Keeps console.error for error handling

echo " Removing console.log statements..."

# Backend - Remove console.log, console.info, console.debug, console.warn
# Keep console.error for error handling
find server/src/controllers -type f -name "*.ts" -exec sed -i '/console\.\(log\|info\|debug\|warn\)/d' {} +
find server/src/services -type f -name "*.ts" -exec sed -i '/console\.\(log\|info\|debug\|warn\)/d' {} +

# Frontend - Remove console.log, console.info, console.debug, console.warn
# Keep console.error for error handling
find client/src/pages -type f -name "*.tsx" -exec sed -i '/console\.\(log\|info\|debug\|warn\)/d' {} +
find client/src/components -type f -name "*.tsx" -exec sed -i '/console\.\(log\|info\|debug\|warn\)/d' {} +
find client/src/services -type f -name "*.ts" -exec sed -i '/console\.\(log\|info\|debug\|warn\)/d' {} +

echo "  Console statements removed!"
echo "Note: console.error statements were preserved for error handling"
