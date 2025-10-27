-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CaseAnnualTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "annualTargetId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isIncludedInTarget" BOOLEAN NOT NULL DEFAULT false,
    "caseClosureTarget" TEXT NOT NULL,
    "amountReductionTarget" REAL NOT NULL DEFAULT 0,
    "lossPreventionTarget" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CaseAnnualTarget_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseAnnualTarget_annualTargetId_fkey" FOREIGN KEY ("annualTargetId") REFERENCES "AnnualTarget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CaseAnnualTarget" ("annualTargetId", "caseClosureTarget", "caseId", "createdAt", "id", "isIncludedInTarget", "lossPreventionTarget", "updatedAt", "year") SELECT "annualTargetId", "caseClosureTarget", "caseId", "createdAt", "id", "isIncludedInTarget", "lossPreventionTarget", "updatedAt", "year" FROM "CaseAnnualTarget";
DROP TABLE "CaseAnnualTarget";
ALTER TABLE "new_CaseAnnualTarget" RENAME TO "CaseAnnualTarget";
CREATE INDEX "CaseAnnualTarget_caseId_idx" ON "CaseAnnualTarget"("caseId");
CREATE INDEX "CaseAnnualTarget_annualTargetId_idx" ON "CaseAnnualTarget"("annualTargetId");
CREATE INDEX "CaseAnnualTarget_year_idx" ON "CaseAnnualTarget"("year");
CREATE INDEX "CaseAnnualTarget_caseId_year_idx" ON "CaseAnnualTarget"("caseId", "year");
CREATE UNIQUE INDEX "CaseAnnualTarget_caseId_annualTargetId_key" ON "CaseAnnualTarget"("caseId", "annualTargetId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
