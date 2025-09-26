# Database Migration Documentation

## Migration: shipping_tracking → redemption_notes

**Date**: September 17, 2025  
**Type**: Column Rename  
**Table**: `reward_redemptions`  

### Changes Made

1. **Column Rename**: `shipping_tracking` → `redemption_notes`
   - **Data Type**: `VARCHAR(100)` (unchanged)
   - **Nullable**: `YES` (unchanged)
   - **Purpose**: Store admin notes about redemption process instead of shipping tracking

### Migration Steps for Production

#### 1. Database Schema Update
```sql
-- Rename column
ALTER TABLE reward_redemptions 
RENAME COLUMN shipping_tracking TO redemption_notes;

-- Add column comment for documentation
COMMENT ON COLUMN reward_redemptions.redemption_notes IS 'Admin notes about the redemption process, previously used for shipping tracking';
```

#### 2. Code Changes Required
- [x] Updated `prisma/schema.prisma`
- [x] Updated API endpoint `/api/admin/redemptions/[id]/status`
- [x] Frontend already compatible (uses generic field names)

#### 3. Data Migration
No data transformation needed - existing data remains intact with new column name.

#### 4. Rollback Plan (if needed)
```sql
-- Rollback column name
ALTER TABLE reward_redemptions 
RENAME COLUMN redemption_notes TO shipping_tracking;
```

### Testing Checklist
- [ ] Verify column exists with new name in production database
- [ ] Test redemption status update API endpoint
- [ ] Verify admin panel can update redemption notes
- [ ] Confirm no errors in application logs

### Files Changed
1. `prisma/schema.prisma` - Updated model definition
2. `src/app/api/admin/redemptions/[id]/status/route.js` - Updated API logic
3. `rename-shipping-tracking-to-redemption-notes.sql` - Migration script

### Notes
- Field semantics changed from "shipping tracking number" to "general redemption notes"
- This provides more flexibility for admin notes beyond just shipping information
- No breaking changes for existing functionality