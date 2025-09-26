# 🔍 Admin Subdomain Troubleshooting Guide

## Masalah: "admin.berkomunitas.com tidak ada loginnya"

### 🔧 Langkah Troubleshooting:

#### 1. **Test DNS & Routing**
- **Test URL:** `https://admin.berkomunitas.com/test`
- **Expected:** Halaman debug dengan info connection
- **Jika gagal:** DNS belum dikonfigurasi dengan benar

#### 2. **Test Direct Access**  
- **Test URL:** `https://berkomunitas.com/admin-app`
- **Expected:** Halaman admin dengan tombol "Login Admin"
- **Jika berhasil:** Masalah di DNS subdomain

#### 3. **Test Middleware**
- **Test URL:** `https://berkomunitas.com/admin-app/test`
- **Expected:** Halaman debug yang sama
- **Purpose:** Memastikan middleware bekerja

---

## 🚨 Kemungkinan Penyebab:

### A. **DNS Configuration Missing**
```
❌ admin.berkomunitas.com belum dikonfigurasi
✅ Solusi: Tambahkan CNAME record di DNS provider
   - Name: admin
   - Target: berkomunitas.com (atau IP Vercel)
```

### B. **Vercel Domain Settings**
```
❌ Subdomain belum ditambahkan di Vercel dashboard
✅ Solusi: 
   1. Masuk Vercel dashboard
   2. Project Settings > Domains
   3. Add "admin.berkomunitas.com"
```

### C. **Browser Cache/Cookies**
```
❌ Cache lama atau cookies bermasalah
✅ Solusi:
   1. Hard refresh (Ctrl+Shift+R)
   2. Clear cookies untuk berkomunitas.com
   3. Try incognito/private mode
```

---

## ✅ **Working Admin Panel Features:**

### 🔐 **Authentication Flow:**
1. User visits `admin.berkomunitas.com`
2. Middleware rewrites to `/admin-app`
3. Page checks if user is logged in
4. Shows "Login Admin" button if not authenticated
5. After login, checks admin privileges via `/api/debug/admin`
6. Redirects to `/admin-app/dashboard` if admin
7. Shows "Access Denied" if not admin

### 🎯 **Expected Admin User:**
- **Email:** drwcorpora@gmail.com
- **User ID:** 224
- **Privilege:** admin (active)

---

## 🧪 **Debug Commands:**

### Test API Directly:
```bash
curl https://berkomunitas.com/api/debug/admin
```

### Check Current Deployment:
```bash
# Test main admin page
curl -I https://berkomunitas.com/admin-app

# Test subdomain (if DNS works)
curl -I https://admin.berkomunitas.com
```

---

## 📞 **Next Steps:**

1. **Test:** https://admin.berkomunitas.com/test
2. **If DNS fails:** Configure subdomain in domain provider
3. **If auth fails:** Check Clerk configuration
4. **If privileges fail:** Check database user_privileges table

---

## 🎯 **Immediate Fix Options:**

### Option 1: Use Direct URL
- URL: `https://berkomunitas.com/admin-app`
- Should work immediately

### Option 2: Configure DNS
- Add CNAME: `admin` → `berkomunitas.com`
- Wait 5-15 minutes for propagation

### Option 3: Use Test Page
- URL: `https://berkomunitas.com/admin-app/test`
- Provides detailed debugging information
