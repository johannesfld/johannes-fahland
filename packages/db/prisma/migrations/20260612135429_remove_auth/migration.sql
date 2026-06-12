/*
  Warnings:

  - You are about to drop the column `userId` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "Tournament" DROP CONSTRAINT "Tournament_userId_fkey";

-- DropIndex
DROP INDEX "Tournament_userId_idx";

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "userId";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "User";
