-- AlterTable
ALTER TABLE "User" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false,
                   ADD COLUMN "password" TEXT NOT NULL DEFAULT '',
                   ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
