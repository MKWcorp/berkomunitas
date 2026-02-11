# How to Merge User Accounts 175, 218, and 270

## Quick Start

There are two scripts available for merging these user accounts:

### Option 1: Direct Merge into User 270 (Recommended)

This merges all three accounts into User 270, which already has the target email `92allstaarrr@gmail.com`.

```bash
cd /home/runner/work/berkomunitas/berkomunitas
python scripts/merge-users-175-218-270.py
```

### Option 2: Smart Merge (Auto-select best target)

This automatically finds the user with the most points and uses them as the target.

```bash
cd /home/runner/work/berkomunitas/berkomunitas
python scripts/smart-merge-users-175-218-270.py
```

## Prerequisites

1. **Install Dependencies**:
   ```bash
   pip install python-dotenv psycopg2-binary
   ```

2. **Set Database Connection**:
   Ensure your `.env` file has the `DATABASE_URL` configured:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

3. **Backup Database** (IMPORTANT):
   ```bash
   # Example for PostgreSQL
   pg_dump -h host -U user -d database > backup_before_merge.sql
   ```

## What Happens During Merge

### Data Transfer
- ✅ All coins and loyalty points are combined
- ✅ All task submissions are transferred
- ✅ All notification history is preserved
- ✅ All badges and achievements are transferred
- ✅ All social media profiles are moved
- ✅ All transaction history is kept
- ✅ All user activities are transferred

### Data Cleanup
- ❌ Old user accounts (175 and 218) are deleted
- ❌ Old usernames are removed
- ✅ Target account (270) gets final email: `92allstaarrr@gmail.com`

## Step-by-Step Guide

### 1. Review Current State

First, check the current state of the users:

```bash
python scripts/smart-merge-users-175-218-270.py
```

This will show:
- Current user details
- Points breakdown
- Which user has the most points

### 2. Dry Run

Both scripts automatically run in dry-run mode first. This shows you:
- What will happen
- How much data will be transferred
- Final totals for points

**Review the dry run output carefully!**

### 3. Execute Merge

If everything looks correct, type `yes` when prompted to proceed with the actual merge.

### 4. Verify Results

After the merge completes, verify:

```sql
-- Check the merged user exists
SELECT id, nama_lengkap, email, coin, loyalty_point 
FROM members 
WHERE id = 270;

-- Verify old users are gone
SELECT id, email 
FROM members 
WHERE id IN (175, 218);
-- Should return 0 rows
```

## Troubleshooting

### Connection Error
```
psycopg2.OperationalError: connection to server failed
```
**Solution**: Check your DATABASE_URL in `.env` file

### User Not Found
```
❌ Expected 3 users, found 2
```
**Solution**: One or more users may already be deleted. Check which users exist.

### Constraint Violation
```
ERROR: duplicate key value violates unique constraint
```
**Solution**: May need to handle duplicate data manually. Contact dev team.

## Rollback

⚠️ **This operation cannot be easily rolled back!**

If something goes wrong:
1. Stop immediately (Ctrl+C)
2. Restore from backup:
   ```bash
   psql -h host -U user -d database < backup_before_merge.sql
   ```

## Support

For questions or issues:
1. Check the detailed documentation in `USER_MERGE_175_218_270.md`
2. Review error messages in the script output
3. Contact the development team

## Files Created

- `scripts/merge-users-175-218-270.py` - Main merge script
- `scripts/smart-merge-users-175-218-270.py` - Auto-select best target
- `USER_MERGE_175_218_270.md` - Detailed documentation
- `HOW_TO_MERGE_USERS.md` - This quick start guide
