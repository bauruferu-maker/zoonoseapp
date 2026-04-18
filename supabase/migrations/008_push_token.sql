-- Migration 008: Push notification token for agents
-- Stores Expo Push Token per user profile

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
