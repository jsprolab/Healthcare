-- CreateTable
CREATE TABLE "specialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "slug" TEXT NOT NULL,
    "provider_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "npi" VARCHAR(10) NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "organization_name" TEXT,
    "taxonomy_code" VARCHAR(10),
    "address1" TEXT,
    "address2" TEXT,
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "phone" VARCHAR(20),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "specialty_id" TEXT,
    "city_id" TEXT,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specialties_slug_key" ON "specialties"("slug");

-- CreateIndex
CREATE INDEX "specialties_name_idx" ON "specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_state_idx" ON "cities"("state");

-- CreateIndex
CREATE INDEX "cities_name_state_idx" ON "cities"("name", "state");

-- CreateIndex
CREATE UNIQUE INDEX "providers_npi_key" ON "providers"("npi");

-- CreateIndex
CREATE INDEX "providers_specialty_id_idx" ON "providers"("specialty_id");

-- CreateIndex
CREATE INDEX "providers_city_id_idx" ON "providers"("city_id");

-- CreateIndex
CREATE INDEX "providers_state_idx" ON "providers"("state");

-- CreateIndex
CREATE INDEX "providers_latitude_longitude_idx" ON "providers"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "providers_last_name_first_name_idx" ON "providers"("last_name", "first_name");

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
