/*
  Warnings:

  - You are about to drop the column `cif` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `Supplier` table. All the data in the column will be lost.
  - The `currency` column on the `Supplier` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `country` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `Supplier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Supplier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contactName` on table `Supplier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Supplier` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."Country" AS ENUM ('ARGENTINA', 'URUGUAY', 'CHILE');

-- DropIndex
DROP INDEX "public"."Supplier_cif_key";

-- AlterTable
ALTER TABLE "public"."Supplier" DROP COLUMN "cif",
DROP COLUMN "lat",
DROP COLUMN "lng",
ADD COLUMN     "country" "public"."Country" NOT NULL,
ADD COLUMN     "hasDebt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pendingGoods" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "contactName" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
DROP COLUMN "currency",
ADD COLUMN     "currency" "public"."Currency"[];

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "public"."Supplier"("email");
