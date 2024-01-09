-- CreateTable
CREATE TABLE "voter" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "first_and_middle_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "street_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "yob" INTEGER NOT NULL,
    "permanent_address" TEXT NOT NULL,
    "comments" TEXT,

    CONSTRAINT "voter_pkey" PRIMARY KEY ("id")
);
