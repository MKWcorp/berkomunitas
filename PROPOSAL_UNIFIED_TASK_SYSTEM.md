# Proposal: Unified Task System - Refactor task_submissions

**Tanggal:** 9 Februari 2026  
**Status:** Draft untuk koordinasi  
**Impact:** Database Schema, N8n Workflows, API Endpoints

---

## Masalah Sekarang

### Dual-Table Tracking Problem

Kita punya 2 sistem tracking terpisah:

**1. Auto-Verify Tasks (tugas_ai)**
```
tugas_ai → task_submissions
```
- Status tracking: `task_submissions.status_submission`
- Filter query: `WHERE task_submissions.status_submission = 'sedang_verifikasi'`
- N8n monitoring: Webhook dari `task_submissions`

**2. Screenshot Tasks (tugas_ai_2)**
```
tugas_ai_2 → tugas_ai_2_screenshots
```
- Status tracking: `tugas_ai_2_screenshots.status`
- Filter query: `WHERE tugas_ai_2_screenshots.status = 'sedang_verifikasi'`
- N8n monitoring: Belum ada (manual verify)

### Issue yang Terjadi

1. **Filter "Verifikasi" cuma ngebaca `task_submissions`**
   - Screenshot tasks tidak muncul di filter
   - User bingung kenapa task yang di-upload tidak kelihatan
   - Stats showing 0 padahal ada data

2. **Query harus combine 2 tabel**
   ```javascript
   const [tasksAi, tasksAi2] = await Promise.all([
     prisma.tugas_ai.findMany({ include: { task_submissions } }),
     prisma.tugas_ai_2.findMany({ include: { tugas_ai_2_screenshots } })
   ]);
   const allTasks = [...tasksAi, ...tasksAi2]; // Manual combine
   ```

3. **Stats counting kompleks**
   ```javascript
   // Harus hitung dari 2 tabel
   const submissionStats = await prisma.task_submissions.groupBy(...);
   const screenshotStats = await prisma.tugas_ai_2_screenshots.groupBy(...);
   // Manual combine counts
   ```

4. **Tidak scalable**
   - Kalau nanti ada `tugas_ai_3`, `tugas_ai_4` gimana?
   - Setiap task type baru = tabel tracking baru?

---

## Solusi: Unified Task System

### Konsep

**Satu tabel tracking untuk semua jenis task:**

```
                task_submissions (MASTER)
                        |
        +---------------+---------------+
        ↓                               ↓
    tugas_ai                      tugas_ai_2
   (auto-verify)                 (screenshot)
                                        ↓
                            tugas_ai_2_screenshots
                               (detail only)
```

**Benefit:**
- Single source of truth untuk status
- Query jadi simple (1 tabel)
- Stats calculation straight-forward
- Filter works untuk semua task types
- Scalable untuk task types baru

---

## Database Changes

### 1. task_submissions Schema

**Current:**
```sql
CREATE TABLE task_submissions (
  id                 SERIAL PRIMARY KEY,
  id_task            INTEGER NOT NULL,  -- FK to tugas_ai ONLY
  id_member          INTEGER NOT NULL,
  status_submission  VARCHAR(50) DEFAULT 'tersedia',
  waktu_klik         TIMESTAMP,
  -- ... other fields
  CONSTRAINT fk_task_submissions_tugas_ai 
    FOREIGN KEY (id_task) REFERENCES tugas_ai(id),
  CONSTRAINT unique_member_task UNIQUE(id_member, id_task)
);
```

**Proposed:**
```sql
ALTER TABLE task_submissions
  -- Make id_task optional
  ALTER COLUMN id_task DROP NOT NULL;

-- Add new columns
ALTER TABLE task_submissions
  ADD COLUMN task_type VARCHAR(20) DEFAULT 'auto',
  ADD COLUMN tugas_ai_2_id INTEGER;

-- Add constraint: must have one task reference
ALTER TABLE task_submissions
  ADD CONSTRAINT chk_has_task_ref CHECK (
    (id_task IS NOT NULL AND tugas_ai_2_id IS NULL) OR
    (id_task IS NULL AND tugas_ai_2_id IS NOT NULL)
  );

-- Add FK to tugas_ai_2
ALTER TABLE task_submissions
  ADD CONSTRAINT fk_task_submissions_tugas_ai_2
    FOREIGN KEY (tugas_ai_2_id) 
    REFERENCES tugas_ai_2(id) 
    ON DELETE CASCADE;

-- Update unique constraints
ALTER TABLE task_submissions DROP CONSTRAINT unique_member_task;

CREATE UNIQUE INDEX unique_member_auto_task
  ON task_submissions(id_member, id_task)
  WHERE task_type = 'auto' AND id_task IS NOT NULL;

CREATE UNIQUE INDEX unique_member_screenshot_task
  ON task_submissions(id_member, tugas_ai_2_id)
  WHERE task_type = 'screenshot' AND tugas_ai_2_id IS NOT NULL;

-- Add indexes
CREATE INDEX idx_task_submissions_task_type ON task_submissions(task_type);
CREATE INDEX idx_task_submissions_tugas_ai_2_id ON task_submissions(tugas_ai_2_id);
```

**New Structure:**
```
task_submissions:
  - id_task (INTEGER, nullable) → untuk auto-verify tasks
  - tugas_ai_2_id (INTEGER, nullable) → untuk screenshot tasks
  - task_type (VARCHAR: 'auto' | 'screenshot')
  - status_submission → single source of truth
  - (one of id_task or tugas_ai_2_id must be set)
```

### 2. tugas_ai_2_screenshots Changes

**Purpose:** Detail storage only, bukan tracking

```sql
-- Make task_submission_id required (stronger relation)
ALTER TABLE tugas_ai_2_screenshots
  ALTER COLUMN task_submission_id SET NOT NULL;

-- Add unique constraint
ALTER TABLE tugas_ai_2_screenshots
  ADD CONSTRAINT unique_screenshot_per_submission 
    UNIQUE(task_submission_id);

-- Keep member_id for query optimization (redundant tapi useful)
```

### 3. Prisma Schema

**task_submissions:**
```prisma
model task_submissions {
  id                Int       @id @default(autoincrement())
  id_task           Int?      // Auto-verify tasks
  tugas_ai_2_id     Int?      // Screenshot tasks
  task_type         String    @default("auto") @db.VarChar(20)
  id_member         Int
  status_submission String    @default("tersedia") @db.VarChar(50)
  waktu_klik        DateTime?
  tanggal_submission DateTime? @default(now())
  tanggal_verifikasi DateTime?
  admin_notes       String?
  comment_id        Int?
  verified_by       String?
  batas_waktu       DateTime?
  
  // Relations
  tugas_ai          tugas_ai?  @relation(fields: [id_task], references: [id], onDelete: Cascade)
  tugas_ai_2        tugas_ai_2? @relation(fields: [tugas_ai_2_id], references: [id], onDelete: Cascade)
  members           members    @relation(fields: [id_member], references: [id], onDelete: Cascade)
  screenshots       tugas_ai_2_screenshots[]

  @@index([status_submission])
  @@index([task_type])
  @@index([tugas_ai_2_id])
}
```

**tugas_ai_2:**
```prisma
model tugas_ai_2 {
  id                      Int                       @id @default(autoincrement())
  keyword_tugas           String?
  deskripsi_tugas         String?
  status                  String                    @default("tersedia")
  point_value             Int?                      @default(10)
  
  // Relations
  task_submissions        task_submissions[]        // NEW!
  tugas_ai_2_screenshots  tugas_ai_2_screenshots[]
}
```

**tugas_ai_2_screenshots:**
```prisma
model tugas_ai_2_screenshots {
  id                    Int               @id @default(autoincrement())
  tugas_ai_2_id         Int
  member_id             Int?
  task_submission_id    Int               @unique // Now required & unique
  screenshot_url        String
  status                String?           @default("sedang_verifikasi")
  uploaded_at           DateTime          @default(now())
  verified_at           DateTime?
  ai_extracted_text     String?
  ai_confidence_score   Float?
  
  // Relations
  tugas_ai_2            tugas_ai_2        @relation(...)
  task_submission       task_submissions  @relation(...)
  members               members?          @relation(...)
}
```

---

## Data Migration Script

**File:** `prisma/migrations/YYYYMMDD_unified_task_submissions.sql`

```sql
-- Step 1: Add new columns
ALTER TABLE task_submissions 
  ALTER COLUMN id_task DROP NOT NULL,
  ADD COLUMN task_type VARCHAR(20) DEFAULT 'auto',
  ADD COLUMN tugas_ai_2_id INTEGER;

-- Step 2: Update existing auto-verify tasks
UPDATE task_submissions 
SET task_type = 'auto' 
WHERE id_task IS NOT NULL;

-- Step 3: Migrate screenshot tasks from tugas_ai_2_screenshots
INSERT INTO task_submissions (
  id_member,
  tugas_ai_2_id,
  task_type,
  status_submission,
  waktu_klik,
  tanggal_submission,
  tanggal_verifikasi,
  batas_waktu
)
SELECT 
  s.member_id,
  s.tugas_ai_2_id,
  'screenshot',
  s.status,
  s.uploaded_at,
  s.uploaded_at,
  s.verified_at,
  s.uploaded_at + INTERVAL '4 hours'
FROM tugas_ai_2_screenshots s
WHERE s.member_id IS NOT NULL
  AND s.task_submission_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM task_submissions ts 
    WHERE ts.id_member = s.member_id 
      AND ts.tugas_ai_2_id = s.tugas_ai_2_id
  );

-- Step 4: Link screenshots to task_submissions
UPDATE tugas_ai_2_screenshots s
SET task_submission_id = (
  SELECT ts.id 
  FROM task_submissions ts 
  WHERE ts.id_member = s.member_id 
    AND ts.tugas_ai_2_id = s.tugas_ai_2_id
    AND ts.task_type = 'screenshot'
  LIMIT 1
)
WHERE s.member_id IS NOT NULL 
  AND s.task_submission_id IS NULL;

-- Step 5: Add constraints
ALTER TABLE task_submissions
  ADD CONSTRAINT chk_has_task_ref CHECK (
    (id_task IS NOT NULL AND tugas_ai_2_id IS NULL) OR
    (id_task IS NULL AND tugas_ai_2_id IS NOT NULL)
  ),
  ADD CONSTRAINT fk_task_submissions_tugas_ai_2
    FOREIGN KEY (tugas_ai_2_id) 
    REFERENCES tugas_ai_2(id) 
    ON DELETE CASCADE;

-- Step 6: Update unique constraints
ALTER TABLE task_submissions DROP CONSTRAINT unique_member_task;

CREATE UNIQUE INDEX unique_member_auto_task
  ON task_submissions(id_member, id_task)
  WHERE task_type = 'auto' AND id_task IS NOT NULL;

CREATE UNIQUE INDEX unique_member_screenshot_task
  ON task_submissions(id_member, tugas_ai_2_id)
  WHERE task_type = 'screenshot' AND tugas_ai_2_id IS NOT NULL;

-- Step 7: Create indexes
CREATE INDEX idx_task_submissions_task_type ON task_submissions(task_type);
CREATE INDEX idx_task_submissions_tugas_ai_2_id ON task_submissions(tugas_ai_2_id);

-- Step 8: Make task_submission_id required in screenshots
ALTER TABLE tugas_ai_2_screenshots
  ALTER COLUMN task_submission_id SET NOT NULL,
  ADD CONSTRAINT unique_screenshot_per_submission 
    UNIQUE(task_submission_id);
```

---

## API Changes

### 1. Upload Screenshot API

**File:** `src/app/api/tugas/[id]/screenshot/route.js`

**Before:**
```javascript
// Create screenshot only
const screenshot = await prisma.tugas_ai_2_screenshots.create({
  data: {
    tugas_ai_2_id: taskId,
    member_id: memberId,
    screenshot_url: url,
    status: 'sedang_verifikasi'
  }
});
```

**After:**
```javascript
// Create task_submission + screenshot in transaction
const result = await prisma.$transaction(async (tx) => {
  // 1. Create task submission (tracking)
  const submission = await tx.task_submissions.create({
    data: {
      tugas_ai_2_id: taskId,
      task_type: 'screenshot',
      id_member: memberId,
      status_submission: 'sedang_verifikasi',
      waktu_klik: new Date(),
      batas_waktu: new Date(Date.now() + 4 * 60 * 60 * 1000)
    }
  });

  // 2. Create screenshot detail
  const screenshot = await tx.tugas_ai_2_screenshots.create({
    data: {
      tugas_ai_2_id: taskId,
      member_id: memberId,
      task_submission_id: submission.id,
      screenshot_url: url,
      status: 'sedang_verifikasi'
    }
  });

  return { submission, screenshot };
});
```

### 2. Task List API

**File:** `src/app/api/tugas/route.js`

**Before:**
```javascript
// Query 2 tables separately
const [tasksAi, tasksAi2] = await Promise.all([
  prisma.tugas_ai.findMany({
    where: { status: 'tersedia' },
    include: { task_submissions: { where: { id_member: memberId } } }
  }),
  prisma.tugas_ai_2.findMany({
    where: { status: 'tersedia' },
    include: { tugas_ai_2_screenshots: { where: { member_id: memberId } } }
  })
]);

// Manual combine and process
const allTasks = [...processedTasksAi, ...processedTasksAi2];

// Filter in memory
if (filter === 'verifikasi') {
  allTasks = allTasks.filter(t => t.status_submission === 'sedang_verifikasi');
}
```

**After:**
```javascript
// Single query with filter
const submissions = await prisma.task_submissions.findMany({
  where: {
    id_member: memberId,
    ...(filter === 'selesai' && { status_submission: 'selesai' }),
    ...(filter === 'verifikasi' && { 
      status_submission: { in: ['sedang_verifikasi', 'gagal_diverifikasi'] }
    }),
    ...(filter === 'belum' && { 
      status_submission: { in: ['tersedia', 'gagal_diverifikasi'] }
    })
  },
  include: {
    tugas_ai: true,       // Auto-verify task details
    tugas_ai_2: true,     // Screenshot task details
    screenshots: true     // Screenshot-specific data
  },
  orderBy: { waktu_klik: 'desc' }
});

// Convert to unified format
const tasks = submissions.map(sub => {
  const task = sub.task_type === 'auto' ? sub.tugas_ai : sub.tugas_ai_2;
  return {
    ...task,
    task_type: sub.task_type,
    status_submission: sub.status_submission,
    batas_waktu: sub.batas_waktu,
    screenshot_data: sub.screenshots[0] || null
  };
});
```

### 3. Stats API

**File:** `src/app/api/tugas/stats/route.js`

**Before:**
```javascript
// Query both tables
const [submissionStats, screenshotStats] = await Promise.all([
  prisma.task_submissions.groupBy({
    by: ['status_submission'],
    where: { id_member: memberId },
    _count: { id: true }
  }),
  prisma.tugas_ai_2_screenshots.groupBy({
    by: ['status'],
    where: { member_id: memberId },
    _count: { id: true }
  })
]);

// Manual combine counts
let verifying = 0;
submissionStats.forEach(s => {
  if (s.status_submission === 'sedang_verifikasi') verifying += s._count.id;
});
screenshotStats.forEach(s => {
  if (s.status === 'sedang_verifikasi') verifying += s._count.id;
});
```

**After:**
```javascript
// Single query
const stats = await prisma.task_submissions.groupBy({
  by: ['status_submission'],
  where: { id_member: memberId },
  _count: { id: true }
});

// Direct mapping
const verifying = stats.find(s => 
  s.status_submission === 'sedang_verifikasi'
)?._count.id || 0;
```

---

## N8n Workflow Impact

### Workflows yang Perlu Dicek/Update:

#### 1. **Auto-Verify Task Workflow**
**Trigger:** Webhook dari `task_submissions` (existing)

**Current Logic:**
```javascript
// Webhook receives task_submission
// Assumes id_task always exists
const task = await getTaskById(submission.id_task);
```

**New Logic:**
```javascript
// Check task_type first
if (submission.task_type === 'auto') {
  const task = await getAutoTask(submission.id_task);
  // existing verification logic
} else if (submission.task_type === 'screenshot') {
  // Skip or handle differently
  return; // Screenshot has different workflow
}
```

**Perubahan:**
- Add filter: `WHERE task_type = 'auto'` di webhook
- Atau add condition check di workflow awal

#### 2. **Screenshot Verification Workflow**
**Status:** Belum ada (manual verify sekarang)

**Recommended Flow:**
```
Trigger: Webhook on task_submissions INSERT/UPDATE
    ↓
Filter: task_type = 'screenshot'
    ↓
Get screenshot details from tugas_ai_2_screenshots
    ↓
AI Verification (OCR, keyword check)
    ↓
Update task_submissions.status_submission
    ↓
Update tugas_ai_2_screenshots.status
    ↓
Notify member
```

**Webhook Config:**
- Table: `task_submissions`
- Event: `INSERT`, `UPDATE`
- Filter: `NEW.task_type = 'screenshot' AND NEW.status_submission = 'sedang_verifikasi'`

#### 3. **Task Status Monitor**
**Purpose:** Monitoring expired tasks

**Current:**
```sql
-- Mungkin query ke task_submissions only
SELECT * FROM task_submissions 
WHERE status_submission = 'sedang_verifikasi' 
  AND batas_waktu < NOW();
```

**New:**
```sql
-- No change, tapi sekarang include screenshot tasks
SELECT * FROM task_submissions 
WHERE status_submission = 'sedang_verifikasi' 
  AND batas_waktu < NOW()
  -- Automatically includes both auto & screenshot tasks!
```

#### 4. **Coin/Point Distribution**
**Trigger:** Task completion

**Current:**
```javascript
// Listen to task_submissions status = 'selesai'
// Get task dari tugas_ai
const task = await getTugasAi(submission.id_task);
const points = task.point_value;
```

**New:**
```javascript
// Check task_type
let points;
if (submission.task_type === 'auto') {
  const task = await getTugasAi(submission.id_task);
  points = task.point_value;
} else if (submission.task_type === 'screenshot') {
  const task = await getTugasAi2(submission.tugas_ai_2_id);
  points = task.point_value;
}

// Award points (same logic)
await awardCoins(submission.id_member, points);
```

### Yang TIDAK Berubah:

- Webhook table masih `task_submissions` ✅
- Status field masih `status_submission` ✅
- Member tracking masih `id_member` ✅
- Timestamp fields sama ✅

### Checklist N8n Update:

**Phase 1: Investigation**
- [ ] List semua workflow yang query `task_submissions`
- [ ] List semua workflow yang query `tugas_ai_2_screenshots`
- [ ] Check webhook configs
- [ ] Check scheduled tasks/cron

**Phase 2: Update Workflows**
- [ ] Add `task_type` filter di auto-verify workflows
- [ ] Create new screenshot verification workflow
- [ ] Update point distribution logic
- [ ] Update task status monitor
- [ ] Update reporting/analytics queries

**Phase 3: Testing**
- [ ] Test auto-verify flow (existing)
- [ ] Test screenshot upload → verification
- [ ] Test status transitions
- [ ] Test point distribution
- [ ] Test error handling

---

## Migration Timeline

### Phase 1: Preparation (1 hour)
- [ ] Backup production database
- [ ] Review current N8n workflows (list all yang affected)
- [ ] Prepare rollback plan
- [ ] Create migration SQL script
- [ ] Test migration di staging

### Phase 2: Database Migration (30 minutes)
- [ ] Run migration script
- [ ] Verify data integrity
- [ ] Check constraints working
- [ ] Regenerate Prisma client: `npx prisma generate`
- [ ] Test database queries manually

### Phase 3: API Update (1 hour)
- [ ] Update screenshot upload API
- [ ] Update task list API
- [ ] Update stats API
- [ ] Update admin verification API (kalau ada)
- [ ] Deploy API changes

### Phase 4: N8n Update (1-2 hours)
- [ ] Update auto-verify workflow filters
- [ ] Create screenshot verification workflow
- [ ] Update point distribution logic
- [ ] Test all workflows
- [ ] Enable webhooks

### Phase 5: Testing & Monitoring (1 hour)
- [ ] Test user upload screenshot
- [ ] Test auto-verify tasks
- [ ] Monitor N8n executions
- [ ] Check error logs
- [ ] Verify stats calculation

**Total Estimated Time:** 4-5 hours

---

## Rollback Plan

Kalau ada masalah berat:

```sql
-- 1. Drop new constraints
ALTER TABLE task_submissions DROP CONSTRAINT chk_has_task_ref;
ALTER TABLE task_submissions DROP CONSTRAINT fk_task_submissions_tugas_ai_2;
DROP INDEX unique_member_screenshot_task;

-- 2. Remove new columns
ALTER TABLE task_submissions 
  DROP COLUMN task_type,
  DROP COLUMN tugas_ai_2_id;

-- 3. Restore id_task NOT NULL
ALTER TABLE task_submissions ALTER COLUMN id_task SET NOT NULL;

-- 4. Restore old unique constraint
CREATE UNIQUE INDEX unique_member_task 
  ON task_submissions(id_member, id_task);

-- 5. Restore from backup if needed
```

**API:** Revert deployment (Vercel rollback)
**N8n:** Disable new workflows, enable old ones

---

## Success Metrics

**Setelah migration berhasil, cek:**

1. **Database Integrity**
   ```sql
   -- Cek semua submission ada task reference
   SELECT COUNT(*) FROM task_submissions 
   WHERE id_task IS NULL AND tugas_ai_2_id IS NULL;
   -- Result should be: 0
   
   -- Cek semua screenshot punya submission
   SELECT COUNT(*) FROM tugas_ai_2_screenshots 
   WHERE task_submission_id IS NULL;
   -- Result should be: 0
   ```

2. **Query Performance**
   ```javascript
   // Before: 2 queries + combine
   // After: 1 query
   // Time improvement: ~50%
   ```

3. **Filter Accuracy**
   - Filter "Verifikasi" shows screenshot tasks ✅
   - Stats showing correct counts ✅
   - No duplicate tasks ✅

4. **N8n Workflows**
   - Auto-verify workflow masih jalan ✅
   - Screenshot verification workflow aktif ✅
   - Point distribution working ✅
   - No failed executions ✅

---

## Questions untuk Tim N8n

1. **Workflow List**: Bisa kasih list semua workflow yang interact dengan:
   - `task_submissions` table
   - `tugas_ai_2_screenshots` table
   - Status `sedang_verifikasi` / `selesai`

2. **Webhook Config**: Webhook sekarang filter by apa? Perlu update filter?

3. **Scheduled Tasks**: Ada cron/scheduled workflow yang query tables ini?

4. **Error Handling**: Gimana handle kalau:
   - `id_task` NULL tapi workflow expect ada?
   - Task type baru yang belum di-handle?

5. **Testing**: Workflow testing environment ada? Atau test di production?

6. **Monitoring**: Dashboard N8n bisa alert kalau ada execution failed?

---

## Alternatives Considered

### Alternative 1: Keep Dual Tables (Current)
**Pros:** No database changes, no N8n update
**Cons:** 
- Complex queries
- Filter broken
- Not scalable
- Stats calculation complicated

**Decision:** ❌ Rejected - technical debt accumulates

### Alternative 2: Polymorphic without task_type
Use `validation_status` untuk store task type
**Pros:** No new column
**Cons:**
- Abuse of existing field
- Confusing semantics
- Hard to query efficiently

**Decision:** ❌ Rejected - bad practice

### Alternative 3: Shared ID Sequence
tugas_ai_2 ID meneruskan dari tugas_ai
**Pros:** id_task always NOT NULL
**Cons:**
- ID collision risk
- Maintenance nightmare
- Violates database best practice
- Not scalable

**Decision:** ❌ Rejected - too risky

### Alternative 4: Unified Task System (Recommended)
**Pros:**
- Clean architecture
- Scalable
- Simple queries
- Proper FK constraints
- Single source of truth

**Cons:**
- Requires migration
- N8n update needed
- Testing time

**Decision:** ✅ **RECOMMENDED**

---

## Contact

**Tech Questions:** [Your name]
**N8n Coordination:** [PM N8n]
**Database Migration:** [DBA/DevOps]

**Resources:**
- Migration Script: `prisma/migrations/YYYYMMDD_unified_task_submissions.sql`
- API Changes: See "API Changes" section above
- Prisma Schema: `prisma/schema.prisma`
