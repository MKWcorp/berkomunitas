# Data Migration Flow - BerkomunitasPlus System

## Overview

Implementasi sistem yang otomatis memindahkan data dari `bc_drwskincare_api` ke `bc_drwskincare_plus_verified` ketika user berhasil mengkonfirmasi sambungan Beauty Consultant account.

## Data Flow Process

### 1. **Initial Connection** (`/api/beauty-consultant/connect`)

```javascript
// User inputs Reseller ID + Phone Number
POST /api/beauty-consultant/connect
{
  resellerId: "BC12345",
  input_phone: "081234567890"
}

// System creates connection record
bc_drwskincare_plus {
  id: 10,
  member_id: 1,
  reseller_id: "BC12345", 
  verification_status: "pending", // or "verified" if auto-match
  input_phone: "081234567890"
}
```

**Auto Migration Trigger**: If phone number matches exactly, data is immediately migrated.

### 2. **Manual Confirmation** (`/api/beauty-consultant/confirm`)

```javascript
// User confirms with level verification
POST /api/beauty-consultant/confirm  
{
  level: "Senior Beauty Consultant"
}

// System verifies level matches API data
// Then triggers data migration
```

### 3. **Data Migration Process**

#### From: `bc_drwskincare_api`
```sql
SELECT 
  resellerId,        -- TEXT ID (BC12345)
  nama_reseller,     -- Source name
  nomor_hp,          -- Source phone
  level,             -- For verification
  alamat             -- Source address
FROM bc_drwskincare_api 
WHERE resellerId = 'BC12345'
```

#### To: `bc_drwskincare_plus_verified`
```sql
INSERT INTO bc_drwskincare_plus_verified (
  api_data_id,      -- 'BC12345' (reference to API)
  connection_id,    -- 10 (reference to connection)
  nama_lengkap,     -- From nama_reseller (user editable)
  nomor_hp,         -- From nomor_hp (user editable)
  alamat_lengkap,   -- From alamat (user editable)
  instagram_username, -- NULL (user adds later)
  facebook_username,  -- NULL (user adds later)
  tiktok_username,    -- NULL (user adds later)
  youtube_username,   -- NULL (user adds later)
  created_at,       -- Current timestamp
  updated_at        -- Current timestamp
)
```

## Implementation Details

### API Endpoint Updates

#### `/api/beauty-consultant/connect` (Modified)
```javascript
// After successful connection
if (phoneMatches) {
  // Update privilege
  await prisma.user_privileges.upsert({...});
  
  // Migrate data automatically
  await prisma.bc_drwskincare_plus_verified.create({
    data: {
      api_data_id: bcData.resellerId,
      connection_id: connection.id,
      nama_lengkap: bcData.nama_reseller || member.nama_lengkap,
      nomor_hp: bcData.nomor_hp,
      alamat_lengkap: bcData.alamat || null,
      // Social media fields initially null
      instagram_username: null,
      facebook_username: null,
      tiktok_username: null,
      youtube_username: null
    }
  });
}
```

#### `/api/beauty-consultant/confirm` (New)
```javascript
// Dedicated endpoint for manual confirmation
// Handles level verification + data migration
// Updates connection status to 'verified'
// Grants 'berkomunitasplus' privilege
// Creates verified data record
```

### Frontend Updates

#### `/plus/page.js` (Modified)
```javascript
const handleConfirmConnection = async () => {
  // Level verification
  if (selectedLevel !== previewData.level) {
    // Show error, reset form
    return;
  }
  
  // Call new confirm endpoint
  const response = await fetch('/api/beauty-consultant/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: selectedLevel })
  });
  
  // Handle success - user now has verified data
};
```

## Data Relationships

### Database Schema
```
bc_drwskincare_api (Source)
├── resellerId: TEXT (Primary Key)
├── nama_reseller: VARCHAR(255)
├── nomor_hp: VARCHAR(20)
├── level: VARCHAR(100)
└── alamat: TEXT

bc_drwskincare_plus (Connection)
├── id: SERIAL (Primary Key)
├── member_id: INTEGER (Foreign Key)
├── reseller_id: TEXT (Foreign Key → bc_drwskincare_api.resellerId)
└── verification_status: VARCHAR(20)

bc_drwskincare_plus_verified (Target)
├── id: SERIAL (Primary Key)
├── api_data_id: TEXT (Foreign Key → bc_drwskincare_api.resellerId)
├── connection_id: INTEGER (Foreign Key → bc_drwskincare_plus.id)
├── nama_lengkap: VARCHAR(255) [USER EDITABLE]
├── nomor_hp: VARCHAR(20) [USER EDITABLE]
├── alamat_lengkap: TEXT [USER EDITABLE]
├── instagram_username: VARCHAR(100) [USER EDITABLE]
├── facebook_username: VARCHAR(100) [USER EDITABLE]
├── tiktok_username: VARCHAR(100) [USER EDITABLE]
└── youtube_username: VARCHAR(100) [USER EDITABLE]
```

### Relationship Rules
- **One-to-One**: Each connection has one verified record
- **Optional Reference**: api_data_id can be NULL if source deleted
- **Cascade Delete**: If connection deleted, verified data deleted
- **SET NULL**: If API data deleted, verified data keeps user edits

## User Journey

### Scenario 1: Auto-Verification (Phone Match)
1. User inputs Reseller ID + Phone
2. System finds matching phone in API data  
3. Connection immediately marked 'verified'
4. Data automatically migrated to verified table
5. User privilege updated to 'berkomunitasplus'
6. User sees gold "BerkomunitasPlus" label in profile

### Scenario 2: Manual Verification (Level Check)
1. User inputs Reseller ID + Phone
2. System shows preview data
3. User confirms with level verification
4. System verifies level matches API data
5. Connection marked 'verified' + data migrated
6. User privilege updated to 'berkomunitasplus'
7. User sees gold "BerkomunitasPlus" label in profile

### Scenario 3: Post-Confirmation Management
1. User clicks "BerkomunitasPlus" label
2. Navigates to `/plus/verified` page
3. Can view and edit their verified data
4. Changes saved to verified table (not API table)
5. Original API data preserved for reference

## Benefits

### For Users
✅ **Data Ownership**: Full control over verified information  
✅ **Privacy**: Can edit personal details without affecting API  
✅ **Customization**: Add social media profiles  
✅ **Consistency**: Data doesn't change when API updates  

### For System
✅ **Data Integrity**: Original API data preserved  
✅ **Flexibility**: Users can customize their information  
✅ **Audit Trail**: Track user modifications vs API data  
✅ **Performance**: Faster queries on user-specific data  

### For Beauty Consultants
✅ **API Independence**: Their data updates don't affect user profiles  
✅ **Multiple Connections**: One BC can connect to multiple users  
✅ **Data Synchronization**: System can compare user vs API data  

## Error Handling

### Migration Failures
```javascript
try {
  await prisma.bc_drwskincare_plus_verified.create({...});
  console.log('✅ Data migrated successfully');
} catch (error) {
  console.error('❌ Migration failed:', error);
  // Continue with connection confirmation
  // User can still access the system
}
```

### Duplicate Prevention
```javascript
const existingVerified = await prisma.bc_drwskincare_plus_verified.findUnique({
  where: { connection_id: connection.id }
});

if (!existingVerified) {
  // Create new record
} else {
  console.log('ℹ️  Verified data already exists');
}
```

## Testing

### Migration Flow Test
```bash
node test-data-migration-flow.js
```

**Validates**:
- Data mapping from API to verified table
- Relationship integrity
- User experience flow
- Error handling scenarios

### API Endpoint Test
```bash
# Test auto-migration
curl -X POST /api/beauty-consultant/connect \
  -d '{"resellerId":"BC12345","input_phone":"081234567890"}'

# Test manual confirmation  
curl -X POST /api/beauty-consultant/confirm \
  -d '{"level":"Senior Beauty Consultant"}'
```

## Production Checklist

- [ ] Database table `bc_drwskincare_plus_verified` created
- [ ] Foreign key constraints established
- [ ] API endpoints deployed and tested
- [ ] Frontend confirmation flow updated
- [ ] Error handling implemented
- [ ] Migration logging enabled
- [ ] User privilege system integrated

## Summary

The data migration system ensures that when users confirm their Beauty Consultant connection, their data is automatically transferred to a user-controlled verified table. This provides the perfect balance between data integrity, user control, and system flexibility.

**Key Achievement**: Users now have complete ownership of their verified data while maintaining connection to the dynamic API source. 🎉