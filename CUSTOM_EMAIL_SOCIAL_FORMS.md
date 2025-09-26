# Custom Email & Social Media Forms - Clerk Integration

Implementasi custom form untuk mengelola email dan koneksi social media menggunakan Clerk API sesuai dengan dokumentasi resmi.

## 📋 Komponen yang Dibuat

### 1. EmailSocialManager.js
**Lokasi**: `src/app/profil/components/EmailSocialManager.js`

Komponen utama untuk mengelola email dan social media dengan fitur:
- ✅ **Tambah Email Baru** - Menggunakan `user.createEmailAddress()`
- ✅ **Hapus Email** - Menggunakan `emailAddress.destroy()`
- ✅ **Verifikasi Status** - Menampilkan status verified/pending
- ✅ **Koneksi Facebook** - Menggunakan `user.createExternalAccount()`
- ✅ **Hapus Koneksi** - Menggunakan `externalAccount.destroy()`
- ✅ **Loading States** - Indikator loading untuk semua operasi
- ✅ **Error Handling** - Menampilkan pesan error dari Clerk API

### 2. CustomUserProfile.js
**Lokasi**: `src/app/profil/components/CustomUserProfile.js`

Implementasi UserProfile dengan custom page menggunakan:
```jsx
<UserProfile>
  <UserProfile.Page label="Email & Social" url="email-social">
    <EmailSocialManager />
  </UserProfile.Page>
</UserProfile>
```

### 3. UserProfileWithCustomPage.js
**Lokasi**: `src/app/profil/components/UserProfileWithCustomPage.js`

Implementasi UserButton dengan custom page dan link:
```jsx
<UserButton>
  <UserButton.UserProfilePage label="Email & Social" url="email-social">
    <EmailSocialManager />
  </UserButton.UserProfilePage>
  <UserButton.UserProfileLink label="Kustomisasi Profil" url="/profil" />
</UserButton>
```

## 🔧 Integrasi dengan Profil Dashboard

### Tab Baru di Profil
Menambahkan tab "Email & Social" ke dalam profil dashboard:

```javascript
const TABS = [
  { key: 'edit', label: 'Edit Profil' },
  { key: 'account', label: 'Pengaturan' },
  { key: 'email-social', label: 'Email & Social' }, // ← Tab baru
  { key: 'badges', label: 'Lencana Saya' },
];
```

## 🛠️ Cara Penggunaan

### 1. Integrase di Halaman Profil
```jsx
import EmailSocialManager from './components/EmailSocialManager';

// Di dalam komponen profil
{tab === 'email-social' && (
  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Email & Social Media Management</h2>
    <EmailSocialManager />
  </div>
)}
```

### 2. Sebagai Custom UserProfile Page
```jsx
import CustomUserProfile from './components/CustomUserProfile';

// Ganti UserProfile default dengan custom
<CustomUserProfile />
```

### 3. Sebagai UserButton dengan Custom Page
```jsx
import UserProfileWithCustomPage from './components/UserProfileWithCustomPage';

// Ganti UserButton di navigation
<UserProfileWithCustomPage />
```

## 📝 API Methods yang Digunakan

### Email Management
```javascript
// Tambah email baru
await user.createEmailAddress({ email: 'user@example.com' });

// Hapus email
const emailAddress = user.emailAddresses.find(email => email.id === emailId);
await emailAddress.destroy();

// Cek status verifikasi
email.verification?.status === 'verified'
```

### Social Media Management
```javascript
// Koneksi Facebook
await user.createExternalAccount({
  strategy: 'oauth_facebook',
  redirectUrl: window.location.href
});

// Hapus koneksi
const externalAccount = user.externalAccounts.find(account => account.id === accountId);
await externalAccount.destroy();
```

## 🎨 Styling & UX

### Glass Morphism Design
- Background: `bg-white/70 backdrop-blur-sm`
- Border: `border border-white/30`
- Rounded corners: `rounded-xl`

### Status Indicators
- **Verified Email**: Green badge dengan "Verified"
- **Pending Email**: Yellow badge dengan "Pending"
- **Loading States**: Spinner animation
- **Success/Error Messages**: Color-coded notifications

### Interactive Elements
- **Add Email Form**: Toggle show/hide dengan validation
- **Connect Facebook**: Disabled jika sudah terhubung
- **Remove Buttons**: Confirmation dengan loading state

## 🔍 Error Handling

### Clerk API Errors
```javascript
catch (error) {
  const errorMessage = error.errors?.[0]?.longMessage || 'Default error message';
  setMessages(prev => ({ ...prev, email: `❌ ${errorMessage}` }));
}
```

### Common Error Scenarios
- **Email sudah digunakan**: Clerk API akan return error
- **Facebook sudah terhubung**: Button disabled
- **Network errors**: Catch dan display user-friendly message
- **Invalid email format**: HTML5 validation + Clerk validation

## 🚀 Deploy ke Production

Komponen ini ready untuk production karena:
1. ✅ Menggunakan official Clerk API methods
2. ✅ Proper error handling untuk semua edge cases
3. ✅ Loading states untuk UX yang baik
4. ✅ Responsive design dengan Tailwind CSS
5. ✅ Glass morphism konsisten dengan design system

## 📚 Referensi Dokumentasi Clerk

- [UserProfile Customization](https://clerk.com/docs/components/user/user-profile#custom-pages)
- [UserButton Custom Pages](https://clerk.com/docs/components/user/user-button#custom-pages)
- [Email Management API](https://clerk.com/docs/references/javascript/user/email-addresses)
- [External Accounts API](https://clerk.com/docs/references/javascript/user/external-accounts)

---

## 🎯 Next Steps

1. **Test Form Validation**: Pastikan semua validasi email bekerja
2. **Test Facebook OAuth**: Pastikan redirect flow Facebook berjalan lancar
3. **Add More Providers**: Extend untuk Google, GitHub, dll jika diperlukan
4. **Enhanced UI**: Tambah icons untuk setiap provider
5. **Bulk Operations**: Fitur remove multiple emails sekaligus
