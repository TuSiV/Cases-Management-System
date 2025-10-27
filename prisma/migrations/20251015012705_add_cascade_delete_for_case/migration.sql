-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonthlyProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    CONSTRAINT "MonthlyProgress_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MonthlyProgress_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MonthlyProgress" ("caseId", "content", "createdAt", "createdById", "id") SELECT "caseId", "content", "createdAt", "createdById", "id" FROM "MonthlyProgress";
DROP TABLE "MonthlyProgress";
ALTER TABLE "new_MonthlyProgress" RENAME TO "MonthlyProgress";
CREATE INDEX "MonthlyProgress_caseId_idx" ON "MonthlyProgress"("caseId");
CREATE INDEX "MonthlyProgress_createdById_idx" ON "MonthlyProgress"("createdById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
