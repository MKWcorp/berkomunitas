# How to Merge User Accounts 175, 218, and 270

## Quick Start

The merge script automatically finds the user with the **most points** and keeps that account.

### Automatic Merge (Recommended)

This automatically finds and keeps the user with the most points (coins + loyalty).

```bash
cd /home/runner/work/berkomunitas/berkomunitas
python scripts/merge-users-175-218-270.py
```

### Smart Merge Alternative

The smart-merge script also auto-selects the best target (same behavior).

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

### Automatic Selection
- 🔍 Script analyzes all three users
- 🏆 Finds the user with most points (coins + loyalty)
- ✅ Uses that user as the target account

### Data Transfer
- ✅ All coins and loyalty points are combined
- ✅ All task submissions are transferred
- ✅ All notification history is preserved
- ✅ All badges and achievements are transferred
- ✅ All social media profiles are moved
- ✅ All transaction history is kept
- ✅ All user activities are transferred

### Data Cleanup
- ❌ The two users with fewer points are deleted
- ❌ Old usernames are removed
- ✅ Target account (user with most points) gets email: `92allstaarrr@gmail.com`

## Step-by-Step Guide

### 1. Review Current State

First, check the current state of the users:

```bash
python scripts/merge-users-175-218-270.py
```

This will show:
- Current user details for all three accounts
- Points breakdown for each user
- **Which user has the most points** (will be kept as target)

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
-- Check the merged user exists (will be the one with most points)
SELECT id, nama_lengkap, email, coin, loyalty_point 
FROM members 
WHERE email = '92allstaarrr@gmail.com';

-- Verify old users are gone
SELECT id, email 
FROM members 
WHERE id IN (175, 218, 270);
-- Should return only 1 row (the user with most points)
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
