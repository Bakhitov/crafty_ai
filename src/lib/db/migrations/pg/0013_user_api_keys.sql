ALTER TABLE "user" 
  ADD COLUMN IF NOT EXISTS "api_keys" jsonb DEFAULT '{}'::jsonb;

-- Backfill: ensure nulls become {}
UPDATE "user" SET "api_keys" = '{}'::jsonb WHERE "api_keys" IS NULL;


