# Request: Increase PostgreSQL Max Connections

**Date:** February 7, 2026  
**From:** Development Team (berkomunitas)  
**To:** Server Infrastructure Team  
**Priority:** HIGH  
**Database:** `berkomunitas_db` at `213.190.4.159:5432` (PRODUCTION)

---

## Problem Statement

Our Next.js application is experiencing frequent **"FATAL: sorry, too many clients already"** errors when trying to connect to PostgreSQL database. This is blocking development and preventing normal application operations.

### Error Logs
```
prisma:error 
Invalid `prisma.members.findUnique()` invocation:

Too many database connections opened: FATAL: sorry, too many clients already
```

---

## Current Situation

### Application Side (Already Optimized)
We have implemented **aggressive connection pooling** in our application:

- **Production:** 2 connections per instance
- **Development:** 10 connections per instance
- **Pool timeout:** 20 seconds
- **Connection string:** `postgresql://berkomunitas:berkomunitas688@213.190.4.159:5432/berkomunitas_db?schema=public&connection_limit=10&pool_timeout=20`

### Database Server Side (NEEDS ADJUSTMENT)
The PostgreSQL server appears to have a **very low `max_connections` limit** (likely default 100 or even lower).

---

## Request

Please **increase the `max_connections` parameter** on the PostgreSQL server to accommodate:

1. Development environment hot reloads (temporary connection spikes)
2. Multiple developers working simultaneously
3. Background jobs and cron tasks
4. API concurrent requests

### Recommended Settings

| Parameter | Current (Estimated) | Recommended | Minimum |
|-----------|-------------------|-------------|---------|
| `max_connections` | ~100 | **300** | 200 |
| `shared_buffers` | - | 25% of RAM | - |
| `work_mem` | - | 4MB | - |

---

## How to Check and Update

### 1. Check Current Max Connections
```sql
-- Connect to PostgreSQL as superuser
psql -h 213.190.4.159 -U postgres -d postgres

-- Check current max_connections
SHOW max_connections;

-- Check current active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connections per database
SELECT datname, count(*) as connections 
FROM pg_stat_activity 
GROUP BY datname 
ORDER BY connections DESC;
```

### 2. Update Max Connections
```sql
-- Option A: Temporary (until restart)
ALTER SYSTEM SET max_connections = 300;
SELECT pg_reload_conf();

-- Option B: Permanent (edit postgresql.conf)
-- File location: /etc/postgresql/{version}/main/postgresql.conf
-- or: /var/lib/postgresql/data/postgresql.conf
-- 
-- Change line:
-- max_connections = 100
-- To:
-- max_connections = 300
--
-- Then restart PostgreSQL:
-- sudo systemctl restart postgresql
```

### 3. Verify Changes
```sql
SHOW max_connections;  -- Should show 300

-- Check shared_buffers (should be ~25% of RAM)
SHOW shared_buffers;
```

---

## Impact Analysis

### Without This Change
- ❌ Application throws errors during high traffic
- ❌ Development work blocked (hot reload creates spikes)
- ❌ Need to manually kill connections every few minutes
- ❌ Poor user experience (500 errors)

### With This Change
- ✅ Stable application performance
- ✅ Smooth development workflow
- ✅ Can handle concurrent API requests
- ✅ Room for growth and scaling

---

## Additional Context

### Why Default Limit is Too Low

1. **Next.js Hot Reload:**
   - Each code change creates temporary connection spike
   - Old connections take ~20s to close (pool_timeout)
   - Can easily hit 20-30 connections during active development

2. **Production Deployment:**
   - Vercel creates multiple serverless instances
   - Each instance needs 2 connections
   - 100 connections = only 50 instances max

3. **Background Jobs:**
   - Cron jobs for notifications, stats, cleanup
   - Each job needs its own connection
   - Runs simultaneously with user traffic

### Resource Requirements

For **300 max_connections**, PostgreSQL needs:
- **RAM:** ~300MB extra (1MB per connection)
- **CPU:** Minimal impact
- **Disk:** No impact

Most modern servers can easily handle 300-500 connections.

---

## Testing After Changes

After increasing `max_connections`, please confirm:

```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql

# 2. Check max_connections
psql -h 213.190.4.159 -U postgres -c "SHOW max_connections;"

# 3. Check current usage
psql -h 213.190.4.159 -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

We will test from our side:
```bash
# Restart Next.js dev server
npm run dev

# Monitor for errors
tail -f .next/trace
```

---

## Contact

If you need any clarification or encounter issues, please contact:

- **Developer:** akuci@drwcorp.com
- **Project:** Berkomunitas Platform
- **Repository:** Local development environment

---

## Summary

**TLDR:** Please increase PostgreSQL `max_connections` from ~100 to **300** to fix "too many clients already" errors.

**Command:**
```sql
ALTER SYSTEM SET max_connections = 300;
SELECT pg_reload_conf();
```

Thank you! 🙏
