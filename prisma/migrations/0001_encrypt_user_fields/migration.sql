-- Migration: encrypt user email and name + add emailHash for lookups

-- Add emailHash column (nullable, unique)
ALTER TABLE "User" ADD COLUMN "emailHash" TEXT;

-- Unique index on emailHash
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");
