#!/bin/bash
# Cleanup old SSO migration documentation and test files

echo "Ì∑π Starting cleanup of old documentation and test files..."
echo ""

# Create backup folder first
mkdir -p ./archive_old_docs_$(date +%Y%m%d)

# List of files to delete
OLD_DOCS=(
  "CASCADE_DELETE_MIGRATION_SUCCESS.md"
  "CLERK_TO_SSO_MIGRATION_COMPLETE.md"
  "FINAL_MIGRATION_SUCCESS.md"
  "SSO_ALL_ERRORS_FIXED.md"
  "SSO_API_MIGRATION_PROGRESS.md"
  "SSO_COMPLETE_MIGRATION.md"
  "SSO_CRITICAL_FIX_SUMMARY.md"
  "SSO_DATABASE_MIGRATION_COMPLETE.md"
  "SSO_FINAL_CHECKLIST.md"
  "SSO_FINAL_COMPLETE_FIX.md"
  "SSO_FINAL_STATUS.md"
  "SSO_FINAL_SUMMARY.md"
  "SSO_FIX_COMPLETE_FINAL.md"
  "SSO_IMPLEMENTATION_SUMMARY.md"
  "SSO_LOGIN_GUIDE.md"
  "SSO_MIDDLEWARE_GUIDE.md"
  "SSO_MIGRATION_COMPLETE_FINAL.md"
  "SSO_MIGRATION_FINAL_COMPLETE_STATUS.md"
  "SSO_MIGRATION_FINAL_COMPLETE.md"
  "SSO_MIGRATION_LATEST_UPDATE.md"
  "SSO_MIGRATION_STATUS_COMPLETE.md"
  "SSO_NOTIFICATIONS_FIX.md"
  "SSO_README_FINAL.md"
  "SSO_REWARDS_FIX.md"
  "SSO_SETUP_README.md"
  "SSO_STATUS_VISUAL.txt"
  "SSO_TESTING_GUIDE.md"
  "LIB_FOLDER_STRUCTURE.md"
)

OLD_SCRIPTS=(
  "fix-login-issue.bat"
  "fix-login.js"
  "start-sso-test.bat"
  "start-sso-test.sh"
  "test-api-routes.js"
  "test-sso-fix.sh"
  "verify-sso-migration.sh"
)

OLD_BACKUPS=(
  "backup_members_structure_20251221_080259.sql"
  "backup_members_structure_20251221_080521.sql"
  "migration_cascade_delete_20251221_193513.log"
)

echo "Ì≥¶ Moving old documentation to archive..."
for file in "${OLD_DOCS[@]}"; do
  if [ -f "$file" ]; then
    echo "  ‚Üí Archiving: $file"
    mv "$file" "./archive_old_docs_$(date +%Y%m%d)/"
  fi
done

echo ""
echo "ÔøΩÔøΩ Moving old scripts to archive..."
for file in "${OLD_SCRIPTS[@]}"; do
  if [ -f "$file" ]; then
    echo "  ‚Üí Archiving: $file"
    mv "$file" "./archive_old_docs_$(date +%Y%m%d)/"
  fi
done

echo ""
echo "Ì≥¶ Moving old backups to archive..."
for file in "${OLD_BACKUPS[@]}"; do
  if [ -f "$file" ]; then
    echo "  ‚Üí Archiving: $file"
    mv "$file" "./archive_old_docs_$(date +%Y%m%d)/"
  fi
done

echo ""
echo "‚úÖ Cleanup complete!"
echo ""
echo "Ì≥Å Files kept (important):"
echo "  ‚úì README.md (will be updated)"
echo "  ‚úì SSO_READINESS_COMPARISON.md (current status)"
echo "  ‚úì SSO_QUICK_REFERENCE.md (developer reference)"
echo "  ‚úì All source code (src/, lib/, prisma/)"
echo ""
echo "Ì≥¶ Old files archived to: ./archive_old_docs_$(date +%Y%m%d)/"
echo "   (You can delete this folder after verifying everything works)"
echo ""
