# Rewards Subdomain Architecture Documentation

## Overview
Rewards system telah berhasil dimigrasi dari admin panel ke subdomain dedicated `rewards.berkomunitas.com` untuk memberikan isolation yang lebih baik dan user experience yang optimal.

## Architecture Changes

### 1. Subdomain Routing
- **Main Admin**: `admin.berkomunitas.com` (tanpa rewards)
- **Rewards**: `rewards.berkomunitas.com` (dedicated rewards management)

### 2. Triple-Layer Routing System
1. **Vercel.json**: Server-side rewrites for optimal performance
2. **SubdomainHandler.js**: Client-side fallback handler 
3. **Middleware.js**: Edge middleware for comprehensive routing

### 3. Structural Changes

#### Removed from Admin Panel:
- `/admin-app/rewards/` directory
- `/admin-app/tabs/RewardsTab.js`
- Rewards navigation link from AdminNavigation.js
- Rewards references from page-new.js and other admin files

#### Added to Rewards Subdomain:
- `/rewards-app/page.js` - Complete rewards management interface
- `/rewards-app/components/RewardsLayout.js` - Dedicated layout component
- `/rewards-app/layout.js` - Updated to use RewardsLayout

## Features Migrated

### Dashboard Features:
- 📊 **Statistics Overview**: Pending/completed redemptions, total coins, available rewards
- 🚀 **Quick Actions**: Direct access to redemptions, catalog management, shipments
- 📋 **Recent Activity**: Real-time activity feed

### Catalog Management:
- ➕ **Add/Edit Rewards**: Complete CRUD operations for rewards
- 📷 **Photo Upload**: Image management with 5MB limit
- 📋 **Sortable Tables**: ID, name, description, points, stock sorting
- 🗑️ **Delete Operations**: Safe deletion with confirmation

### Redemption Management:
- ✅ **Approve Redemptions**: One-click approval system
- ❌ **Reject with Reason**: Structured rejection workflow
- 📊 **Status Tracking**: Real-time status updates
- 📈 **History View**: Complete redemption history

### Shipment Tracking:
- 🚚 **Future Integration**: Placeholder for shipping system integration

## Technical Implementation

### File Structure:
```
src/app/rewards-app/
├── page.js                    # Main rewards management interface
├── layout.js                  # Rewards-specific layout wrapper
└── components/
    └── RewardsLayout.js       # Dedicated layout component
```

### API Integration:
- All existing `/api/admin/rewards/*` endpoints remain unchanged
- Full compatibility with existing database schema
- Seamless integration with existing authentication system

### UI/UX Improvements:
- 🎨 **Green Theme**: Consistent green color scheme for rewards
- 📱 **Responsive Design**: Mobile-optimized interface
- 🎯 **Focused Navigation**: Task-specific tab system
- 🔔 **Real-time Counts**: Notification badges for pending items

## Benefits

### 1. **Separation of Concerns**
- Admin panel focused on user/system management
- Rewards system isolated for specialized workflow

### 2. **Performance Optimization**
- Dedicated routing reduces admin panel complexity
- Focused loading reduces bundle size for each subdomain

### 3. **User Experience**
- Specialized interface for rewards management
- Clear domain-based access control
- Reduced cognitive load with focused features

### 4. **Scalability**
- Easy to add rewards-specific features without affecting admin panel
- Independent deployment capabilities
- Better caching strategies per subdomain

## Access Control

### Admin Privileges Required:
- Only users with admin privileges can access rewards.berkomunitas.com
- Same authentication system as admin panel
- Automatic redirect for unauthorized users

### Security Features:
- Email-based admin verification
- Session-based authentication via Clerk
- Role-based access control

## Future Enhancements

### Planned Features:
1. **Shipment Integration**: Real tracking with delivery partners
2. **Inventory Management**: Advanced stock control
3. **Analytics Dashboard**: Detailed rewards analytics
4. **Automated Notifications**: Email/SMS notifications for status changes
5. **Bulk Operations**: Mass approval/rejection capabilities

## Deployment Notes

### Vercel Configuration:
- Both subdomains configured in vercel.json
- Automatic routing to appropriate app directories
- Edge middleware handles fallback cases

### DNS Requirements:
- `rewards.berkomunitas.com` CNAME pointing to Vercel
- SSL certificates automatically provisioned

### Build Process:
- Single codebase supports multiple subdomains
- Shared components and utilities across both systems
- Independent page optimization per subdomain

## Troubleshooting

### Common Issues:
1. **Subdomain Not Loading**: Check DNS configuration
2. **Admin Access Denied**: Verify user has admin privileges
3. **API Errors**: Ensure all `/api/admin/rewards/*` endpoints are accessible

### Debug Tools:
- Comprehensive logging in middleware and SubdomainHandler
- Admin debug mode available at `/admin-app/debug`
- Console logging for client-side routing issues

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Status**: ✅ Production Ready
