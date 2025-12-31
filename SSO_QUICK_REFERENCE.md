# 🚀 SSO Google - Quick Reference Card

## 📦 Import Patterns

### Frontend (Client Components)
```javascript
"use client";
import { useSSOUser } from '@/hooks/useSSOUser';

export default function MyComponent() {
  const { user, isLoaded, isSignedIn } = useSSOUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Please login</div>;
  
  return <div>Hello {user.name}!</div>;
}
```

### Backend (API Routes)
```javascript
import { getCurrentUser } from '@/lib/ssoAuth';

export async function GET(request) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use user.id, user.email, user.name
}
```

## 👤 User Object Properties

### ✅ Available Properties (SSO Google)
```javascript
user.id          // Member ID in database
user.google_id   // Google OAuth ID
user.email       // Primary email
user.name        // Full name from Google
user.picture     // Profile picture URL (optional)
```

### ❌ NO LONGER AVAILABLE (Clerk)
```javascript
user.emailAddresses[0].emailAddress  // ❌ Don't use
user.primaryEmailAddress             // ❌ Don't use
user.fullName                        // ❌ Don't use
user.firstName / user.lastName       // ❌ Don't use
user.username                        // ❌ Don't use
```

## 🗄️ Database Queries

### ✅ Correct Pattern
```javascript
// Find user by ID (preferred)
const member = await prisma.members.findUnique({
  where: { id: user.id }
});

// Find user by Google ID
const member = await prisma.members.findUnique({
  where: { google_id: user.google_id }
});

// Find user by email
const member = await prisma.members.findUnique({
  where: { email: user.email }
});
```

### ❌ Don't Use
```javascript
// ❌ clerk_id no longer exists
const member = await prisma.members.findUnique({
  where: { clerk_id: userId }
});

// ❌ userId variable doesn't exist
const { userId } = await auth();
```

## 🔐 Authentication Checks

### Frontend
```javascript
const { user, isLoaded, isSignedIn } = useSSOUser();

if (!isLoaded) {
  return <LoadingSpinner />;
}

if (!isSignedIn) {
  return <LoginPrompt />;
}

// User is authenticated, proceed
```

### Backend
```javascript
export async function POST(request) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }
  
  // User is authenticated, proceed
}
```

## 🛡️ Admin/Privilege Checks

```javascript
// Backend API
const user = await getCurrentUser(request);

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Check admin privilege
const privilege = await prisma.user_privileges.findFirst({
  where: {
    member_id: user.id,
    privilege: 'admin',
    is_active: true,
    OR: [
      { expires_at: null },
      { expires_at: { gt: new Date() } }
    ]
  }
});

if (!privilege) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## 📝 Common Patterns

### Creating New Member
```javascript
const newMember = await prisma.members.create({
  data: {
    google_id: user.google_id,
    email: user.email,
    nama_lengkap: user.name,
    tanggal_daftar: new Date(),
    loyalty_point: 0
  }
});
```

### Displaying User Info
```javascript
// Frontend
<div>
  <h1>{user.name}</h1>
  <p>{user.email}</p>
  <img src={user.picture} alt={user.name} />
</div>
```

### API Headers
```javascript
// Don't need special headers anymore
// Just use getCurrentUser(request) in API routes

// OLD (don't use):
headers: { 'x-user-email': user.email }

// NEW (automatic via getCurrentUser):
const user = await getCurrentUser(request);
```

## 🚨 Common Errors & Fixes

### Error: "useUser can only be used within ClerkProvider"
**Fix**: Replace `useUser()` with `useSSOUser()`
```javascript
// ❌ import { useUser } from '@clerk/nextjs';
// ✅ import { useSSOUser } from '@/hooks/useSSOUser';
```

### Error: "userId is not defined"
**Fix**: Use `getCurrentUser(request)` and access `user.id`
```javascript
// ❌ const { userId } = await auth();
// ✅ const user = await getCurrentUser(request);
```

### Error: "Cannot read properties of undefined (reading '0')"
**Fix**: Use `user.email` directly
```javascript
// ❌ user.emailAddresses[0].emailAddress
// ✅ user.email
```

### Error: Prisma "where needs id, clerk_id, or google_id"
**Fix**: Use `user.id` instead of `clerk_id`
```javascript
// ❌ where: { clerk_id: userId }
// ✅ where: { id: user.id }
```

## 🔄 Migration Patterns

### Replace useUser Hook
```javascript
// BEFORE
import { useUser } from '@clerk/nextjs';
const { user, isLoaded, isSignedIn } = useUser();

// AFTER
import { useSSOUser } from '@/hooks/useSSOUser';
const { user, isLoaded, isSignedIn } = useSSOUser();
```

### Replace auth() Call
```javascript
// BEFORE
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();

// AFTER
import { getCurrentUser } from '@/lib/ssoAuth';
const user = await getCurrentUser(request);
```

### Replace currentUser() Call
```javascript
// BEFORE
import { currentUser } from '@clerk/nextjs/server';
const user = await currentUser();

// AFTER
import { getCurrentUser } from '@/lib/ssoAuth';
const user = await getCurrentUser(request);
```

## 📚 File Locations

- **SSO Hook**: `src/hooks/useSSOUser.js`
- **SSO Auth Library**: `src/lib/ssoAuth.js`
- **Middleware**: `middleware.js` (root)
- **Login Page**: `src/app/page.js`

## 🧪 Testing

```javascript
// Check if user is loaded
console.log('User loaded:', isLoaded);
console.log('User signed in:', isSignedIn);
console.log('User data:', user);

// Verify user properties
console.log('ID:', user?.id);
console.log('Email:', user?.email);
console.log('Name:', user?.name);
```

---

**✅ Remember**: Always use `user.email`, `user.name`, and `user.id` - never the old Clerk properties!

