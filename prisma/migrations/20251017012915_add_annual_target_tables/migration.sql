-- CreateTable
CREATE TABLE "AnnualTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "affiliation" TEXT NOT NULL,
    "totalCasesTarget" INTEGER NOT NULL,
    "claimAmountTarget" REAL NOT NULL,
    "lossPreventionTarget" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "AnnualTarget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnnualTarget_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseAnnualTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "annualTargetId" TEXT NOT NULL,
    "isIncluded" BOOLEAN NOT NULL,
    "includedDate" DATETIME,
    "includedById" TEXT,
    CONSTRAINT "CaseAnnualTarget_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseAnnualTarget_annualTargetId_fkey" FOREIGN KEY ("annualTargetId") REFERENCES "AnnualTarget" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseAnnualTarget_includedById_fkey" FOREIGN KEY ("includedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AnnualTarget_year_idx" ON "AnnualTarget"("year");

-- CreateIndex
CREATE INDEX "AnnualTarget_affiliation_idx" ON "AnnualTarget"("affiliation");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualTarget_year_affiliation_key" ON "AnnualTarget"("year", "affiliation");

-- CreateIndex
CREATE INDEX "CaseAnnualTarget_caseId_idx" ON "CaseAnnualTarget"("caseId");

-- CreateIndex
CREATE INDEX "CaseAnnualTarget_annualTargetId_idx" ON "CaseAnnualTarget"("annualTargetId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseAnnualTarget_caseId_annualTargetId_key" ON "CaseAnnualTarget"("caseId", "annualTargetId");
