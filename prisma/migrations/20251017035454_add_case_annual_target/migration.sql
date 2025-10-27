-- CreateTable
CREATE TABLE "CaseAnnualTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "annualTargetId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isIncludedInTarget" BOOLEAN NOT NULL DEFAULT false,
    "caseClosureTarget" REAL NOT NULL,
    "lossPreventionTarget" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CaseAnnualTarget_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseAnnualTarget_annualTargetId_fkey" FOREIGN KEY ("annualTargetId") REFERENCES "AnnualTarget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CaseAnnualTarget_caseId_idx" ON "CaseAnnualTarget"("caseId");

-- CreateIndex
CREATE INDEX "CaseAnnualTarget_annualTargetId_idx" ON "CaseAnnualTarget"("annualTargetId");

-- CreateIndex
CREATE INDEX "CaseAnnualTarget_year_idx" ON "CaseAnnualTarget"("year");

-- CreateIndex
CREATE UNIQUE INDEX "CaseAnnualTarget_caseId_annualTargetId_key" ON "CaseAnnualTarget"("caseId", "annualTargetId");
