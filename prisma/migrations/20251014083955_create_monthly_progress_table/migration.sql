-- CreateTable
CREATE TABLE "MonthlyProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    CONSTRAINT "MonthlyProgress_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyProgress_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MonthlyProgress_caseId_idx" ON "MonthlyProgress"("caseId");

-- CreateIndex
CREATE INDEX "MonthlyProgress_createdById_idx" ON "MonthlyProgress"("createdById");
