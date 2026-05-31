CREATE TABLE IF NOT EXISTS pulse_totals (
  topic TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO pulse_totals (topic) VALUES
  ('ai-platforms'),
  ('mlops'),
  ('cloud-security'),
  ('snowflake'),
  ('builder-tools');
