-- SIMPLIFIED N8N QUERY: Hanya Percentage Format
-- Replace "Penambahan Point Loyalitas" node di N8N dengan query ini

WITH event_boost AS (
  SELECT 
    setting_value::numeric / 100 as multiplier,
    setting_value || '% boost event' as event_label
  FROM event_settings 
  WHERE setting_name = 'weekend_point_value'
    AND start_date <= NOW() 
    AND end_date >= NOW()
  LIMIT 1
),
point_calculation AS (
  SELECT 
    COALESCE(eb.multiplier, 1.0) as final_multiplier,
    COALESCE(eb.event_label, 'Normal task') as event_name,
    (10 * COALESCE(eb.multiplier, 1.0))::integer as final_points
  FROM event_boost eb
)
INSERT INTO loyalty_point_history (member_id, event, point, task_id, event_type)
SELECT 
  $1 as member_id,
  'Penyelesaian Tugas (' || pc.event_name || ')',
  pc.final_points,
  $2 as task_id,
  CASE 
    WHEN pc.final_multiplier > 1.0 THEN 'event_boost'
    ELSE 'task_completion'
  END
FROM point_calculation pc
RETURNING json_build_object(
    'member_id', member_id,
    'points_added', point,
    'multiplier_used', (point::numeric / 10),
    'event_description', event,
    'boost_active', (point > 10)
);
