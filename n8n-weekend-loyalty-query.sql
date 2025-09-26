-- OPTIMIZED N8N WORKFLOW: VALIDASI TUGAS dengan Weekend 200% Event
-- Script ini untuk modify node "Penambahan Point Loyalitas" 

-- SEBELUM (Original Query):
-- INSERT INTO loyalty_point_history (member_id, event, point, task_id)
-- VALUES ($1, 'Penyelesaian Tugas', 10, $2)

-- SESUDAH (Weekend 200% Support):
WITH weekend_check AS (
  SELECT 
    CASE 
      WHEN EXTRACT(DOW FROM NOW()) IN (0, 6) THEN 2.0  -- Sunday=0, Saturday=6
      ELSE 1.0 
    END as multiplier,
    CASE 
      WHEN EXTRACT(DOW FROM NOW()) IN (0, 6) THEN true
      ELSE false 
    END as is_weekend
),
point_calculation AS (
  SELECT 
    wc.multiplier,
    wc.is_weekend,
    (10 * wc.multiplier)::integer as final_points,
    CASE 
      WHEN wc.is_weekend THEN 'Penyelesaian Tugas (Weekend 200% Event)'
      ELSE 'Penyelesaian Tugas'
    END as event_name
  FROM weekend_check wc
)
INSERT INTO loyalty_point_history (member_id, event, point, task_id, event_type, comment_id)
SELECT 
  $1 as member_id,
  pc.event_name,
  pc.final_points,
  $2 as task_id,
  CASE WHEN pc.is_weekend THEN 'weekend_event' ELSE 'task_completion' END,
  NULL
FROM point_calculation pc
RETURNING json_build_object(
    'id', id,
    'member_id', member_id,
    'event', event,
    'point', point,
    'task_id', task_id,
    'is_weekend_event', (point > 10),
    'created_at', now()
) AS inserted_loyalty_point;
