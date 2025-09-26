# Facebook OAuth - Scope Minimal Requirements

## 🎯 **Scope Minimal untuk Facebook Login**

### **Automatic/Default Permissions**
```javascript
✅ public_profile  // SELALU WAJIB - tidak bisa ditolak user
   - id
   - name  
   - first_name
   - last_name
   - picture
   - link (profile URL)
```

### **Basic Recommended Scope**
```javascript
// Minimal untuk login dasar:
scope: ['public_profile']

// Recommended untuk aplikasi nyata:
scope: ['public_profile', 'email']
```

## 📋 **Scope Configuration**

### **1. Development (Testing)**
Untuk testing, cukup gunakan scope minimal:
```javascript
// Di Facebook Developer Console → Use Cases → Facebook Login
Permissions yang perlu di-ADD:
✅ public_profile  (otomatis)
✅ email          (optional tapi recommended)

// Hapus permissions yang tidak perlu:
❌ pages_read_engagement  (tidak diperlukan untuk basic login)
❌ pages_show_list       (tidak diperlukan untuk basic login)
❌ user_photos          (tidak diperlukan untuk basic login)
```

### **2. Production Setup**
```javascript
// Step 1: Facebook App Configuration
Use Cases → "Authenticate and request data from users with Facebook Login"
→ Customize → Permissions:

Required:
✅ email (Click "Add")
✅ public_profile (automatically included)

// Step 2: Facebook Login Settings
Valid OAuth Redirect URIs:
- Development: https://your-domain.accounts.dev/v1/oauth_callback
- Production: https://accounts.your-domain.com/v1/oauth_callback
```

### **3. Code Implementation**
```javascript
// Clerk implementation dengan scope minimal
await user.createExternalAccount({
  strategy: 'oauth_facebook',
  redirectUrl: window.location.href,
  additionalScopes: ['email'] // public_profile otomatis included
});
```

## 🔍 **Data yang Bisa Diakses**

### **public_profile (Always Available)**
```json
{
  "id": "1234567890",
  "name": "John Doe", 
  "first_name": "John",
  "last_name": "Doe",
  "picture": {
    "data": {
      "url": "https://platform-lookaside.fbsbx.com/..."
    }
  },
  "link": "https://www.facebook.com/john.doe"
}
```

### **email (If Granted)**
```json
{
  "email": "john.doe@example.com"
}
```

## ⚠️ **Permissions yang TIDAK Perlu untuk Basic Login**

```javascript
❌ pages_read_engagement   // Untuk read Page data
❌ pages_show_list        // Untuk list Pages
❌ user_photos           // Untuk akses foto user
❌ user_posts            // Untuk akses posts user
❌ publish_to_groups     // Untuk posting ke groups
❌ business_management   // Untuk business assets
```

## 🛠️ **Troubleshooting Steps**

### **Error: "App needs at least one supported permission"**

**Step 1: Simplify Permissions**
```
Facebook Developer Console → Use Cases → Customize:
1. Remove ALL permissions
2. Add back ONLY: email
3. Save changes
4. Test connection
```

**Step 2: Verify App Mode**
```
Settings → Basic:
✅ App Mode: Live (not Development)
✅ Privacy Policy URL: Added
✅ Terms of Service URL: Added
```

**Step 3: Check OAuth Settings**
```
Facebook Login → Settings:
✅ Valid OAuth Redirect URIs: Correct URL from Clerk
✅ Login from Devices: Enabled
✅ Enforce HTTPS: Enabled
```

## 🧪 **Testing Sequence**

### **Test 1: Minimal Scope**
```javascript
scope: ['public_profile']  // No email
```

### **Test 2: Basic Scope**
```javascript
scope: ['public_profile', 'email']  // Standard setup
```

### **Test 3: Full Integration**
```javascript
// Test dengan Clerk production environment
// Pastikan custom credentials configured
```

## ✅ **Best Practice**

### **Untuk Basic Login App**:
```javascript
✅ public_profile  (mandatory)
✅ email          (recommended)
```

### **Untuk Advanced Features** (jika diperlukan nanti):
```javascript
// Tambah permissions sesuai kebutuhan:
- user_photos     (untuk akses foto)
- pages_show_list (untuk manage Pages)
- publish_to_groups (untuk posting)
```

## 🎯 **Summary**

**Scope minimal yang perlu dikonfigurasi di Facebook App**:
1. **`email`** - Satu-satunya permission yang perlu di-"Add" secara manual
2. **`public_profile`** - Otomatis included, tidak perlu di-add manual

**Yang perlu dihapus dari current setup**:
- ❌ `pages_read_engagement` (tidak perlu untuk basic login)

**Action Items**:
1. Login ke Facebook Developer Console
2. Use Cases → Customize → Remove `pages_read_engagement`
3. Keep only: `email` 
4. Save & test connection
