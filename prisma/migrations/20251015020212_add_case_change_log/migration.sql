-- CreateTable
CREATE TABLE "CaseChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changeTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedFields" TEXT NOT NULL,
    "oldValues" TEXT NOT NULL,
    "newValues" TEXT NOT NULL,
    "changeDescription" TEXT,
    CONSTRAINT "CaseChangeLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseChangeLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CaseChangeLog_caseId_idx" ON "CaseChangeLog"("caseId");

-- CreateIndex
CREATE INDEX "CaseChangeLog_changedById_idx" ON "CaseChangeLog"("changedById");

-- CreateIndex
CREATE INDEX "CaseChangeLog_changeTime_idx" ON "CaseChangeLog"("changeTime");
