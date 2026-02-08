# Screenshot Upload - Inline Form Implementation (v2.0)

## ✅ Completed Changes

### 1. Removed Modal, Added Inline Expandable Form
**Changed From**: Modal popup (ScreenshotUploadModal.js)
**Changed To**: Inline expandable form (ScreenshotUploadForm.js)

**Benefits**:
- Better UX - tidak interrupt user flow
- Mobile-friendly - tidak ada popup yang menutupi layar
- Lebih natural - form muncul di context task yang tepat

### 2. Component Updates

#### ScreenshotUploadForm.js (NEW)
- Inline compact version
- File: `src/components/tugas/ScreenshotUploadForm.js`
- Props: `task`, `onSubmit`, `onCancel`
- 220 lines (lebih compact dari modal version)

#### TaskCard.js (UPDATED)
- Added expand/collapse state
- Import ScreenshotUploadForm
- Button changes: "Upload Screenshot" ↔ "Tutup"
- Icon changes with ChevronDown/ChevronUp
- File: `src/components/tugas/TaskCard.js`

#### /tugas page.js (UPDATED)
- Removed modal state (`isModalOpen`, `selectedTask`)
- Removed `handleOpenScreenshotModal`
- Updated `handleScreenshotSubmit` to extract task_id from formData
- Removed ScreenshotUploadModal from JSX
- Updated TaskCard props: removed `onOpenScreenshotModal`, added `onScreenshotSubmit`
- File: `src/app/tugas/page.js`

### 3. Icon Visibility Fixed
**Issue**: Share & Detail icons tidak muncul di desktop, hanya mobile
**Fix**: 
- Share icon: Removed `sm:hidden` class, sekarang visible di semua breakpoint
- Detail (Eye) icon: Added ke metadata row, visible untuk semua device
- Both icons dalam action buttons row dengan hover effects

### 4. Emoji Removal
**Changed**: All emoji dihapus dari UI dan alert messages
**Replaced With**: Heroicons only
- ✅ → CheckCircleIcon
- ⏱️ → ClockIcon
- ⚠️ → ExclamationTriangleIcon
- 📸 → CameraIcon
- ⚡ → BoltIcon
- Alert messages: removed emoji, text only

### 5. Navigation to Detail
**Added**: EyeIcon button untuk navigate ke detail page
**Route**: `/tugas/[id]?type={task_type}`
**Implementation**: 
```javascript
router.push(`/tugas/${task.id}?type=${task.task_type}`)
```

---

## 📁 Files Changed

### New Files:
- `src/components/tugas/ScreenshotUploadForm.js` - Inline upload form

### Updated Files:
- `src/components/tugas/TaskCard.js` - Expandable form integration
- `src/app/tugas/page.js` - Removed modal logic

### Deprecated Files:
- `src/components/tugas/ScreenshotUploadModal.js` - No longer used (can be deleted)

---

## ⚠️ Known Issues

### 1. Detail Page Not Updated
**Issue**: `/tugas/[id]` page only supports `tugas_ai` (auto-verify)
**Location**: `src/app/tugas/[id]/page.js` (628 lines, complex)
**Needs**: 
- Check `type` query parameter
- If `type=screenshot`, fetch from `/api/admin/tugas-ai-2/[id]`
- Display ScreenshotUploadForm for screenshot tasks
- Show uploaded screenshots if exist
- Show verification results

**Temporary Workaround**: Navigation works but detail page may not display correctly for screenshot tasks

### 2. API Endpoint Path
**Current**: `/api/admin/tugas-ai-2/[id]` (admin-only)
**Issue**: User-facing detail page using admin endpoint
**Needs**: Create user endpoint `/api/tugas-ai-2/[id]` or update permissions

---

## 🎯 Behavior Summary

### Auto-Verify Tasks:
1. Click "Kerjakan" (blue button with BoltIcon)
2. Opens n8n webhook in new tab
3. No inline form

### Screenshot Tasks:
1. Click "Upload Screenshot" (purple button with CameraIcon)
2. Form expands inline below task card
3. Button changes to "Tutup" with ChevronUpIcon
4. Upload screenshot + paste Instagram link
5. Click "Upload & Submit"
6. Form collapses, confetti shows, list refreshes

### Icons Always Visible:
- **ShareIcon**: Link to Instagram post (all devices)
- **EyeIcon**: Navigate to detail page (all devices)
- **CameraIcon/BoltIcon**: Task type badge
- **Status icons**: CheckCircle/Clock/ExclamationTriangle/PlayCircle

---

## 🔄 Next Actions Required

1. **Update Detail Page** (`/tugas/[id]/page.js`)
   - Add query param check for `type`
   - Conditional fetch based on task type
   - Display ScreenshotUploadForm for screenshot tasks
   - Show uploaded screenshots with verification status

2. **MinIO Integration**
   - Replace placeholder screenshot URL
   - Actual file upload to object storage

3. **n8n Webhook**
   - Trigger AI/OCR verification
   - Callback endpoint for results

4. **Testing**
   - Test inline form on mobile & desktop
   - Verify icon visibility across breakpoints
   - Test expand/collapse behavior
   - Test navigation to detail page

---

## 📸 Screenshot Workflow (Current)

```
[Task Card - Screenshot Type]
├── Header: CameraIcon + Status + Title
├── Description
├── Metadata: Points + Icons (Share, Eye)
├── Button: "Upload Screenshot" (purple)
└── [EXPANDED STATE]
    └── ScreenshotUploadForm
        ├── Instructions + Keywords
        ├── File Upload Area
        ├── Instagram Link Input
        └── Actions: [Batal] [Upload & Submit]
```

When expanded, button changes to:
```
Button: "Tutup" (gray) with ChevronUpIcon
```

---

**Status**: ✅ Inline form working, icons visible, no emoji
**Pending**: Detail page update for screenshot support
**Version**: 2.0 (Inline Form)
**Date**: 2026-02-08
