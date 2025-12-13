/*
  Warnings:

  - Added the required column `identificationNumber` to the `CarrierProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identificationNumberType` to the `CarrierProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CarrierProfile" ADD COLUMN     "identificationNumber" VARCHAR(50) NOT NULL,
ADD COLUMN     "identificationNumberType" VARCHAR(20) NOT NULL;
