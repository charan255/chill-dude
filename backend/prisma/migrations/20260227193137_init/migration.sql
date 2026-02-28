-- CreateTable
CREATE TABLE "Journal" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "emojis" TEXT[],
    "summary" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);
