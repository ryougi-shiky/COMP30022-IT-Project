#!/bin/bash
# Terraform Docker Configuration and Common Functions

# Configuration
TERRAFORM_IMAGE="hashicorp/terraform:1.5"
GCLOUD_CONFIG_PATH="$HOME/.config/gcloud"
WORKSPACE_PATH="/workspace"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}$1${NC}"
}

log_success() {
    echo -e "${GREEN}$1${NC}"
}

log_warning() {
    echo -e "${YELLOW}$1${NC}"
}

log_error() {
    echo -e "${RED}$1${NC}"
}

# Docker run function for terraform commands
run_terraform() {
    # Try multiple authentication methods
    local auth_method=""
    local docker_args=""

    # Method 1: Check for application default credentials
    local creds_file="$HOME/.config/gcloud/application_default_credentials.json"
    if [ -f "$creds_file" ]; then
        auth_method="application_default"
        docker_args="-v $HOME/.config/gcloud:/root/.config/gcloud:ro -e GOOGLE_APPLICATION_CREDENTIALS=/root/.config/gcloud/application_default_credentials.json"
    else
        # Method 2: Use gcloud credentials directly
        local access_token=$(gcloud auth print-access-token 2>/dev/null)
        if [ -n "$access_token" ] && [ "$access_token" != "" ]; then
            auth_method="access_token"
            docker_args="-e GOOGLE_OAUTH_ACCESS_TOKEN=$access_token"
        else
            log_error "❌ No valid GCP credentials found!"
            log_info "   Please try one of the following:"
            log_info "   1. gcloud auth login"
            log_info "   2. gcloud auth application-default login"
            log_info "   3. Or ensure you're authenticated with GCP"
            exit 1
        fi
    fi

    # Only show auth method for non-output commands
    if [[ "$1" != "output" ]]; then
        log_info "🔐 Using authentication method: $auth_method"
    fi

    # Remove -it flag to avoid pipe issues
    docker run --rm \
        -v "$(pwd):$WORKSPACE_PATH" \
        -w $WORKSPACE_PATH \
        $docker_args \
        "$TERRAFORM_IMAGE" "$@"
}

# Pull terraform image if not exists
ensure_terraform_image() {
    if ! docker image inspect "$TERRAFORM_IMAGE" >/dev/null 2>&1; then
        log_info "📦 Pulling Terraform Docker image..."
        docker pull "$TERRAFORM_IMAGE"
    fi
}

# Check if terraform.tfvars is configured
check_tfvars_configured() {
    if grep -q "your-gcp-project-id" terraform.tfvars; then
        log_error "❌ Please configure terraform.tfvars with your actual GCP project ID"
        log_info "   Edit terraform.tfvars and replace 'your-gcp-project-id' with your project"
        exit 1
    fi
}

# Check if gcloud is authenticated
check_gcloud_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null 2>&1; then
        log_error "❌ Please authenticate with GCP first:"
        log_info "   gcloud auth login"
        log_info "   gcloud auth application-default login"
        exit 1
    fi
}

# Check if plan file exists
check_plan_exists() {
    if [ ! -f "tfplan" ]; then
        log_error "❌ No terraform plan file found!"
        log_info "   Please run './plan-gcp.sh' first to generate a plan"
        exit 1
    fi
}

# Check if terraform state exists
check_state_exists() {
    if [ ! -f "terraform.tfstate" ]; then
        log_warning "❌ No terraform state file found!"
        log_info "   Nothing to destroy."
        exit 0
    fi
}

# Common pre-flight checks
preflight_checks() {
    check_tfvars_configured
    check_gcloud_auth
    ensure_terraform_image
}

# Get terraform outputs safely
get_terraform_outputs() {
    local frontend_ip backend_ip database_ip app_url

    frontend_ip=$(run_terraform output -raw frontend_public_ip 2>/dev/null || echo "N/A")
    backend_ip=$(run_terraform output -raw backend_internal_ip 2>/dev/null || echo "N/A")
    database_ip=$(run_terraform output -raw database_internal_ip 2>/dev/null || echo "N/A")
    app_url=$(run_terraform output -raw application_url 2>/dev/null || echo "N/A")

    echo "frontend_ip=$frontend_ip"
    echo "backend_ip=$backend_ip"
    echo "database_ip=$database_ip"
    echo "app_url=$app_url"
}

# Display deployment summary
show_deployment_summary() {
    local outputs
    outputs=$(get_terraform_outputs)
    eval "$outputs"

    echo ""
    log_success "✅ Deployment Summary:"
    log_success "====================="
    log_info "Frontend Public IP:   $frontend_ip"
    log_info "Backend Internal IP:  $backend_ip"
    log_info "Database Internal IP: $database_ip"
    log_info "Application URL:      $app_url"
    echo ""
    log_info "📝 Next Steps:"
    log_info "1. Wait 5-10 minutes for all services to start"
    log_info "2. Access your application at: $app_url"
    log_info "3. Monitor logs: gcloud compute ssh forum-frontend --zone=us-central1-a"
    echo ""
    log_warning "💡 To destroy infrastructure: ./destroy-gcp.sh"
}

# Confirm action with user
confirm_action() {
    local message="$1"
    local default_no="${2:-true}"

    if [ "$default_no" = "true" ]; then
        read -p "🤔 $message (y/N): " -r
        [[ $REPLY =~ ^[Yy]$ ]]
    else
        read -p "🤔 $message (Y/n): " -r
        [[ ! $REPLY =~ ^[Nn]$ ]]
    fi
}
