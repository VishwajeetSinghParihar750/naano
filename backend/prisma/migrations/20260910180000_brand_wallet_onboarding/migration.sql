-- AlterTable BrandProfile
ALTER TABLE "BrandProfile" ADD COLUMN "valueProp" TEXT,
ADD COLUMN "icp" JSONB,
ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('topup', 'booking_escrow', 'refund');

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "collaborationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- Backfill existing brands past onboarding
UPDATE "BrandProfile"
SET "onboardingComplete" = true
WHERE length(coalesce("company", '')) > 0;

-- Seed ledger top-ups matching current wallet balances (one synthetic topup each)
INSERT INTO "WalletTransaction" ("id", "brandProfileId", "type", "amountCents", "label", "createdAt")
SELECT gen_random_uuid()::text, "id", 'topup', "walletBalanceCents", 'Opening balance', CURRENT_TIMESTAMP
FROM "BrandProfile"
WHERE "walletBalanceCents" > 0;

CREATE INDEX "WalletTransaction_brandProfileId_idx" ON "WalletTransaction"("brandProfileId");

ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_brandProfileId_fkey"
FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
