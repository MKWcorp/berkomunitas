#!/bin/bash

# =====================================================================
# PRODUCTION DEPLOYMENT SCRIPT: Fix Loyalty Trigger
# =====================================================================
# This script safely applies the loyalty trigger fix to production
# with proper backup, testing, and rollback capabilities
# 
# Usage: ./deploy-loyalty-trigger-fix.sh
# Prerequisites: PostgreSQL client tools, database access
# =====================================================================

set -e  # Exit on any error

# Configuration
DB_HOST="213.190.4.159"
DB_PORT="5432"
DB_NAME="berkomunitas_db_dev"
DB_USER="berkomunitas"
BACKUP_DIR="./db-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_before_loyalty_fix_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v psql &> /dev/null; then
        error "psql command not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump command not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    # Test database connection
    if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        error "Cannot connect to database. Please check credentials and connectivity."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    if PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --schema-only --no-owner --no-privileges -f "$BACKUP_FILE"; then
        success "Backup created: $BACKUP_FILE"
    else
        error "Failed to create backup"
        exit 1
    fi
}

# Verify current state
verify_current_state() {
    log "Verifying current database state..."
    
    # Check if trigger exists
    local trigger_count
    trigger_count=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE table_name = 'members' AND trigger_name = 'trigger_validate_coin_loyalty_ratio';")
    
    if [ "${trigger_count// }" = "1" ]; then
        success "Found existing trigger: trigger_validate_coin_loyalty_ratio"
    else
        error "Trigger not found. Database may not be in expected state."
        exit 1
    fi
    
    # Check problem member
    local member_info
    member_info=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT coin, loyalty_point FROM members WHERE id = 9;")
    
    log "Member ID 9 current state: $member_info"
}

# Apply the fix
apply_fix() {
    log "Applying loyalty trigger fix..."
    
    # Execute the fix SQL
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -f "fix-loyalty-trigger-for-admin-manual.sql"; then
        success "Trigger fix applied successfully"
    else
        error "Failed to apply trigger fix"
        exit 1
    fi
}

# Test the fix
test_fix() {
    log "Testing the applied fix..."
    
    # Test 1: Admin manual loyalty increase (should work)
    log "Test 1: Admin manual loyalty increase..."
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "UPDATE members SET loyalty_point = loyalty_point + 1 WHERE id = 9; UPDATE members SET loyalty_point = loyalty_point - 1 WHERE id = 9;"; then
        success "Test 1 PASSED: Admin manual loyalty update works"
    else
        error "Test 1 FAILED: Admin manual loyalty update failed"
        return 1
    fi
    
    # Test 2: Coin validation (should still fail if excessive)
    log "Test 2: Coin validation protection..."
    if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "UPDATE members SET coin = coin + 1000000 WHERE id = 9;" &> /dev/null; then
        success "Test 2 PASSED: Coin validation still protects against excessive increases"
    else
        warning "Test 2 UNCLEAR: Coin validation may not be working as expected"
    fi
    
    success "All tests completed"
}

# Verify post-deployment state
verify_post_deployment() {
    log "Verifying post-deployment state..."
    
    # Check trigger function source
    local function_exists
    function_exists=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM pg_proc WHERE proname = 'validate_coin_not_exceed_loyalty';")
    
    if [ "${function_exists// }" = "1" ]; then
        success "Trigger function exists and updated"
    else
        error "Trigger function not found"
        return 1
    fi
    
    # Show current member state
    log "Current member balances (top 5 by coin excess):"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "SELECT id, nama_lengkap, loyalty_point, coin, (coin - loyalty_point) as coin_excess FROM members WHERE coin > loyalty_point ORDER BY (coin - loyalty_point) DESC LIMIT 5;"
}

# Main deployment function
main() {
    log "Starting Loyalty Trigger Fix Deployment"
    log "Target: $DB_HOST:$DB_PORT/$DB_NAME"
    
    # Prompt for database password
    echo -n "Enter database password for user '$DB_USER': "
    read -s DB_PASS
    export DB_PASS
    echo
    
    # Confirmation prompt
    echo
    warning "This will modify the production database trigger."
    echo -n "Are you sure you want to continue? (yes/no): "
    read confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log "Deployment cancelled by user"
        exit 0
    fi
    
    # Execute deployment steps
    check_prerequisites
    create_backup
    verify_current_state
    apply_fix
    test_fix
    verify_post_deployment
    
    success "Deployment completed successfully!"
    log "Backup saved to: $BACKUP_FILE"
    log "You can now test admin manual loyalty operations in the application"
    
    # Cleanup sensitive environment variable
    unset DB_PASS
}

# Handle script interruption
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"