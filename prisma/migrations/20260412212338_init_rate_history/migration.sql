-- CreateTable
CREATE TABLE "RateProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RateType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "buy" DECIMAL,
    "sell" DECIMAL,
    "avg" DECIMAL,
    "sourceUrl" TEXT,
    "rawPayload" JSONB,
    "providerId" TEXT NOT NULL,
    "rateTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyRate_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "RateProvider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DailyRate_rateTypeId_fkey" FOREIGN KEY ("rateTypeId") REFERENCES "RateType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RateProvider_key_key" ON "RateProvider"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RateType_key_key" ON "RateType"("key");

-- CreateIndex
CREATE INDEX "DailyRate_date_rateTypeId_idx" ON "DailyRate"("date", "rateTypeId");

-- CreateIndex
CREATE INDEX "DailyRate_providerId_rateTypeId_idx" ON "DailyRate"("providerId", "rateTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRate_date_providerId_rateTypeId_key" ON "DailyRate"("date", "providerId", "rateTypeId");
