/*
  Warnings:

  - You are about to drop the `CaseAnnualTarget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `affiliation` on the `AnnualTarget` table. All the data in the column will be lost.
  - You are about to drop the column `claimAmountTarget` on the `AnnualTarget` table. All the data in the column will be lost.
  - You are about to drop the column `lossPreventionTarget` on the `AnnualTarget` table. All the data in the column will be lost.
  - You are about to drop the column `totalCasesTarget` on the `AnnualTarget` table. All the data in the column will be lost.
  - Added the required column `totalAmountReductionTarget` to the `AnnualTarget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCaseClosureTarget` to the `AnnualTarget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalLossPreventionTarget` to the `AnnualTarget` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CaseAnnualTarget_caseId_annualTargetId_key";

-- DropIndex
DROP INDEX "CaseAnnualTarget_annualTargetId_idx";

-- DropIndex
DROP INDEX "CaseAnnualTarget_caseId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CaseAnnualTarget";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AffiliationTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "annualTargetId" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "caseClosureTarget" INTEGER NOT NULL,
    "amountReductionTarget" REAL NOT NULL,
    "lossPreventionTarget" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AffiliationTarget_annualTargetId_fkey" FOREIGN KEY ("annualTargetId") REFERENCES "AnnualTarget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnualTargetExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "annualTargetId" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "caseClosureActual" INTEGER NOT NULL,
    "amountReductionActual" REAL NOT NULL,
    "lossPreventionActual" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnnualTargetExecution_annualTargetId_fkey" FOREIGN KEY ("annualTargetId") REFERENCES "AnnualTarget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnnualTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "totalCaseClosureTarget" INTEGER NOT NULL,
    "totalAmountReductionTarget" REAL NOT NULL,
    "totalLossPreventionTarget" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "AnnualTarget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnnualTarget_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AnnualTarget" ("createdAt", "createdById", "id", "updatedAt", "updatedById", "year") SELECT "createdAt", "createdById", "id", "updatedAt", "updatedById", "year" FROM "AnnualTarget";
DROP TABLE "AnnualTarget";
ALTER TABLE "new_AnnualTarget" RENAME TO "AnnualTarget";
CREATE UNIQUE INDEX "AnnualTarget_year_key" ON "AnnualTarget"("year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AffiliationTarget_annualTargetId_idx" ON "AffiliationTarget"("annualTargetId");

-- CreateIndex
CREATE INDEX "AffiliationTarget_affiliation_idx" ON "AffiliationTarget"("affiliation");

-- CreateIndex
CREATE INDEX "AnnualTargetExecution_annualTargetId_idx" ON "AnnualTargetExecution"("annualTargetId");

-- CreateIndex
CREATE INDEX "AnnualTargetExecution_affiliation_idx" ON "AnnualTargetExecution"("affiliation");

-- CreateIndex
CREATE INDEX "AnnualTargetExecution_year_idx" ON "AnnualTargetExecution"("year");
