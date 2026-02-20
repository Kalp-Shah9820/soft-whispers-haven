-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MAIN_USER', 'PARTNER');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('HAPPY', 'CALM', 'BLOSSOM', 'THOUGHTFUL', 'DREAMY', 'SPARKLE', 'STRONG', 'TENDER', 'TIRED', 'RAINBOW');

-- CreateEnum
CREATE TYPE "VisitMood" AS ENUM ('HAPPY', 'LOW', 'CALM', 'ANXIOUS', 'TIRED', 'SOFT', 'OVERWHELMED');

-- CreateEnum
CREATE TYPE "TargetState" AS ENUM ('STARTING', 'IN_PROGRESS', 'FEELS_GOOD', 'RESTING');

-- CreateEnum
CREATE TYPE "CurrentNeed" AS ENUM ('REST', 'MOTIVATION', 'SPACE', 'SUPPORT', 'SILENCE', 'GENTLE_REMINDERS');

-- CreateEnum
CREATE TYPE "SelfCareCategory" AS ENUM ('WATER', 'SKINCARE', 'REST', 'PERIOD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MAIN_USER',
    "partnerId" TEXT,
    "globalSharing" BOOLEAN NOT NULL DEFAULT false,
    "showWater" BOOLEAN NOT NULL DEFAULT true,
    "showSkincare" BOOLEAN NOT NULL DEFAULT true,
    "showRest" BOOLEAN NOT NULL DEFAULT true,
    "showPeriod" BOOLEAN NOT NULL DEFAULT false,
    "hideEverything" BOOLEAN NOT NULL DEFAULT false,
    "periodStartDate" TEXT,
    "currentNeed" "CurrentNeed" NOT NULL DEFAULT 'GENTLE_REMINDERS',
    "waterReminderFrequency" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dream" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" "Mood" NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL,
    "dreamId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "state" "TargetState" NOT NULL DEFAULT 'STARTING',
    "shared" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thought" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" "Mood" NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thought_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "unlockDate" TEXT,
    "shared" BOOLEAN NOT NULL DEFAULT true,
    "sealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" "VisitMood" NOT NULL,
    "date" TEXT NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfCareItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "SelfCareCategory" NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelfCareItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_partnerId_idx" ON "User"("partnerId");

-- CreateIndex
CREATE INDEX "Dream_userId_idx" ON "Dream"("userId");

-- CreateIndex
CREATE INDEX "Dream_userId_shared_idx" ON "Dream"("userId", "shared");

-- CreateIndex
CREATE INDEX "Target_dreamId_idx" ON "Target"("dreamId");

-- CreateIndex
CREATE INDEX "Thought_userId_idx" ON "Thought"("userId");

-- CreateIndex
CREATE INDEX "Thought_userId_shared_idx" ON "Thought"("userId", "shared");

-- CreateIndex
CREATE INDEX "Letter_userId_idx" ON "Letter"("userId");

-- CreateIndex
CREATE INDEX "Letter_userId_shared_idx" ON "Letter"("userId", "shared");

-- CreateIndex
CREATE INDEX "MoodEntry_userId_idx" ON "MoodEntry"("userId");

-- CreateIndex
CREATE INDEX "MoodEntry_userId_date_idx" ON "MoodEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "MoodEntry_userId_shared_idx" ON "MoodEntry"("userId", "shared");

-- CreateIndex
CREATE UNIQUE INDEX "MoodEntry_userId_date_key" ON "MoodEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "SelfCareItem_userId_date_idx" ON "SelfCareItem"("userId", "date");

-- CreateIndex
CREATE INDEX "SelfCareItem_userId_category_idx" ON "SelfCareItem"("userId", "category");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dream" ADD CONSTRAINT "Dream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodEntry" ADD CONSTRAINT "MoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfCareItem" ADD CONSTRAINT "SelfCareItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
