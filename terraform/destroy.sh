#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

# Source common functions
source ./common.sh

log_warning "🗑️  Terraform Destroy"
log_warning "===================="

# Check if terraform state exists
check_state_exists

# Ensure we have the terraform image
ensure_terraform_image

# Show what will be destroyed
log_info "📋 Showing resources to be destroyed..."
run_terraform plan -destroy

echo ""
log_warning "⚠️  WARNING: This will permanently delete all GCP resources!"

# First confirmation
if ! confirm_action "Are you sure you want to destroy all resources?"; then
    log_error "❌ Destroy cancelled"
    exit 1
fi

# Final confirmation with exact text match
echo ""
read -p "🚨 Last chance! Type 'yes' to confirm destruction: " -r
if [[ "$REPLY" != "yes" ]]; then
    log_error "❌ Destroy cancelled"
    exit 1
fi

# Destroy infrastructure
log_warning "🏗️  Destroying infrastructure..."
if run_terraform destroy -auto-approve; then
    echo ""
    log_success "✅ Infrastructure destroyed successfully!"
    log_success "💰 All GCP resources have been removed and billing stopped."
else
    echo ""
    log_error "❌ Terraform destroy failed!"
    log_error "Some resources may still exist and incur charges."
    log_error "Please check the GCP console and resolve any issues."
    exit 1
fi
