-- Sync database structure from production to development
-- Add scraping_jobs table that exists only in production

CREATE TABLE IF NOT EXISTS scraping_jobs (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,
  target_username VARCHAR(255),
  target_content_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  items_scraped INTEGER DEFAULT 0,
  items_expected INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comment to explain the table
COMMENT ON TABLE scraping_jobs IS 'Legacy table for tracking scraping jobs (currently unused)';
