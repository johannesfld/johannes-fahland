-- Turnier-Modi: pluggbare Turnierformen (Round-Robin bleibt Default).
-- Rein additiv — bestehende Turniere bleiben ROUND_ROBIN, kein Datenverlust.

-- CreateEnum
CREATE TYPE "TournamentMode" AS ENUM ('ROUND_ROBIN', 'KNOCKOUT', 'SWISS', 'GROUPS_KO');

-- AlterTable
ALTER TABLE "Tournament"
  ADD COLUMN "mode" "TournamentMode" NOT NULL DEFAULT 'ROUND_ROBIN',
  ADD COLUMN "config" JSONB;

-- AlterTable
ALTER TABLE "Round"
  ADD COLUMN "stageLabel" TEXT;

-- AlterTable
ALTER TABLE "Match"
  ADD COLUMN "nextMatchId" TEXT,
  ADD COLUMN "bracketSlot" INTEGER,
  ADD COLUMN "groupLabel" TEXT;
