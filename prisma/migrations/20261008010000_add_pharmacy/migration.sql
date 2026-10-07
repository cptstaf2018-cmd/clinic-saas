-- CreateTable
CREATE TABLE "PharmacyProduct" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "category" TEXT NOT NULL DEFAULT 'أدوية',
    "form" TEXT,
    "barcode" TEXT,
    "price" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "requiresRx" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacySale" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacySale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacySaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,

    CONSTRAINT "PharmacySaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PharmacyProduct_clinicId_active_idx" ON "PharmacyProduct"("clinicId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyProduct_clinicId_barcode_key" ON "PharmacyProduct"("clinicId", "barcode");

-- CreateIndex
CREATE INDEX "PharmacySale_clinicId_createdAt_idx" ON "PharmacySale"("clinicId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacySale_clinicId_number_key" ON "PharmacySale"("clinicId", "number");

-- CreateIndex
CREATE INDEX "PharmacySaleItem_saleId_idx" ON "PharmacySaleItem"("saleId");

-- CreateIndex
CREATE INDEX "PharmacySaleItem_productId_idx" ON "PharmacySaleItem"("productId");

-- AddForeignKey
ALTER TABLE "PharmacyProduct" ADD CONSTRAINT "PharmacyProduct_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacySale" ADD CONSTRAINT "PharmacySale_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacySaleItem" ADD CONSTRAINT "PharmacySaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "PharmacySale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacySaleItem" ADD CONSTRAINT "PharmacySaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PharmacyProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

