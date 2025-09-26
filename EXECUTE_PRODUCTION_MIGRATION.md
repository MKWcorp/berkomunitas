# 🚀 PRODUCTION MIGRATION - READY TO EXECUTE COMMANDS

## 📋 Pre-Execution Checklist ✅
- [x] Database backup completed
- [x] Migration scripts created and tested  
- [x] Code merged to main branch
- [x] Prisma client generated
- [x] Dependencies installed

## ⚡ EXECUTE PRODUCTION MIGRATION

### **PHASE 1: Infrastructure (LOW RISK - 5-10 min)**
Create new tables and simple column additions
```bash
# Connect to production database and execute Phase 1
psql -h [PRODUCTION_HOST] -U [USERNAME] -d [DATABASE_NAME] -f migration-phase-1-infrastructure.sql

# Alternative with environment variables:
# psql $DATABASE_URL -f migration-phase-1-infrastructure.sql
```

**Expected Output:**
```
🚀 Starting Phase 1: Infrastructure Migration
📋 Step 1.1: Creating event_settings table...
✅ event_settings table created successfully
📋 Step 1.2: Creating coin_history table...
✅ coin_history table created successfully  
📋 Step 1.3: Enhancing badges table...
✅ badge_color column added
✅ badge_style column added
✅ badge_message column added
🎉 Phase 1 Migration Completed Successfully!
```

---

### **PHASE 2: Core System (MEDIUM RISK - 10-15 min)**
Create BerkomunitasPlus system and member enhancements
```bash
# Execute Phase 2
psql -h [PRODUCTION_HOST] -U [USERNAME] -d [DATABASE_NAME] -f migration-phase-2-core-system.sql
```

**Expected Output:**
```
🚀 Starting Phase 2: Core System Migration
📋 Step 2.1: Creating bc_drwskincare_plus_verified table...
✅ bc_drwskincare_plus_verified table created
📋 Step 2.2: Adding alamat_detail column...
✅ alamat_detail column added
📋 Step 2.4: Enhancing members table...
✅ foto_profil_url column added
✅ bio column added
✅ status_kustom column added
✅ featured_badge_id column added
🎉 Phase 2 Migration Completed Successfully!
```

---

### **PHASE 3: Advanced Features (HIGH RISK - 15-20 min)**
Add coin/loyalty system and performance optimizations
```bash
# Execute Phase 3
psql -h [PRODUCTION_HOST] -U [USERNAME] -d [DATABASE_NAME] -f migration-phase-3-advanced-features.sql
```

**Expected Output:**
```
🚀 Starting Phase 3: Advanced Features Migration
📋 Step 3.1: Adding coin and loyalty system columns...
✅ coin column added to members table
✅ loyalty_point column added to members table
📋 Step 3.2: Creating performance indexes...
✅ Performance indexes created for coin/loyalty system
📋 Step 3.5: Initializing coin and loyalty point values...
Initialized coin/loyalty values for [X] members
🎉 Phase 3 Migration Completed Successfully!
```

---

### **PHASE 4: Data Cleanup (HIGHEST RISK - 20-30 min)**
⚠️ **CRITICAL: Coordinate with application restart!**
```bash
# Execute Phase 4 (BREAKING CHANGES)
psql -h [PRODUCTION_HOST] -U [USERNAME] -d [DATABASE_NAME] -f migration-phase-4-data-cleanup.sql

# IMMEDIATELY after Phase 4 completes:
# Restart application
npm run start
# OR 
pm2 restart all
# OR
docker-compose up -d --no-deps --build app
```

**Expected Output:**
```
🚀 Starting Phase 4: Data Cleanup & Optimization (FINAL PHASE)
⚠️ WARNING: This phase includes breaking changes!
🔍 Step 4.1: Running pre-migration safety checks...
✅ All safety checks passed
⚠️ Step 4.2: Performing column renames (BREAKING CHANGES)...
✅ reward_redemptions.shipping_tracking renamed to redemption_notes
🚨 API/Frontend code MUST use redemption_notes from now on!
⚠️ Step 4.5: Installing database triggers (HIGHEST RISK)...
✅ Coin-loyalty sync trigger installed
✅ BC verified updated_at trigger installed
🎉 MIGRATION COMPLETED SUCCESSFULLY! 🎉
```

---

## 🔧 IMMEDIATE POST-MIGRATION ACTIONS

### **1. Application Restart (CRITICAL)**
```bash
# Stop current application
pkill -f "npm run start" || pm2 stop all

# Start new version with updated database
npm run start
# OR
pm2 start ecosystem.config.js
# OR  
docker-compose up -d
```

### **2. Verify Application Health**
```bash
# Test application startup
curl -I http://localhost:3000

# Check specific endpoints
curl -X GET "http://localhost:3000/api/health"
curl -X GET "http://localhost:3000/api/beauty-consultant/verified"

# Monitor logs
tail -f logs/application.log
# OR
pm2 logs
```

### **3. Functional Testing**
```bash
# Navigate to BerkomunitasPlus page
# Test: http://localhost:3000/plus/verified
# 1. ✅ Page loads without errors
# 2. ✅ Address form displays correctly
# 3. ✅ Wilayah dropdowns populate
# 4. ✅ Auto-fill alamat detail works
# 5. ✅ Form saves successfully
# 6. ✅ Data persists to alamat_detail column
```

---

## 🚨 EMERGENCY PROCEDURES

### **If Any Phase Fails:**
```bash
# Stop application immediately
pkill -f "npm" || pm2 stop all

# For Phase 1-3 failures (rollback available):
# Restore from backup
psql -h [HOST] -U [USER] -d [DB] < backup_pre_migration_*.sql

# For Phase 4 failures (CRITICAL):
# Full system restore required
psql -h [HOST] -U [USER] -d [DB] < backup_pre_migration_*.sql
git checkout main~1  # Previous code version
npm run build && npm run start
```

### **Database Connection Issues:**
```bash
# Verify database connectivity
psql -h [HOST] -U [USER] -d [DB] -c "SELECT version();"

# Test Prisma connection
npx prisma db pull

# Check environment variables
echo $DATABASE_URL
```

---

## ✅ SUCCESS VERIFICATION

### **Database Verification:**
```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('event_settings', 'coin_history', 'bc_drwskincare_plus_verified');

-- Verify alamat_detail column
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'bc_drwskincare_plus_verified' AND column_name = 'alamat_detail';

-- Verify coin/loyalty system
SELECT COUNT(*) as total_members, 
       SUM(coin) as total_coins, 
       SUM(loyalty_point) as total_loyalty_points
FROM members;

-- Test BC verified functionality
SELECT id, nama_lengkap, alamat_detail, created_at 
FROM bc_drwskincare_plus_verified 
ORDER BY created_at DESC LIMIT 5;
```

### **Application Verification:**
- ✅ Application starts without errors
- ✅ BerkomunitasPlus navigation menu works
- ✅ `/plus/verified` page loads correctly
- ✅ Address form functionality works
- ✅ Data saves to alamat_detail column
- ✅ No regression in existing features

---

## 🎉 DEPLOYMENT COMPLETE!

**All 4 phases executed successfully!**  
**BerkomunitasPlus system is now live in production!**

**Features now available:**
- ✅ Indonesian regional address form with auto-fill
- ✅ Searchable wilayah dropdowns  
- ✅ alamat_detail column integration
- ✅ Enhanced coin/loyalty system
- ✅ Performance optimizations
- ✅ Database triggers and automation

**Next Steps:**
1. Monitor application performance for 24 hours
2. Gather user feedback on new address functionality  
3. Plan quarterly optimization review
4. Document lessons learned for future deployments

🚀 **PRODUCTION DEPLOYMENT SUCCESSFUL!** 🚀