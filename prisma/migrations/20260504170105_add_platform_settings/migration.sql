-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "logoUrl" TEXT,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
