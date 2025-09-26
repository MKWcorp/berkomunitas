# Event Boost System Integration Guide

## Overview
Sistem Event Boost telah berhasil diintegrasikan dengan database `event_settings` sehingga perubahan dari admin panel dapat langsung mempengaruhi tampilan event boost di seluruh aplikasi.

## Architecture

### 1. Database Integration
- **Table**: `event_settings`
- **API Routes**: 
  - `GET /api/events` - Fetch all events
  - `POST /api/events` - Create new event
  - `PUT /api/events/[setting_name]` - Update event
  - `DELETE /api/events/[setting_name]` - Delete event

### 2. Hooks System
- **`useEventBoost`**: Core hook dengan database integration
- **`useEventBoostSync`**: Enhanced hook with real-time sync
- **`triggerEventRefresh`**: Function untuk broadcast changes

### 3. Component Architecture
- **EventBoostComponents**: Display components yang responsive
- **EventBoostLiveDemo**: Real-time sync components
- **EventBoostIntegrationDemo**: Testing and demo interface

## Usage Examples

### Basic Usage (Auto-sync with database)
```javascript
import { useEventBoost } from '@/hooks/useEventBoost';

function MyComponent() {
  const {
    isActive,
    isInActivePeriod,
    eventConfig,
    boostPercentage
  } = useEventBoost('WEEKEND_BOOST');

  return (
    <div>
      {isActive && isInActivePeriod && (
        <div>Weekend Boost Active: +{boostPercentage - 100}%</div>
      )}
    </div>
  );
}
```

### Real-time Sync Usage
```javascript
import { useEventBoostSync } from '@/hooks/useEventBoostSync';

function LiveComponent() {
  const eventBoost = useEventBoostSync('MAIN_EVENT');
  
  // Component akan otomatis update saat admin mengubah event
  return <EventBoostBanner {...eventBoost} />;
}
```

### Trigger Manual Refresh (from admin)
```javascript
import { triggerEventRefresh } from '@/hooks/useEventBoostSync';

async function handleSaveEvent(formData) {
  // Save to database
  await saveEventToDatabase(formData);
  
  // Trigger refresh untuk semua components
  await triggerEventRefresh(formData.setting_name);
}
```

## Event Types Configuration

### Static Configuration (useEventBoost.js)
```javascript
const EVENT_BOOST_SETTINGS = {
  MAIN_EVENT: {
    title: "Event Utama",
    description: "Event boost utama dengan reward besar!",
    boostPercentage: 200,
    pointValue: 20,
    isActive: false
  },
  WEEKEND_BOOST: {
    title: "Weekend Point Boost", 
    description: "Dapatkan poin ekstra di akhir pekan!",
    boostPercentage: 150,
    pointValue: 15,
    isActive: false
  },
  SPECIAL_BOOST: {
    title: "Special Event Boost",
    description: "Event khusus dengan bonus spesial!",
    boostPercentage: 300,
    pointValue: 30,
    isActive: false
  }
};
```

### Database Schema
```sql
event_settings:
- setting_name (varchar) - Event type identifier
- setting_value (varchar) - 'true'/'false' untuk activation
- event_name (varchar) - Display name
- description (text) - Event description  
- start_date (datetime) - Event start
- end_date (datetime) - Event end
```

## Integration Flow

### 1. Admin Creates/Updates Event
1. Admin menggunakan admin panel `/admin-app/events`
2. Form submit ke API `/api/events`
3. Database `event_settings` diupdate
4. `triggerEventRefresh()` dipanggil
5. Semua components yang menggunakan `useEventBoostSync` ter-refresh

### 2. Component Displays Event
1. Component menggunakan `useEventBoost` atau `useEventBoostSync`
2. Hook fetch data dari `/api/events`
3. Merge database data dengan static configuration
4. Component render sesuai dengan status event

### 3. Real-time Updates
1. Admin mengubah event di admin panel
2. `triggerEventRefresh()` emit global event change
3. Semua listeners (`useEventBoostSync`) menerima notification
4. Components reload data dari database
5. UI update otomatis tanpa refresh page

## Available Components

### Core Display Components
- **EventBoostBanner**: Full-width banner dengan countdown
- **EventBoostBadge**: Small circular badge  
- **EventBoostInlineDisplay**: Inline text dengan boost indication
- **EventBoostRewardDisplay**: Reward information display
- **EventBoostCompletionDisplay**: Event completion status
- **EventBoostTableDisplay**: Tabular event information

### Live Demo Components  
- **WeekendBoostDisplay**: Auto-sync weekend boost banner
- **MainEventDisplay**: Auto-sync main event badge
- **SpecialBoostDisplay**: Auto-sync special boost inline
- **AllEventsDisplay**: Combined display of all event types

## Testing & Debugging

### Integration Demo
Use `EventBoostIntegrationDemo` component untuk testing:
```javascript
import EventBoostIntegrationDemo from '@/components/EventBoostIntegrationDemo';

// Provides full testing interface with:
// - Event type selector
// - Manual activate/deactivate
// - Save/load from database  
// - Real-time status display
// - Component previews
```

### Debug Information
Hook provides debug information:
```javascript
const {
  isLoading,        // Loading state
  isActive,         // Event active status
  isInActivePeriod, // Within time period
  eventConfig       // Full configuration
} = useEventBoost('WEEKEND_BOOST');
```

## File Structure
```
src/
├── hooks/
│   ├── useEventBoost.js          # Core hook with DB integration
│   └── useEventBoostSync.js      # Real-time sync hook
├── components/
│   ├── EventBoostComponents.js   # Display components
│   ├── EventBoostLiveDemo.js     # Live sync components
│   └── EventBoostIntegrationDemo.js # Testing interface
└── app/admin-app/events/
    └── page.js                   # Admin panel with refresh triggers
```

## Benefits

1. **Real-time Updates**: Components update otomatis saat admin mengubah event
2. **Database Persistence**: Event settings tersimpan di database
3. **Flexible Configuration**: Merge static config dengan dynamic database
4. **Admin Control**: Full control dari admin panel
5. **Auto-expiry**: Event otomatis nonaktif setelah periode berakhir
6. **Performance**: Efficient loading dan caching
7. **Scalable**: Mudah ditambah event types baru

## Next Steps

1. Add notification system saat event berubah
2. Add analytics untuk event effectiveness  
3. Add batch operations untuk multiple events
4. Add event scheduling dengan cron jobs
5. Add user-specific event targeting
6. Add A/B testing untuk different event configs
