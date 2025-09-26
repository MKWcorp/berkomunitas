# SQL Queries untuk N8N Workflow Recovery System

## 1. Query untuk Node "Ambil data submission dengan members" (UPDATED)

```sql
SELECT
    s.id AS submission_id,
    s.id_member,
    s.id_task,
    s.waktu_klik,
    s.status_submission,
    psm.username_sosmed,
    t_ai.link_postingan,
    t_ai.keyword_tugas
FROM
    task_submissions s
JOIN
    members m ON s.id_member = m.id
JOIN
    profil_sosial_media psm ON s.id_member = psm.id_member
JOIN
    tugas_ai t_ai ON s.id_task = t_ai.id
WHERE
    s.status_submission IN ('sedang_verifikasi', 'gagal_diverifikasi')
GROUP BY 
    s.id, m.id, psm.username_sosmed, t_ai.id
ORDER BY 
    s.waktu_klik DESC;
```

## 2. Update Logic untuk Node "If1" (Timeout Check)

Conditions untuk timeout (hanya untuk yang masih sedang_verifikasi):
- `{{ $('Loop Over Items').item.json.status_submission }}` equals `sedang_verifikasi`
- `{{ luxon.DateTime.now().diff(luxon.DateTime.fromISO($('Loop Over Items').item.json.waktu_klik), 'hours').hours }}` >= `2`

## 3. Logic Flow Summary

1. **Ambil Data**: Semua submission `sedang_verifikasi` DAN `gagal_diverifikasi`
2. **Cek Keyword**: Untuk setiap submission
3. **If Found**: Apapun status → `selesai` + point + notifikasi
4. **If Not Found + sedang_verifikasi + 2 jam**: → `gagal_diverifikasi` + notifikasi
5. **If Not Found + gagal_diverifikasi**: Skip (tunggu sampai komentar ada)

## Benefits:
- ✅ Instant recovery dari gagal_diverifikasi
- ✅ 2 jam timeout untuk keamanan
- ✅ Auto-healing tanpa manual intervention
- ✅ No time limit untuk recovery
