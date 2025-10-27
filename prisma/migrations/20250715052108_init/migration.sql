-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "Case" (
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
    "annualClosureTarget" REAL NOT NULL,
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
    "monthlyProgressSituation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "Case_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_affiliation_idx" ON "User"("affiliation");

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");

-- CreateIndex
CREATE INDEX "Case_caseNumber_idx" ON "Case"("caseNumber");

-- CreateIndex
CREATE INDEX "Case_affiliation_idx" ON "Case"("affiliation");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_filingDate_idx" ON "Case"("filingDate");

-- CreateIndex
CREATE INDEX "Case_caseType_idx" ON "Case"("caseType");
