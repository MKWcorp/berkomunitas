# Beauty Consultant Address Enhancement Documentation

## Overview
Added comprehensive address fields and editable form functionality to the Beauty Consultant system, allowing users to complete their detailed address information with Indonesian region autocomplete.

## New Features

### 1. Enhanced Database Schema
Added new columns to `bc_drwskincare_plus_verified` table:
- `desa` - Village/Kelurahan
- `kecamatan` - District/Kecamatan  
- `kabupaten` - Regency/Kabupaten
- `propinsi` - Province/Provinsi
- `kode_pos` - Postal code

### 2. API Endpoints

#### `/api/beauty-consultant/verified` (GET/PUT)
- **GET**: Fetch verified BC data for authenticated user
- **PUT**: Update verified BC data with new address and social media information

#### `/api/regions` (GET/POST)
- **GET**: Fetch Indonesian administrative regions (provinces, regencies, districts, villages)
- **POST**: Search regions by name
- Uses external API: `https://www.emsifa.com/api-wilayah-indonesia/api`

### 3. Frontend Components

#### `EditableBCForm` Component
- Interactive form for editing BC information
- Cascading dropdowns for Indonesian regions
- Social media fields (Instagram, Facebook, TikTok, YouTube)
- Real-time form validation
- Auto-save functionality

### 4. Updated API Endpoints

#### Enhanced existing endpoints:
- `/api/beauty-consultant/confirm/route.js` - Added address fields to verified data creation
- `/api/beauty-consultant/connect/route.js` - Added address fields to verified data creation  
- `/api/user/privileges/route.js` - Enhanced to return address and social media data from verified table

## Usage

### For Connected Beauty Consultants:
1. Visit `/plus` page
2. If already connected, see "Edit Data" button on connection details
3. Click "Edit Data" to enable form editing
4. Fill in detailed address using cascading region dropdowns
5. Add social media usernames (optional)
6. Click "Simpan" to save changes

### Region Selection Flow:
1. **Provinsi** (Province) - Select from dropdown
2. **Kabupaten/Kota** (Regency/City) - Auto-populated based on province
3. **Kecamatan** (District) - Auto-populated based on regency
4. **Desa/Kelurahan** (Village) - Auto-populated based on district
5. **Kode Pos** (Postal Code) - Manual input

## Technical Implementation

### Data Flow:
1. User selects province → Loads regencies for that province
2. User selects regency → Loads districts for that regency  
3. User selects district → Loads villages for that district
4. Form validates and saves complete address data

### Data Priority:
- Verified table data takes priority over API table data
- Original API area field preserved for reference
- Enhanced address details stored in verified table

### Error Handling:
- Graceful fallback if region API unavailable
- Form validation for required fields
- User-friendly error messages
- Proper loading states during region data fetching

## Files Modified/Created:

### New Files:
- `src/components/EditableBCForm.js` - Main editable form component
- `src/app/api/beauty-consultant/verified/route.js` - Verified data CRUD API
- `src/app/api/regions/route.js` - Indonesian region data API

### Modified Files:
- `src/app/api/beauty-consultant/confirm/route.js` - Added address fields
- `src/app/api/beauty-consultant/connect/route.js` - Added address fields  
- `src/app/api/user/privileges/route.js` - Enhanced data response
- `src/app/plus/page.js` - Integrated EditableBCForm component

## Database Changes:
```sql
ALTER TABLE bc_drwskincare_plus_verified 
ADD COLUMN desa VARCHAR(100),
ADD COLUMN kecamatan VARCHAR(100), 
ADD COLUMN kabupaten VARCHAR(100),
ADD COLUMN propinsi VARCHAR(100),
ADD COLUMN kode_pos VARCHAR(10);
```

## Future Enhancements:
- Address validation using postal code
- Map integration for address confirmation
- Export address data for shipping/logistics
- Bulk address update for admin panel
- Address change history tracking