# Facebook OAuth Error: "This app needs at least one supported permission"

## 🔍 Diagnosis Error

Error ini biasanya terjadi karena:
1. **Facebook App belum dalam Mode Live/Production**
2. **Use Case tidak dikonfigurasi dengan benar**
3. **Permissions tidak di-activate**
4. **App Review status**

## ✅ Checklist Solusi

### 1. **Cek Status Facebook App**
Buka Facebook Developer Console → Your App:

```
App Dashboard → Settings → Basic
- App Mode: Harus "Live" untuk production
- App Status: Active
```

### 2. **Konfigurasi Use Case dengan Benar**
Di Facebook Developer Console:

```
Your App → Use Cases → "Authenticate and request data from users with Facebook Login"
→ Customize → Permissions

✅ Pastikan permissions sudah di-ADD (bukan hanya di-list):
- email ✅ 
- public_profile ✅
- pages_read_engagement (kalau diperlukan)

⚠️ PENTING: Klik tombol "Add" di sebelah setiap permission!
```

### 3. **Facebook Login Settings**
```
Your App → Facebook Login → Settings

Client OAuth Settings:
✅ Valid OAuth Redirect URIs: 
   - Development: https://your-domain.accounts.dev/v1/oauth_callback
   - Production: https://accounts.your-domain.com/v1/oauth_callback

✅ Login from Devices: Enabled
✅ Enforce HTTPS: Enabled
```

### 4. **App Review Status**
Untuk production, beberapa permissions memerlukan App Review:

```
Your App → App Review → Permissions and Features

✅ email: Usually approved automatically
✅ public_profile: Usually approved automatically  
⚠️ pages_read_engagement: Mungkin perlu review

Status yang diperlukan:
- Live: For basic permissions (email, public_profile)
- Approved: For advanced permissions
```

## 🛠️ Step-by-Step Fix

### Step 1: Pastikan App Mode = Live
```
1. Facebook Developer Console → Your App
2. Settings → Basic
3. Scroll ke bawah → App Mode
4. Switch dari "Development" ke "Live"
5. Add Privacy Policy URL (required for Live mode)
6. Add Terms of Service URL (required for Live mode)
```

### Step 2: Re-configure Use Case
```
1. Use Cases → Facebook Login
2. Customize → Permissions
3. Remove semua permissions yang ada
4. Add kembali hanya yang diperlukan:
   - email (Add)
   - public_profile (Add)
5. Save Changes
```

### Step 3: Test dengan Minimal Permissions
Coba dulu hanya dengan permissions basic:
- `email`
- `public_profile`

Hapus `pages_read_engagement` sementara untuk testing.

### Step 4: Update Clerk Configuration
Di Clerk Dashboard:
```
1. SSO Connections → Facebook
2. Pastikan "Use custom credentials" ON
3. App ID dan App Secret sudah benar
4. Test connection
```

## 🧪 Testing

### Test Sequence:
1. **Development Environment**:
   - Test dulu di development dengan Clerk shared credentials
   - Pastikan basic flow berjalan

2. **Production Environment**:
   - Switch ke custom credentials
   - Test dengan minimal permissions
   - Tambah permissions advanced jika diperlukan

## 🚨 Common Issues & Solutions

### Issue 1: "App Not Available"
**Solution**: App masih dalam Development mode
```
Settings → Basic → App Mode → Switch to "Live"
```

### Issue 2: "Permission Not Added"
**Solution**: Permissions hanya di-list, tidak di-add
```
Use Cases → Customize → Click "Add" button untuk setiap permission
```

### Issue 3: "Invalid Redirect URI"
**Solution**: Redirect URI tidak match
```
Clerk Dashboard copy exact redirect URI → 
Facebook Login Settings → Valid OAuth Redirect URIs
```

### Issue 4: "App Review Required"
**Solution**: Beberapa permissions perlu review
```
Mulai dengan basic permissions dulu:
- email ✅ (auto-approved)
- public_profile ✅ (auto-approved)

Skip advanced permissions sampai basic berjalan
```

## 📋 Quick Fix Checklist

- [ ] Facebook App Mode = "Live" 
- [ ] Privacy Policy URL added
- [ ] Terms of Service URL added
- [ ] Use Case "Facebook Login" configured
- [ ] Permissions: email & public_profile di-ADD (bukan cuma listed)
- [ ] Valid OAuth Redirect URIs correct
- [ ] Clerk custom credentials configured
- [ ] Test dengan minimal permissions dulu

## 🎯 Next Steps

1. **Fix Facebook App Configuration** (priority 1)
2. **Test dengan basic permissions** 
3. **Verify Clerk integration**
4. **Add advanced permissions jika diperlukan**

---

**Kemungkinan besar masalahnya**: Facebook App masih dalam "Development mode" atau permissions belum di-"Add" dengan benar di Use Case configuration.
