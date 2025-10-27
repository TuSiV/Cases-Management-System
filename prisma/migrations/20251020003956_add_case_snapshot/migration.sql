-- CreateTable
CREATE TABLE "CaseSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "snapshotAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,
    CONSTRAINT "CaseSnapshot_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CaseSnapshot_caseId_idx" ON "CaseSnapshot"("caseId");

-- CreateIndex
CREATE INDEX "CaseSnapshot_year_idx" ON "CaseSnapshot"("year");

-- CreateIndex
CREATE UNIQUE INDEX "CaseSnapshot_caseId_year_key" ON "CaseSnapshot"("caseId", "year");
