#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

# Source common functions
source ./common.sh

log_info "🚀 Terraform Apply"
log_info "=================="

# Check if plan file exists
check_plan_exists

# Show plan summary (limited output to avoid broken pipe)
log_info "📋 Plan summary (first 10 lines):"
run_terraform show -no-color tfplan

# Ask for confirmation
if ! confirm_action "Do you want to apply this plan?"; then
    log_error "❌ Apply cancelled"
    exit 1
fi

# Apply the plan
log_info "🏗️  Applying terraform plan..."
if run_terraform apply tfplan; then
    # Clean up plan file after successful apply
    rm -f tfplan

    log_info "📊 Deployment completed! Getting instance information..."
    show_deployment_summary
else
    echo ""
    log_error "❌ Terraform apply failed!"
    log_warning "Plan file preserved for troubleshooting."
    exit 1
fi
