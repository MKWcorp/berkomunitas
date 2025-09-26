# 🚀 Production Migration Execution Guide

## 📋 Overview
This guide provides step-by-step instructions for executing the 4-phase database migration from development to production.

**Total Migration Time**: 50-75 minutes
**Complexity Level**: HIGH (15+ database changes)
**Risk Level**: MEDIUM-HIGH (breaking changes in Phase 4)

---

## ⚠️ CRITICAL PREREQUISITES

### 1. **Full Database Backup** (MANDATORY)
```bash
# Create timestamped backup
pg_dump -h [production_host] -U [username] -d [database_name] > \
  backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
pg_restore --list backup_pre_migration_*.sql | head -20
```

### 2. **Staging Environment Testing** (MANDATORY)
- [ ] All 4 migration scripts tested successfully in staging
- [ ] Application starts without errors after migration
- [ ] BerkomunitasPlus functionality verified
- [ ] Address form auto-fill works correctly
- [ ] No performance degradation observed

### 3. **Code Deployment Coordination** (CRITICAL)
- [ ] Frontend code ready with `redemption_notes` field updates
- [ ] API endpoints updated for new column names
- [ ] Prisma schema matches new database structure
- [ ] Build pipeline ready for immediate deployment

---

## 🎯 EXECUTION PLAN

### **Phase 1: Infrastructure** (Low Risk - 5-10 min)
**What**: Create new tables and simple column additions
**Risk**: LOW - No breaking changes
**Rollback**: Easy - Simple table drops

```bash
# Execute Phase 1
psql -h [host] -U [username] -d [database] -f migration-phase-1-infrastructure.sql

# Expected Output:
# ✅ event_settings table created
# ✅ coin_history table created  
# ✅ badges enhancements added
```

**Verification Steps:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('event_settings', 'coin_history');

-- Verify badge columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'badges' AND column_name LIKE 'badge_%';
```

---

### **Phase 2: Core System** (Medium Risk - 10-15 min)
**What**: Create BerkomunitasPlus system tables
**Risk**: MEDIUM - New FK relationships
**Rollback**: Moderate - FK constraint dependencies

```bash
# Execute Phase 2
psql -h [host] -U [username] -d [database] -f migration-phase-2-core-system.sql

# Expected Output:
# ✅ bc_drwskincare_plus_verified table created
# ✅ alamat_detail column added
# ✅ Members table enhanced
```

**Verification Steps:**
```sql
-- Verify BC table structure
\d bc_drwskincare_plus_verified

-- Test address functionality
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus_verified' 
AND column_name = 'alamat_detail';
```

---

### **Phase 3: Advanced Features** (High Risk - 15-20 min)
**What**: Add coin/loyalty system and performance indexes
**Risk**: HIGH - System-wide changes
**Rollback**: Difficult - Data initialization involved

```bash
# Execute Phase 3
psql -h [host] -U [username] -d [database] -f migration-phase-3-advanced-features.sql

# Expected Output:
# ✅ Coin/loyalty columns added
# ✅ Performance indexes created
# ✅ Data validation constraints added
```

**Verification Steps:**
```sql
-- Verify coin/loyalty system
SELECT coin, loyalty_point FROM members LIMIT 5;

-- Check constraints
SELECT constraint_name FROM information_schema.check_constraints 
WHERE constraint_name LIKE 'chk_members_%';
```

---

### **Phase 4: Data Cleanup** (Highest Risk - 20-30 min)
**What**: Column renames, triggers, final optimizations
**Risk**: HIGHEST - Breaking changes
**Rollback**: Very Difficult - Requires code rollback too

⚠️ **COORDINATE WITH CODE DEPLOYMENT** ⚠️

```bash
# Execute Phase 4 (ONLY after code is ready to deploy)
psql -h [host] -U [username] -d [database] -f migration-phase-4-data-cleanup.sql

# Expected Output:
# ✅ Column renames completed
# ✅ Triggers installed
# ✅ Final optimizations applied
```

**Immediate Actions After Phase 4:**
1. **Deploy Code Immediately** (within 5 minutes)
2. **Restart Application Servers**
3. **Generate New Prisma Client**
4. **Update Environment Variables**

---

## 🔧 POST-MIGRATION STEPS

### 1. **Application Deployment** (IMMEDIATE)
```bash
# Deploy new code
git checkout production
git merge development
npm ci
npx prisma generate
npm run build
npm run start
```

### 2. **Functionality Testing** (IMMEDIATE)
- [ ] Application starts successfully
- [ ] Navigate to `/plus/verified` 
- [ ] Test address form functionality
- [ ] Verify alamat_detail saving works
- [ ] Check coin/loyalty display
- [ ] Test existing features (no regressions)

### 3. **Performance Monitoring** (First 24 hours)
- [ ] Database query performance
- [ ] Application response times  
- [ ] Memory usage patterns
- [ ] Error rates in logs

### 4. **Data Validation** (First Week)
- [ ] New BerkomunitasPlus registrations work
- [ ] Address auto-fill functionality
- [ ] Coin/loyalty calculations accurate
- [ ] No data corruption detected

---

## 🚨 EMERGENCY PROCEDURES

### **If Phase 1-3 Fails:**
```sql
-- Rollback is relatively safe
-- Drop new tables if needed
DROP TABLE IF EXISTS coin_history CASCADE;
DROP TABLE IF EXISTS event_settings CASCADE;
DROP TABLE IF EXISTS bc_drwskincare_plus_verified CASCADE;

-- Restore from backup if necessary
```

### **If Phase 4 Fails:**
```bash
# CRITICAL: This may require full restore
# Stop application immediately
# Restore from backup
psql -h [host] -U [username] -d [database] < backup_pre_migration_*.sql

# Redeploy old code
git checkout production~1
npm run build
npm run start
```

### **If Application Won't Start After Migration:**
1. Check database connectivity
2. Verify all migrations completed successfully  
3. Regenerate Prisma client
4. Check environment variables
5. Review application logs for specific errors

---

## ✅ SUCCESS CRITERIA

### **Technical Validation:**
- [ ] All 4 migration phases completed without errors
- [ ] Application starts and runs normally
- [ ] Database queries execute within normal time ranges
- [ ] No data loss or corruption detected

### **Functional Validation:**
- [ ] BerkomunitasPlus menu navigation works
- [ ] Address form loads and functions correctly
- [ ] Auto-fill alamat_detail functionality works
- [ ] Data saves and retrieves properly
- [ ] Coin/loyalty system displays correctly

### **Performance Validation:**
- [ ] Page load times within acceptable ranges
- [ ] Database query performance stable
- [ ] No significant memory usage increases
- [ ] Error rates remain at baseline levels

---

## 📞 SUPPORT CONTACTS

**Database Issues:**
- Check PostgreSQL logs for specific errors
- Verify connection strings and credentials
- Monitor database performance metrics

**Application Issues:**
- Review Next.js application logs
- Check Prisma client connection status
- Verify API endpoint responses

**Emergency Rollback:**
- Execute database restore procedure
- Redeploy previous code version
- Update DNS/routing if necessary

---

## 📈 POST-DEPLOYMENT MONITORING

### **Week 1**: Intensive monitoring
- Daily database performance checks
- Application error rate monitoring
- User feedback on new functionality

### **Week 2-4**: Standard monitoring  
- Weekly performance reviews
- Monthly data integrity checks
- Quarterly optimization reviews

---

**🎉 READY TO EXECUTE? Follow the phases in order and coordinate Phase 4 with code deployment!**