# 🚀 Production Deployment Checklist - Development to Production

## 📋 Database Changes Audit

### 🔍 Changes Made in Development Branch

#### 1. **bc_drwskincare_plus_verified Table**
**New Column Added:**
```sql
ALTER TABLE bc_drwskincare_plus_verified 
ADD COLUMN alamat_detail TEXT NULL;

COMMENT ON COLUMN bc_drwskincare_plus_verified.alamat_detail 
IS 'Detailed address information including street, RT/RW, house number, landmarks, etc.';
```

**Purpose**: Store detailed address information from the new address form
**Type**: TEXT (supports long address strings)
**Nullable**: Yes (backwards compatibility)
**Impact**: Low risk - only adds new optional field

### 🗄️ Prisma Schema Changes
```prisma
model bc_drwskincare_plus_verified {
  // ... existing fields
  kode_pos            String?              @db.VarChar(10)
  alamat_detail       String?              @db.Text        // 🆕 NEW
  // ... relations
}
```

## 📋 Step-by-Step Production Migration Plan

### Phase 1: Pre-Migration Preparation 🛡️

#### Step 1.1: Database Backup
```bash
# 1. Create full database backup
pg_dump -h [production_host] -U [username] -d [database_name] > backup_pre_alamat_detail_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup integrity
pg_restore --list backup_pre_alamat_detail_*.sql | head -20
```

#### Step 1.2: Test Migration on Staging
```sql
-- Create staging copy of production data
-- Test the migration script
ALTER TABLE bc_drwskincare_plus_verified 
ADD COLUMN alamat_detail TEXT NULL;

-- Verify column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus_verified' 
  AND column_name = 'alamat_detail';
```

### Phase 2: Production Migration 🎯

#### Step 2.1: Maintenance Mode (Optional)
- Put application in maintenance mode if needed
- This change is backwards compatible, so maintenance mode may not be required

#### Step 2.2: Execute Database Migration
```sql
-- Production Migration Script
BEGIN;

-- Add alamat_detail column
ALTER TABLE bc_drwskincare_plus_verified 
ADD COLUMN alamat_detail TEXT NULL;

-- Add column comment
COMMENT ON COLUMN bc_drwskincare_plus_verified.alamat_detail 
IS 'Detailed address information including street, RT/RW, house number, landmarks, etc.';

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  col_description(pgc.oid, pgc.attnum) as column_comment
FROM information_schema.columns isc
LEFT JOIN pg_class pgt ON pgt.relname = isc.table_name
LEFT JOIN pg_attribute pgc ON pgc.attrelid = pgt.oid AND pgc.attname = isc.column_name
WHERE isc.table_name = 'bc_drwskincare_plus_verified' 
  AND isc.column_name = 'alamat_detail';

-- Only commit if verification passes
COMMIT;
```

#### Step 2.3: Deploy Application Code
```bash
# 1. Deploy new code to production
git checkout production
git merge development

# 2. Install dependencies
npm ci

# 3. Generate Prisma client with new schema
npx prisma generate

# 4. Build application
npm run build

# 5. Restart application server
npm run start
```

#### Step 2.4: Verify Deployment
- Check application starts without errors
- Test /plus/verified page functionality
- Verify new alamat_detail field can save data
- Check API logs for any errors

### Phase 3: Post-Migration Validation ✅

#### Step 3.1: Functional Testing
1. **Address Form Testing**:
   - Navigate to `/plus/verified`
   - Click "Edit Data"
   - Select address components (provinsi, kabupaten, kecamatan, desa)
   - Verify alamat detail auto-fills
   - Save form
   - Verify data persists in database

2. **Database Verification**:
```sql
-- Check if alamat_detail column is working
SELECT id, nama, alamat_detail 
FROM bc_drwskincare_plus_verified 
WHERE alamat_detail IS NOT NULL 
LIMIT 5;
```

#### Step 3.2: Performance Check
- Monitor application performance
- Check database query performance
- Verify no regressions in existing functionality

#### Step 3.3: User Acceptance Testing
- Test with real user accounts
- Verify all existing features still work
- Confirm new address functionality works as expected

## ⚠️ Risk Assessment

### Low Risk ✅
- **Adding new optional column**: Backwards compatible
- **TEXT field type**: No constraints, flexible storage
- **NULL allowed**: Doesn't break existing records

### Mitigation Strategies 🛡️
1. **Rollback Plan**: Keep database backup ready
2. **Gradual Rollout**: Deploy to staging first
3. **Monitoring**: Watch for errors in application logs
4. **Quick Fix**: Code can work without alamat_detail if needed

## 📞 Emergency Contacts & Rollback

### If Something Goes Wrong:
1. **Check application logs** for errors
2. **Check database connectivity**
3. **Rollback database** if needed:
```sql
-- Emergency rollback (if absolutely necessary)
ALTER TABLE bc_drwskincare_plus_verified 
DROP COLUMN alamat_detail;
```
4. **Rollback code deployment** to previous version

## ✅ Success Criteria
- [ ] Database migration completes without errors
- [ ] Application starts successfully
- [ ] Address form loads and functions correctly
- [ ] Data saves to alamat_detail column
- [ ] All existing functionality remains intact
- [ ] No performance degradation

---

**Next Action**: Ready to proceed with Step 1.1 (Database Backup) when you confirm!