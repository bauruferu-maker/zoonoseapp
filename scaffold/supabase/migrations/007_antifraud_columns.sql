-- Migration 007: Anti-fraud columns + photo_url
-- Executed: 2026-03-25 via Supabase SQL Editor

-- Visit verification data (GPS, duration, confidence score)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lat_start DOUBLE PRECISION;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lng_start DOUBLE PRECISION;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lat_end DOUBLE PRECISION;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lng_end DOUBLE PRECISION;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS accuracy_meters DOUBLE PRECISION;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0;

-- Photo URL for visit evidence
ALTER TABLE visits ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Property coordinates for GPS distance calculation
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
