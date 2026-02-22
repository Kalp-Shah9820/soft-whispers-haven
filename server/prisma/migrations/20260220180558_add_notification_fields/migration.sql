-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyMotivationTime" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "emotionalCheckinEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emotionalCheckinTime" TEXT NOT NULL DEFAULT '20:00',
ADD COLUMN     "periodReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skincareReminderTime" TEXT NOT NULL DEFAULT '08:00';

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_userId_type_date_key" ON "NotificationLog"("userId", "type", "date");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
