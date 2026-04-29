-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bestOf" TEXT NOT NULL DEFAULT 'THREE',
    "status" TEXT NOT NULL DEFAULT 'setup',
    "winnerName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Tournament_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TournamentPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAtRound" INTEGER NOT NULL DEFAULT 1,
    "leftAtRound" INTEGER,
    "roundsPlayed" INTEGER NOT NULL DEFAULT 0,
    "roundsSatOut" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'drawn',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "winnerTeam" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "team" INTEGER NOT NULL,

    PRIMARY KEY ("matchId", "playerId"),
    CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "TournamentPlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchSet" (
    "matchId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "scoreTeam1" INTEGER NOT NULL,
    "scoreTeam2" INTEGER NOT NULL,

    PRIMARY KEY ("matchId", "setNumber"),
    CONSTRAINT "MatchSet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Tournament_status_updatedAt_idx" ON "Tournament"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Tournament_userId_idx" ON "Tournament"("userId");

-- CreateIndex
CREATE INDEX "TournamentPlayer_tournamentId_active_idx" ON "TournamentPlayer"("tournamentId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPlayer_tournamentId_name_key" ON "TournamentPlayer"("tournamentId", "name");

-- CreateIndex
CREATE INDEX "Round_tournamentId_status_idx" ON "Round"("tournamentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Round_tournamentId_roundNumber_key" ON "Round"("tournamentId", "roundNumber");

-- CreateIndex
CREATE INDEX "Match_roundId_status_idx" ON "Match"("roundId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Match_roundId_matchNumber_key" ON "Match"("roundId", "matchNumber");

-- CreateIndex
CREATE INDEX "MatchPlayer_playerId_idx" ON "MatchPlayer"("playerId");

-- CreateIndex
CREATE INDEX "MatchPlayer_matchId_team_idx" ON "MatchPlayer"("matchId", "team");
