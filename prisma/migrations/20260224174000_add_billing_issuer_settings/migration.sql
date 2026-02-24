CREATE TABLE "BillingIssuerSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "legalName" TEXT NOT NULL,
  "shortName" TEXT NOT NULL,
  "legalAddress" TEXT NOT NULL,
  "edrpou" TEXT NOT NULL,
  "iban" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "mfo" TEXT,
  "vatNumber" TEXT,
  "signatoryName" TEXT,
  "signatoryPosition" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BillingIssuerSettings_pkey" PRIMARY KEY ("id")
);
