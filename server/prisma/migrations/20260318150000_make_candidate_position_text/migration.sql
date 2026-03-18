ALTER TABLE "candidate"
ALTER COLUMN "position" TYPE TEXT USING "position"::TEXT;

DROP TYPE IF EXISTS "Position";
