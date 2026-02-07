# DRWCorp Employee Tracker

Dashboard untuk HR melacak task completion karyawan DRWCorp dan mengelola matching antara employee records dengan members di platform.

## 🎯 Fitur Utama

### 1. **Task Completion Tracker**
- Melihat siapa yang sudah/belum mengerjakan tugas tertentu
- Filter by divisi
- Tab terpisah: "Sudah Mengerjakan" vs "Belum Mengerjakan"
- **Copy-paste friendly** - 1 click untuk copy list karyawan

### 2. **Employee Management**
- Melihat semua karyawan (285 employees dari 8 divisi)
- Filter by divisi dan matching status
- Search by nama atau email
- Review dan confirm matching suggestions

### 3. **Smart Matching**
- 🟢 **Matched** - Successfully linked to member
- 🟡 **Ambiguous** - Multiple possibilities, needs manual confirmation
- 🔴 **Unmatched** - No member found

## 📦 Setup Instructions

### Step 1: Create Table

```bash
python scripts/create-drwcorp-employees-table.py
```

Output:
- Creates `drwcorp_employees` table
- Creates indexes for performance
- Creates trigger for updated_at

### Step 2: Import Data

```bash
python scripts/import-drwcorp-employees.py
```

Output:
- Parses `karyawan_all.md`
- Smart matching with existing members
- Imports 285 employees with confidence scores

### Step 3: Access Dashboard

Go to: `http://localhost:3000/drwcorp`

## 🔧 Database Schema

```sql
CREATE TABLE drwcorp_employees (
    id SERIAL PRIMARY KEY,
    nama_lengkap VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    divisi VARCHAR(100) NOT NULL,
    member_id INTEGER REFERENCES members(id),
    matching_status VARCHAR(50) DEFAULT 'unmatched',
    matching_confidence FLOAT,
    matching_suggestions JSONB,
    confirmed_at TIMESTAMPTZ,
    confirmed_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📊 Divisi List

1. **Corpora** - 41 employees
2. **Estetika** - 43 employees
3. **Derma Rich** - 108 employees
4. **KIA** - 7 employees
5. **DHI** - 15 employees
6. **DTI** - 14 employees
7. **Dewi Kartika** - 49 employees
8. **CV Wahyu** - 51 employees

**Total: 285 employees**

## 🚀 API Endpoints

### GET `/api/drwcorp/employees`
Get all employees with filters
- Query params: `divisi`, `matchingStatus`, `search`
- Returns: employees list, divisi list, statistics

### GET `/api/drwcorp/employees/[id]`
Get employee detail with task history

### PUT `/api/drwcorp/employees/[id]`
Confirm member match
```json
{
  "member_id": 123
}
```

### GET `/api/drwcorp/task-completion`
Get task completion status for employees
- Query params: `taskId` (required), `divisi`
- Returns: completed list, not completed list, statistics

## 💡 Usage Examples

### For HR Team

**Checking Task Completion:**
1. Open `/drwcorp`
2. Go to "Task Completion Tracker" tab
3. Select task from dropdown
4. Optional: Filter by divisi
5. Switch between "Belum Mengerjakan" and "Sudah Mengerjakan" tabs
6. Click "Copy List" to copy names to clipboard

**Confirming Employee Matches:**
1. Go to "Employee Management" tab
2. Filter by `matching_status: ambiguous`
3. Click "View Suggestions" for each employee
4. Review suggestions with confidence scores
5. Click "✓ Confirm Match" for correct match

## 🔍 Matching Algorithm

### Email Exact Match
- Confidence: 100%
- Auto-matched if employee email === member email

### Name Fuzzy Match
- Uses SequenceMatcher (difflib)
- Threshold: 70% similarity
- Normalized names (lowercase, remove titles)
- Shows top 5 suggestions

### Confidence Levels
- **≥ 95%** - Auto-matched
- **70-94%** - Ambiguous (needs confirmation)
- **< 70%** - Not matched

## 📝 Notes

- **Access**: Public (all users can access)
- **Data Source**: `karyawan_all.md`
- **Auto-refresh**: Statistics update on page load
- **Audit Trail**: Records who confirmed matches (`confirmed_by`, `confirmed_at`)

## 🎨 UI Features

- **Responsive design** - Works on mobile and desktop
- **Color-coded status** - Easy to scan
- **Copy-paste button** - One-click to copy lists
- **Real-time stats** - Completion rate, counts
- **Search & filter** - Quick access to specific employees

## 🔐 Security

- No authentication required (as requested)
- Audit trail for all confirmations
- Read-only task data
- Safe to expose publicly

---

## Quick Start

```bash
# 1. Create table
python scripts/create-drwcorp-employees-table.py

# 2. Import data
python scripts/import-drwcorp-employees.py

# 3. Visit dashboard
# http://localhost:3000/drwcorp

# Done! 🎉
```
