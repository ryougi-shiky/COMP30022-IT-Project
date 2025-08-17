#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

# Source common functions
source ./common.sh

log_info "🔍 Terraform Plan Check"
log_info "======================="

# Run pre-flight checks
preflight_checks

# Initialize Terraform
log_info "📦 Initializing Terraform..."
run_terraform init

# Run terraform plan
log_info "📋 Running terraform plan..."
if run_terraform plan -out=tfplan; then
    echo ""
    log_success "✅ Terraform plan completed successfully!"
    log_info "📄 Plan saved to 'tfplan' file"
    echo ""
    log_success "🚀 To apply these changes, run:"
    log_info "   ./apply.sh"
    echo ""
    log_info "🔍 To review the plan again:"
    log_info "   docker run --rm -v \"\$(pwd):/workspace\" -w /workspace $TERRAFORM_IMAGE show tfplan"
else
    echo ""
    log_error "❌ Terraform plan failed!"
    log_error "Please fix the errors above before proceeding."
    exit 1
fi
