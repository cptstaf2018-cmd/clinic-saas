ALTER TABLE "IncomingMessage" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "IncomingMessage_clinicId_archived_idx" ON "IncomingMessage"("clinicId", "archived");
