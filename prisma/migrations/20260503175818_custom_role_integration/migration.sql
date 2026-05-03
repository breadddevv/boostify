/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booster" DROP CONSTRAINT "Booster_userId_fkey";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "CustomRole" (
    "id" TEXT NOT NULL,
    "boosterId" TEXT NOT NULL,
    "discordRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_boosterId_key" ON "CustomRole"("boosterId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_discordRoleId_key" ON "CustomRole"("discordRoleId");

-- AddForeignKey
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_boosterId_fkey" FOREIGN KEY ("boosterId") REFERENCES "Booster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
