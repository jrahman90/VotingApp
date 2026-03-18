ALTER TABLE "voting"
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT false;

WITH latest_voting AS (
    SELECT id
    FROM "voting"
    ORDER BY created_at DESC
    LIMIT 1
)
UPDATE "voting"
SET "is_active" = true
WHERE id IN (SELECT id FROM latest_voting);
