-- Create event_settings table for managing loyalty point bonus events
CREATE TABLE IF NOT EXISTS event_settings (
    setting_name VARCHAR(100) PRIMARY KEY,
    setting_value INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_event_settings_dates ON event_settings(start_date, end_date);

-- Add some example data
INSERT INTO event_settings (setting_name, setting_value, start_date, end_date) VALUES
('weekend_double_loyalty', 100, '2025-09-14 00:00:00+07', '2025-09-15 23:59:59+07')
ON CONFLICT (setting_name) DO NOTHING;
