ALTER TABLE "election_voter"
ADD COLUMN IF NOT EXISTS "extra_fields" JSONB;
