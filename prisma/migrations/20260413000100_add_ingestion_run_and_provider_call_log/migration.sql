-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobKey" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "runSlotStart" DATETIME NOT NULL,
    "slotMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "instanceId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProviderCallLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestAt" DATETIME NOT NULL,
    "responseAt" DATETIME,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorType" TEXT,
    "errorMessage" TEXT,
    "responseSizeBytes" INTEGER,
    "requestMeta" JSONB,
    "responseMeta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderCallLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IngestionRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "IngestionRun_providerKey_runSlotStart_idx" ON "IngestionRun"("providerKey", "runSlotStart");

-- CreateIndex
CREATE INDEX "IngestionRun_status_startedAt_idx" ON "IngestionRun"("status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IngestionRun_jobKey_providerKey_runSlotStart_key" ON "IngestionRun"("jobKey", "providerKey", "runSlotStart");

-- CreateIndex
CREATE INDEX "ProviderCallLog_runId_requestAt_idx" ON "ProviderCallLog"("runId", "requestAt");

-- CreateIndex
CREATE INDEX "ProviderCallLog_providerKey_requestAt_idx" ON "ProviderCallLog"("providerKey", "requestAt");
