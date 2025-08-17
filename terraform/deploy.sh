#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

# Source common functions
source ./common.sh

log_info "🚀 Deployment Workflow"
log_info "======================"

log_info "Step 1: Running terraform plan..."
if ./plan.sh; then
    echo ""
    log_info "Step 2: Applying terraform plan..."
    ./apply.sh
else
    echo ""
    log_error "❌ Deployment stopped due to plan errors"
    exit 1
fi
