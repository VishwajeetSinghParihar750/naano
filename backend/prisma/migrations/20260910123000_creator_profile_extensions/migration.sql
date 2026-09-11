-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "xUrl" TEXT,
ADD COLUMN "cardSlug" TEXT,
ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "registrationCountry" TEXT,
ADD COLUMN "isRegisteredBusiness" BOOLEAN,
ADD COLUMN "legalName" TEXT,
ADD COLUMN "legalAddress" TEXT,
ADD COLUMN "taxSelfDeclared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "invoiceAuthorized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "bankDetails" JSONB;

-- Backfill unique cardSlug for existing rows
UPDATE "CreatorProfile"
SET "cardSlug" = CASE
  WHEN coalesce(nullif(regexp_replace(lower(coalesce(nullif("name", ''), 'creator')), '[^a-z0-9]+', '-', 'g'), ''), '') = ''
    THEN 'creator-' || substr(replace("id"::text, '-', ''), 1, 8)
  ELSE regexp_replace(lower(coalesce(nullif("name", ''), 'creator')), '[^a-z0-9]+', '-', 'g')
    || '-'
    || substr(replace("id"::text, '-', ''), 1, 8)
END
WHERE "cardSlug" IS NULL;

-- Existing marketplace creators are already past onboarding
UPDATE "CreatorProfile"
SET
  "onboardingComplete" = true,
  "taxSelfDeclared" = true,
  "invoiceAuthorized" = true,
  "registrationCountry" = coalesce("registrationCountry", nullif("country", ''))
WHERE "cardPublished" = true OR "ratePerPostCents" > 0 OR length(coalesce("name", '')) > 0;

ALTER TABLE "CreatorProfile" ALTER COLUMN "cardSlug" SET NOT NULL;

CREATE UNIQUE INDEX "CreatorProfile_cardSlug_key" ON "CreatorProfile"("cardSlug");
