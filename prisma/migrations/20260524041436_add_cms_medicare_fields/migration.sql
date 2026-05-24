-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "accepts_medicare" BOOLEAN,
ADD COLUMN     "credentials" VARCHAR(20),
ADD COLUMN     "gender" VARCHAR(1),
ADD COLUMN     "telehealth" BOOLEAN;
