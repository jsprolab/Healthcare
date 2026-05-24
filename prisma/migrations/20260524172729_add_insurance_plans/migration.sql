-- CreateTable
CREATE TABLE "insurance_plans" (
    "id" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_insurance" (
    "provider_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,

    CONSTRAINT "provider_insurance_pkey" PRIMARY KEY ("provider_id","plan_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_plans_slug_key" ON "insurance_plans"("slug");

-- CreateIndex
CREATE INDEX "insurance_plans_insurer_idx" ON "insurance_plans"("insurer");

-- CreateIndex
CREATE INDEX "provider_insurance_plan_id_idx" ON "provider_insurance"("plan_id");

-- AddForeignKey
ALTER TABLE "provider_insurance" ADD CONSTRAINT "provider_insurance_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_insurance" ADD CONSTRAINT "provider_insurance_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "insurance_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
