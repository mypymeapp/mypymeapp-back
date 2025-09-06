/*
  Warnings:

  - The values [GITHUB] on the enum `OAuthProvider` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `currency` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `locale` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `lowStockThreshold` on the `CompanySettings` table. All the data in the column will be lost.
  - You are about to drop the column `themePrimaryColor` on the `CompanySettings` table. All the data in the column will be lost.
  - You are about to drop the `StockMovement` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[mail]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rut_Cuit]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mail` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pais` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `razonSocial` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rubroPrincipal` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rut_Cuit` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."FacturaStatus" AS ENUM ('PAGADA', 'POR_PAGAR', 'VENCIDA');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."OAuthProvider_new" AS ENUM ('GOOGLE');
ALTER TABLE "public"."OAuthAccount" ALTER COLUMN "provider" TYPE "public"."OAuthProvider_new" USING ("provider"::text::"public"."OAuthProvider_new");
ALTER TYPE "public"."OAuthProvider" RENAME TO "OAuthProvider_old";
ALTER TYPE "public"."OAuthProvider_new" RENAME TO "OAuthProvider";
DROP TYPE "public"."OAuthProvider_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."StockMovement" DROP CONSTRAINT "StockMovement_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StockMovement" DROP CONSTRAINT "StockMovement_productId_fkey";

-- AlterTable
ALTER TABLE "public"."Company" DROP COLUMN "currency",
DROP COLUMN "locale",
DROP COLUMN "timezone",
ADD COLUMN     "mail" TEXT NOT NULL,
ADD COLUMN     "pais" TEXT NOT NULL,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "razonSocial" TEXT NOT NULL,
ADD COLUMN     "rubroPrincipal" TEXT NOT NULL,
ADD COLUMN     "rut_Cuit" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."CompanySettings" DROP COLUMN "lowStockThreshold",
DROP COLUMN "themePrimaryColor",
ADD COLUMN     "bajoStock" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "tema" TEXT;

-- DropTable
DROP TABLE "public"."StockMovement";

-- CreateTable
CREATE TABLE "public"."Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cif" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "nombreContacto" TEXT,
    "direccion" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "moneda" TEXT NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanyProveedor" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,

    CONSTRAINT "CompanyProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MovimientosStock" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "public"."StockMovementType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "reason" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientosStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_cif_key" ON "public"."Proveedor"("cif");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProveedor_companyId_proveedorId_key" ON "public"."CompanyProveedor"("companyId", "proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_mail_key" ON "public"."Company"("mail");

-- CreateIndex
CREATE UNIQUE INDEX "Company_rut_Cuit_key" ON "public"."Company"("rut_Cuit");

-- AddForeignKey
ALTER TABLE "public"."CompanyProveedor" ADD CONSTRAINT "CompanyProveedor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyProveedor" ADD CONSTRAINT "CompanyProveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "public"."Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimientosStock" ADD CONSTRAINT "MovimientosStock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimientosStock" ADD CONSTRAINT "MovimientosStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
