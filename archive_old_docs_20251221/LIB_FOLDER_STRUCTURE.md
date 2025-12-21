# 📚 LIB FOLDER STRUCTURE - Long-term Maintenance Guide

**Last Updated**: December 21, 2025

---

## 🏗️ Folder Structure

```
berkomunitas/
├── lib/                    ← SERVER-SIDE ONLY (API routes, middleware)
│   ├── prisma.js          ← Database client (singleton)
│   ├── ssoAuth.js         ← Server SSO authentication
│   ├── requireAdmin.js    ← Admin middleware
│   ├── taskNotifications.js
│   └── ...
│
└── src/
    ├── lib/               ← CLIENT-SIDE ONLY (browser, React)
    │   └── sso.js         ← Client SSO functions (localStorage, cookies)
    │
    ├── hooks/             ← React hooks
    │   └── useSSOUser.js
    │
    └── app/               ← Next.js app directory
```

---

## 🎯 Import Patterns

### ✅ Correct Usage:

#### For Server-side Code (API routes, Server Components):
```javascript
// API Routes, Server Components, Middleware
import { getCurrentUser } from '@/lib/ssoAuth';    // ← From root /lib
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';
```

#### For Client-side Code (Client Components, Browser):
```javascript
// Client Components, Browser code
'use client';
import { loginWithGoogle } from '@/src/lib/sso';  // ← From src/lib
import { useSSOUser } from '@/hooks/useSSOUser';
```

---

## ❌ Common Mistakes to Avoid:

1. **DON'T** import server-side code in client components:
   ```javascript
   // ❌ WRONG - will fail
   'use client';
   import { getCurrentUser } from '@/lib/ssoAuth';  // Server-only!
   ```

2. **DON'T** import client-side code in API routes:
   ```javascript
   // ❌ WRONG - unnecessary
   import { loginWithGoogle } from '@/src/lib/sso';  // Client-only!
   ```

3. **DON'T** use relative paths for lib imports:
   ```javascript
   // ❌ WRONG
   import prisma from '../../../lib/prisma';
   
   // ✅ CORRECT
   import prisma from '@/lib/prisma';
   ```

---

## 🔧 jsconfig.json Configuration

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],           // Main src folder
      "@/lib/*": ["./lib/*"],       // Server-side lib
      "@/lib": ["./lib"],           // Server-side lib (direct)
      "@/utils/*": ["./src/utils/*"],
      "@/src/lib/*": ["./src/lib/*"] // Client-side lib
    }
  }
}
```

---

## 🚀 Best Practices

### 1. **File Naming**
- Server files: Use clear names (`ssoAuth.js`, `requireAdmin.js`)
- Client files: Same, but keep in `src/lib/`

### 2. **Module Resolution**
- Always use path aliases (`@/lib`, `@/src/lib`)
- Never use relative paths for lib files

### 3. **Cache Management**
- After updating jsconfig.json, always clear cache:
  ```bash
  rm -rf .next
  ```

### 4. **Validation**
Run validation script to check imports:
```bash
python scripts/validate-lib-imports.py
```

---

## 🐛 Troubleshooting

### Error: "Module not found: Can't resolve '@/lib/ssoAuth'"

**Cause**: Cache issue or jsconfig not loaded

**Solution**:
```bash
# 1. Clear Next.js cache
rm -rf .next

# 2. Restart dev server
npm run dev

# 3. If still failing, check jsconfig.json
```

### Error: "document is not defined" in API route

**Cause**: Importing client-side code in server code

**Solution**: Use server-side equivalent:
```javascript
// ❌ WRONG
import { loginWithGoogle } from '@/src/lib/sso';

// ✅ CORRECT
import { getCurrentUser } from '@/lib/ssoAuth';
```

---

## 📝 Migration Checklist

When adding new lib files:

- [ ] Decide: Server-side or Client-side?
- [ ] Place in correct folder (`lib/` or `src/lib/`)
- [ ] Use correct import path
- [ ] Add JSDoc comments
- [ ] Update this documentation
- [ ] Test in both dev and build

---

## 🔍 Quick Reference

| Use Case | Folder | Import Path | Environment |
|----------|--------|-------------|-------------|
| API Routes | `lib/` | `@/lib/xxx` | Server |
| Middleware | `lib/` | `@/lib/xxx` | Server |
| Server Components | `lib/` | `@/lib/xxx` | Server |
| Client Components | `src/lib/` | `@/src/lib/xxx` | Browser |
| React Hooks | `src/hooks/` | `@/hooks/xxx` | Browser |
| Utilities | `src/utils/` | `@/utils/xxx` | Both |

---

## 📚 Related Documentation

- [SSO Migration Guide](./SSO_MIGRATION_FINAL_COMPLETE_STATUS.md)
- [Next.js Path Aliases](https://nextjs.org/docs/advanced-features/module-path-aliases)
- [Prisma Best Practices](./docs/prisma-guide.md)

---

**Maintained by**: Development Team  
**Questions?**: Check docs or ask in team chat
