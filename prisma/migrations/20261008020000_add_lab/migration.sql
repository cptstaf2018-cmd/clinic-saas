
-- CreateTable
CREATE TABLE "LabTest" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" TEXT NOT NULL DEFAULT 'أخرى',
    "unit" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "refLowM" DOUBLE PRECISION,
    "refHighM" DOUBLE PRECISION,
    "refLowF" DOUBLE PRECISION,
    "refHighF" DOUBLE PRECISION,
    "critLow" DOUBLE PRECISION,
    "critHigh" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT,
    "sex" TEXT NOT NULL,
    "age" INTEGER,
    "doctorName" TEXT,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'new',
    "total" INTEGER NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "publicToken" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "testId" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "refLowM" DOUBLE PRECISION,
    "refHighM" DOUBLE PRECISION,
    "refLowF" DOUBLE PRECISION,
    "refHighF" DOUBLE PRECISION,
    "critLow" DOUBLE PRECISION,
    "critHigh" DOUBLE PRECISION,
    "result" DOUBLE PRECISION,
    "flag" TEXT,
    "enteredAt" TIMESTAMP(3),

    CONSTRAINT "LabOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabTest_clinicId_active_idx" ON "LabTest"("clinicId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_publicToken_key" ON "LabOrder"("publicToken");

-- CreateIndex
CREATE INDEX "LabOrder_clinicId_status_idx" ON "LabOrder"("clinicId", "status");

-- CreateIndex
CREATE INDEX "LabOrder_clinicId_createdAt_idx" ON "LabOrder"("clinicId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_clinicId_number_key" ON "LabOrder"("clinicId", "number");

-- CreateIndex
CREATE INDEX "LabOrderItem_orderId_idx" ON "LabOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "LabOrderItem_testId_idx" ON "LabOrderItem"("testId");

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrderItem" ADD CONSTRAINT "LabOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "LabOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrderItem" ADD CONSTRAINT "LabOrderItem_testId_fkey" FOREIGN KEY ("testId") REFERENCES "LabTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

