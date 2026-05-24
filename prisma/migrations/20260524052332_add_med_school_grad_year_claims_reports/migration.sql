-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "accepting_patients" BOOLEAN,
ADD COLUMN     "grad_year" INTEGER,
ADD COLUMN     "med_school" TEXT;

-- CreateTable
CREATE TABLE "data_reports" (
    "id" TEXT NOT NULL,
    "npi" VARCHAR(10) NOT NULL,
    "field" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_claims" (
    "id" TEXT NOT NULL,
    "npi" VARCHAR(10) NOT NULL,
    "claimant_name" TEXT NOT NULL,
    "claimant_email" TEXT NOT NULL,
    "accepting_patients" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_reports_npi_idx" ON "data_reports"("npi");

-- CreateIndex
CREATE INDEX "provider_claims_npi_idx" ON "provider_claims"("npi");
