ALTER TABLE "voting"
ADD COLUMN "img" TEXT NOT NULL DEFAULT 'https://placehold.co/240x240/png?text=Election';

ALTER TABLE "candidate"
ADD COLUMN "img" TEXT NOT NULL DEFAULT 'https://placehold.co/120x120/png?text=Candidate';
