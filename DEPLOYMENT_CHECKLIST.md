# 🚀 Deployment Checklist - Berkomunitas SSO

**Status:** ✅ Production Ready  
**Last Updated:** December 22, 2024  
**Build Status:** ✅ Successful (Warnings only, no errors)

---

## ✅ Pre-Deployment Verification

### 1. Code Status
- ✅ All Clerk references removed
- ✅ SSO implementation complete
- ✅ Google OAuth integrated
- ✅ JWT token system working
- ✅ Build successful (no errors)
- ✅ Git pushed to main branch

### 2. Database Status
- ✅ PostgreSQL database ready
- ✅ Prisma schema synced
- ✅ All tables created
- ✅ 78+ users migrated
- ✅ Connection pool configured

### 3. API Endpoints Ready
- ✅ `/api/sso/google-login` - Login with Google
- ✅ `/api/sso/verify-token` - Token verification
- ✅ `/api/sso/refresh-token` - Token refresh
- ✅ `/api/sso/track-activity` - Activity tracking
- ✅ `/api/sso/get-user` - Get user info
- ✅ `/api/sso/sessions` - List sessions
- ✅ `/api/sso/revoke-session` - Revoke session

---

## 🔑 Required Environment Variables

Pastikan semua environment variables berikut di-set di **Vercel Dashboard → Settings → Environment Variables**:

### Essential (Required)
```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database?connection_limit=20&pool_timeout=20"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"

# JWT Secrets (MUST be at least 32 characters)
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
```

### Optional (Nice to have)
```bash
# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_UPLOAD_PRESET="your-preset"

# N8N Webhook (for task notifications)
N8N_TASK_START_WEBHOOK_URL="https://your-n8n-webhook-url"

# Database Pool Settings
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=20
DATABASE_IDLE_TIMEOUT=30
```

---

## 📋 Deployment Steps

### Step 1: Vercel Dashboard Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **berkomunitas**
3. Go to **Settings → Environment Variables**
4. Add all required variables (see above)
5. Save changes

### Step 2: Deploy

Option A: Automatic (Recommended)
```bash
# Push to main branch triggers auto-deploy
git push origin main
```

Option B: Manual via Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy to production
vercel --prod
```

### Step 3: Verify Deployment

1. **Check Build Logs**
   - Go to Vercel Dashboard → Deployments
   - Click on latest deployment
   - Check for any errors

2. **Test Login**
   - Visit: https://berkomunitas.com
   - Click "Login with Google"
   - Verify successful login
   - Check browser console for errors

3. **Test API Endpoints**
   ```bash
   # Test from browser console after login
   fetch('/api/sso/verify-token', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ token: localStorage.getItem('access_token') })
   }).then(r => r.json()).then(console.log)
   ```

4. **Check Database**
   - Verify new sessions created in `PlatformSession` table
   - Check user activities in `UserActivity` table
   - Confirm coins/points updated

---

## 🔍 Post-Deployment Checks

### Immediate (Within 5 minutes)
- [ ] Homepage loads successfully
- [ ] Google login works
- [ ] User dashboard accessible
- [ ] Profile page displays correctly
- [ ] No 401/403 errors in console

### Within 1 hour
- [ ] Multiple users can login
- [ ] Sessions persist after page refresh
- [ ] Tokens auto-refresh correctly
- [ ] Activity tracking working
- [ ] Points accumulation working

### Within 24 hours
- [ ] No errors in Vercel logs
- [ ] Database connections stable
- [ ] No memory leaks
- [ ] Response times normal (<2s)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid token" errors
**Cause:** JWT_SECRET not set or different from local
**Solution:** 
```bash
# Verify JWT_SECRET in Vercel matches your .env
# Re-deploy if needed
vercel --prod
```

### Issue 2: 401 Unauthorized on all API calls
**Cause:** Cookie not being set properly
**Solution:**
1. Check if `sameSite` and `secure` settings correct
2. Verify domain matches in Google OAuth settings
3. Clear browser cookies and test again

### Issue 3: "Too many connections" to database
**Cause:** Connection pool exhausted
**Solution:**
```bash
# Add to DATABASE_URL
?connection_limit=20&pool_timeout=20

# Or increase pool size
DATABASE_POOL_SIZE=30
```

### Issue 4: Google OAuth redirect fails
**Cause:** Domain not authorized in Google Console
**Solution:**
1. Go to Google Cloud Console
2. Add authorized domain: https://berkomunitas.com
3. Add redirect URI: https://berkomunitas.com
4. Wait 5 minutes for changes to propagate

---

## 📊 Monitoring

### Vercel Analytics
- Go to: Vercel Dashboard → Analytics
- Monitor: Page views, API calls, errors

### Database Monitoring
```sql
-- Check active sessions
SELECT COUNT(*) as active_sessions 
FROM "PlatformSession" 
WHERE "expiresAt" > NOW();

-- Check today's logins
SELECT COUNT(*) as logins_today
FROM "UserActivity"
WHERE "activityType" = 'login'
AND "createdAt" >= CURRENT_DATE;

-- Check database connections
SELECT COUNT(*) FROM pg_stat_activity;
```

### Error Tracking
```bash
# View Vercel logs
vercel logs berkomunitas --prod

# Filter for errors only
vercel logs berkomunitas --prod | grep -i error
```

---

## 🔄 Rollback Plan

If deployment fails:

### Quick Rollback (Vercel Dashboard)
1. Go to Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Manual Rollback (Git)
```bash
# Find last working commit
git log --oneline

# Rollback to specific commit
git reset --hard <commit-hash>

# Force push
git push -f origin main
```

---

## 📈 Success Metrics

### Technical Metrics
- Build time: < 3 minutes
- Page load time: < 2 seconds
- API response time: < 500ms
- Error rate: < 0.1%
- Uptime: > 99.9%

### Business Metrics
- Successful logins: > 95%
- Session duration: > 5 minutes
- Return users: > 50%
- Points earned/day: > 100

---

## 🎉 Post-Launch Tasks

### Immediate (Day 1)
- [ ] Monitor error logs every hour
- [ ] Check user feedback
- [ ] Verify all features working
- [ ] Document any issues

### Week 1
- [ ] Analyze user behavior
- [ ] Optimize slow queries
- [ ] Fix reported bugs
- [ ] Update documentation

### Month 1
- [ ] Review analytics
- [ ] Plan new features
- [ ] Scale infrastructure if needed
- [ ] Conduct security audit

---

## 📞 Support Contacts

**Technical Issues:**
- Email: tech@berkomunitas.com
- GitHub: [berkomunitas/issues](https://github.com/MKWcorp/berkomunitas/issues)

**Vercel Support:**
- Dashboard: https://vercel.com/support
- Docs: https://vercel.com/docs

**Google OAuth Support:**
- Console: https://console.cloud.google.com
- Docs: https://developers.google.com/identity

---

## 📝 Notes

- **Cost:** $0/month (Self-hosted SSO, free Vercel)
- **Previous Cost:** $135/month (Clerk)
- **Savings:** $1,620/year 💰

- **Migration Date:** December 21-22, 2024
- **Users Migrated:** 78+
- **Files Modified:** 198+
- **Zero Downtime:** ✅

---

**🚀 Ready for Production Deployment!**

**Last Check:** December 22, 2024  
**Build Status:** ✅ Success  
**Git Status:** ✅ Up to date  
**Environment:** ✅ Configured
