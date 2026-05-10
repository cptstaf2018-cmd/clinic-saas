-- AlterTable
ALTER TABLE "IncomingMessage" ADD COLUMN     "direction" TEXT NOT NULL DEFAULT 'inbound',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'received',
ADD COLUMN     "error" TEXT;

-- CreateIndex
CREATE INDEX "IncomingMessage_clinicId_phone_idx" ON "IncomingMessage"("clinicId", "phone");

-- CreateIndex
CREATE INDEX "IncomingMessage_clinicId_direction_idx" ON "IncomingMessage"("clinicId", "direction");
