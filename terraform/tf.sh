#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

# Source common functions
source ./common.sh

show_usage() {
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  plan      - Run terraform plan"
    echo "  apply     - Apply terraform plan"
    echo "  deploy    - Run plan then apply"
    echo "  destroy   - Destroy infrastructure"
    echo "  output    - Show terraform outputs"
    echo "  state     - Show terraform state"
    echo "  version   - Show terraform version"
    echo "  shell     - Open interactive terraform shell"
    echo ""
}

case "${1:-}" in
    "plan")
        ./plan.sh
        ;;
    "apply")
        ./apply.sh
        ;;
    "deploy")
        ./deploy.sh
        ;;
    "destroy")
        ./destroy.sh
        ;;
    "output")
        ensure_terraform_image
        log_info "📊 Terraform Outputs:"
        show_deployment_summary
        ;;
    "state")
        ensure_terraform_image
        log_info "📋 Terraform State:"
        run_terraform state list
        ;;
    "version")
        ensure_terraform_image
        run_terraform version
        ;;
    "shell")
        ensure_terraform_image
        log_info "🐚 Opening Terraform shell (exit with 'exit')..."
        docker run --rm -it \
            -v "$(pwd):$WORKSPACE_PATH" \
            -v "$GCLOUD_CONFIG_PATH:/root/.config/gcloud:ro" \
            -w $WORKSPACE_PATH \
            -e GOOGLE_APPLICATION_CREDENTIALS=/root/.config/gcloud/application_default_credentials.json \
            --entrypoint=/bin/sh \
            "$TERRAFORM_IMAGE"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
