# Database Trigger Fix: Allow Admin Manual Loyalty Updates

## 🎯 Problem Statement

Admin tidak dapat melakukan manual update loyalty points karena database trigger `validate_coin_not_exceed_loyalty()` mencegah operasi update pada table `members` ketika `coin > loyalty_point`.

**Error yang muncul:**
```
Error: Coin (1009432) cannot exceed loyalty_point (9432). Member ID: 9
```

## 🔍 Root Cause Analysis

### Current Database State:
- Member ID 9 memiliki **coin: 1,009,432** dan **loyalty_point: 9,432**
- Trigger `trigger_validate_coin_loyalty_ratio` berjalan **BEFORE UPDATE** pada table `members`
- Trigger memanggil function `validate_coin_not_exceed_loyalty()` yang strict validation

### Trigger Logic (Sebelum Fix):
```sql
IF NEW.coin > NEW.loyalty_point THEN
    RAISE EXCEPTION 'Coin (%) cannot exceed loyalty_point (%). Member ID: %', 
                    NEW.coin, NEW.loyalty_point, NEW.id;
END IF;
```

## 🛠️ Solution Implementation

### Strategy: Smart Trigger Logic
Update trigger untuk membedakan antara:
1. **Admin Manual Operations** - Allow loyalty_point only changes
2. **System Operations** - Allow synchronized coin + loyalty changes  
3. **Coin-only Operations** - Maintain strict validation

### Key Changes:
- ✅ Allow admin manual loyalty updates (coin unchanged)
- ✅ Allow system sync operations (both coin + loyalty change)
- ✅ Maintain protection against coin-only increases
- ✅ Add audit logging for admin manual changes

## 📋 Deployment Steps

### Pre-Deployment Checklist:
- [ ] **Backup Database:** Full PostgreSQL dump
- [ ] **Test Environment:** Apply fix to staging first
- [ ] **Maintenance Window:** Schedule deployment during low-traffic time
- [ ] **Rollback Plan:** Prepare rollback script

### 1. Connect to Production Database
```bash
psql -h 213.190.4.159 -p 5432 -U berkomunitas -d berkomunitas_db_dev
```

### 2. Verify Current Trigger Status
```sql
SELECT 
    trigger_name,
    table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE table_name = 'members' 
  AND trigger_name = 'trigger_validate_coin_loyalty_ratio';
```

### 3. Apply the Fix
Execute: `fix-loyalty-trigger-for-admin-manual.sql`

### 4. Verify Fix Applied
```sql
-- Check trigger function source
SELECT prosrc FROM pg_proc WHERE proname = 'validate_coin_not_exceed_loyalty';
```

### 5. Test Admin Manual Operation
```sql
-- Test loyalty increase (should work now)
UPDATE members SET loyalty_point = loyalty_point + 1000 WHERE id = 9;
```

## 🧪 Testing Scenarios

### ✅ Should WORK After Fix:
1. **Admin manual loyalty increase:**
   ```sql
   UPDATE members SET loyalty_point = loyalty_point + 5000 WHERE id = 9;
   ```

2. **Admin manual loyalty decrease:**
   ```sql
   UPDATE members SET loyalty_point = loyalty_point - 1000 WHERE id = 9;
   ```

3. **System sync operations:**
   ```sql
   UPDATE members SET coin = coin + 1000, loyalty_point = loyalty_point + 1000 WHERE id = 9;
   ```

### ❌ Should FAIL After Fix (Protection Maintained):
1. **Coin-only increase that exceeds loyalty:**
   ```sql
   UPDATE members SET coin = coin + 1000000 WHERE id = 9;
   ```

## 📊 Monitoring & Verification

### Check Problem Members:
```sql
SELECT 
    id,
    nama_lengkap,
    loyalty_point,
    coin,
    (coin - loyalty_point) as coin_excess
FROM members 
WHERE coin > loyalty_point
ORDER BY (coin - loyalty_point) DESC;
```

### Monitor Admin Manual Activities:
```sql
SELECT 
    lph.member_id,
    m.nama_lengkap,
    lph.event,
    lph.point,
    lph.created_at
FROM loyalty_point_history lph
JOIN members m ON m.id = lph.member_id
WHERE lph.event LIKE '%Admin Manual%'
ORDER BY lph.created_at DESC
LIMIT 20;
```

## 🔄 Rollback Plan

If issues arise, restore original trigger:

```sql
CREATE OR REPLACE FUNCTION validate_coin_not_exceed_loyalty()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.coin > NEW.loyalty_point THEN
        RAISE EXCEPTION 'Coin (%) cannot exceed loyalty_point (%). Member ID: %', 
                        NEW.coin, NEW.loyalty_point, NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🚀 Future Considerations

### Phase 2: Separate Coin & Loyalty Systems
This fix is temporary. Long-term plan:

1. **Create separate `member_coins` table**
2. **Create separate `member_loyalty_points` table**
3. **Remove coin/loyalty_point from `members` table**
4. **Update application logic to use separate tables**
5. **Remove triggers after migration**

### Benefits of Separation:
- ✅ Independent coin and loyalty management
- ✅ Better performance (no cross-validation)
- ✅ Cleaner audit trails
- ✅ Easier scaling and maintenance

## 📈 Success Metrics

### Immediate (After Fix):
- [ ] Admin can successfully add/subtract loyalty points
- [ ] No errors in admin loyalty management interface
- [ ] Trigger still protects against coin manipulation

### Long-term (After Phase 2):
- [ ] Complete coin/loyalty system separation
- [ ] Improved performance for loyalty operations
- [ ] Better audit and reporting capabilities

## 👥 Stakeholders

**Technical Contact:** Development Team  
**Business Owner:** Admin Operations  
**Database Admin:** Infrastructure Team  
**Testing:** QA Team  

## 📅 Timeline

- **Phase 1 (Immediate):** Apply trigger fix - 30 minutes
- **Phase 2 (Future):** Coin/Loyalty separation - 2-3 weeks
- **Testing:** 1-2 days per phase
- **Rollout:** Staged deployment with monitoring

---

**Status:** Ready for Production Deployment  
**Risk Level:** Low (maintains existing protections)  
**Estimated Downtime:** < 5 minutes  