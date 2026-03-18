CREATE TABLE "election_voter" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voting_id" INTEGER NOT NULL,
    "voter_id" INTEGER NOT NULL,

    CONSTRAINT "election_voter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "election_voter_voting_id_voter_id_key" ON "election_voter"("voting_id", "voter_id");

ALTER TABLE "election_voter"
ADD CONSTRAINT "election_voter_voting_id_fkey"
FOREIGN KEY ("voting_id") REFERENCES "voting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "election_voter"
ADD CONSTRAINT "election_voter_voter_id_fkey"
FOREIGN KEY ("voter_id") REFERENCES "voter"("voter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "election_voter" ("voting_id", "voter_id")
SELECT v.id, vr.voter_id
FROM "voting" v
CROSS JOIN "voter" vr;
