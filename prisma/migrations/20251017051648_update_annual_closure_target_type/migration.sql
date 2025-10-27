-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "caseName" TEXT NOT NULL,
    "plaintiffName" TEXT NOT NULL,
    "defendantName" TEXT NOT NULL,
    "opponentType" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "filingDate" DATETIME NOT NULL,
    "trialConclusionDate" DATETIME,
    "executionConclusionDate" DATETIME,
    "litigationStatus" TEXT NOT NULL,
    "causeOfAction" TEXT NOT NULL,
    "disputeResolutionMethod" TEXT NOT NULL,
    "trialInstitution" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "caseDomain" TEXT NOT NULL,
    "claimAmount" REAL NOT NULL,
    "principalAmount" REAL NOT NULL,
    "caseBalance" REAL NOT NULL,
    "annualClosureTarget" TEXT NOT NULL,
    "annualLossPreventionTarget" REAL NOT NULL,
    "annualRealizedAmount" REAL NOT NULL,
    "totalRealizedAmount" REAL NOT NULL,
    "badDebtProvision" TEXT NOT NULL,
    "riskExposure" REAL NOT NULL,
    "projectTeamMembers" TEXT NOT NULL,
    "litigationCosts" REAL NOT NULL,
    "lawFirmSituation" TEXT NOT NULL,
    "agencyFees" REAL NOT NULL,
    "otherExpensesSituation" TEXT NOT NULL,
    "otherExpenses" REAL NOT NULL,
    "collateralSituation" TEXT NOT NULL,
    "basicCaseFacts" TEXT NOT NULL,
    "disposalMeasuresDescription" TEXT NOT NULL,
    "monthlyProgressSituation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "Case_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("affiliation", "agencyFees", "annualClosureTarget", "annualLossPreventionTarget", "annualRealizedAmount", "badDebtProvision", "basicCaseFacts", "caseBalance", "caseDomain", "caseName", "caseNumber", "caseType", "causeOfAction", "claimAmount", "collateralSituation", "createdAt", "createdById", "currentStage", "defendantName", "disposalMeasuresDescription", "disputeResolutionMethod", "executionConclusionDate", "filingDate", "id", "lawFirmSituation", "litigationCosts", "litigationStatus", "monthlyProgressSituation", "opponentType", "otherExpenses", "otherExpensesSituation", "plaintiffName", "principalAmount", "projectTeamMembers", "riskExposure", "status", "totalRealizedAmount", "trialConclusionDate", "trialInstitution", "updatedAt", "updatedById") SELECT "affiliation", "agencyFees", "annualClosureTarget", "annualLossPreventionTarget", "annualRealizedAmount", "badDebtProvision", "basicCaseFacts", "caseBalance", "caseDomain", "caseName", "caseNumber", "caseType", "causeOfAction", "claimAmount", "collateralSituation", "createdAt", "createdById", "currentStage", "defendantName", "disposalMeasuresDescription", "disputeResolutionMethod", "executionConclusionDate", "filingDate", "id", "lawFirmSituation", "litigationCosts", "litigationStatus", "monthlyProgressSituation", "opponentType", "otherExpenses", "otherExpensesSituation", "plaintiffName", "principalAmount", "projectTeamMembers", "riskExposure", "status", "totalRealizedAmount", "trialConclusionDate", "trialInstitution", "updatedAt", "updatedById" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");
CREATE INDEX "Case_caseNumber_idx" ON "Case"("caseNumber");
CREATE INDEX "Case_affiliation_idx" ON "Case"("affiliation");
CREATE INDEX "Case_status_idx" ON "Case"("status");
CREATE INDEX "Case_filingDate_idx" ON "Case"("filingDate");
CREATE INDEX "Case_caseType_idx" ON "Case"("caseType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
