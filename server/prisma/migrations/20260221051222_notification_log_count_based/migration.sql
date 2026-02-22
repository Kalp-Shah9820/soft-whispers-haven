/*
  Warnings:

  - You are about to drop the column `date` on the `NotificationLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "NotificationLog_userId_type_date_key";

-- AlterTable
ALTER TABLE "NotificationLog" DROP COLUMN "date";

-- CreateIndex
CREATE INDEX "NotificationLog_userId_type_sentAt_idx" ON "NotificationLog"("userId", "type", "sentAt");
