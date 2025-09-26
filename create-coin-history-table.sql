-- Create coin_history table
-- This table mirrors loyalty_point_history structure for consistency

CREATE TABLE coin_history (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  coin INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comment_id INTEGER NULL,
  event_type TEXT NOT NULL DEFAULT 'manual',
  task_id INTEGER NULL
);

-- Create index for better performance
CREATE INDEX idx_coin_history_member_id ON coin_history(member_id);
CREATE INDEX idx_coin_history_created_at ON coin_history(created_at);
CREATE INDEX idx_coin_history_event_type ON coin_history(event_type);

-- Add comments for documentation
COMMENT ON TABLE coin_history IS 'Tracks all coin balance changes for members';
COMMENT ON COLUMN coin_history.member_id IS 'Reference to members table';
COMMENT ON COLUMN coin_history.event IS 'Description of what caused the coin change';
COMMENT ON COLUMN coin_history.coin IS 'Amount of coin changed (positive for addition, negative for subtraction)';
COMMENT ON COLUMN coin_history.event_type IS 'Type of event: admin_manual, task_completion, redemption, bonus, penalty, etc';
COMMENT ON COLUMN coin_history.comment_id IS 'Reference to comment if coin change was from commenting';
COMMENT ON COLUMN coin_history.task_id IS 'Reference to task if coin change was from task completion';