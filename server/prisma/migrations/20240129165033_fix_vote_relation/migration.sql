-- DropForeignKey
ALTER TABLE "vote" DROP CONSTRAINT "vote_voterId_fkey";

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "voter"("voter_id") ON DELETE RESTRICT ON UPDATE CASCADE;
