"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isCoverageCompletePrisma } from "@/lib/turnier/coverage";
import { createRandomDoublesDraw, createRandomSinglesDraw } from "@/lib/turnier/draw";
import { buildStandings } from "@/lib/turnier/standings";
import { bestOfToWinsNeeded, validateSetScore } from "@/lib/turnier/validation";
import { prisma } from "@/lib/prisma";
import type {
  BestOf,
  MatchEntry,
  MatchSet,
  RoundEntry,
  TournamentDetail,
  TournamentFormat,
  TournamentListItem,
} from "@/components/turnier/types";

function toPrismaBestOf(bestOf: BestOf) {
  if (bestOf === 1) return "ONE";
  if (bestOf === 5) return "FIVE";
  return "THREE";
}

function fromPrismaBestOf(bestOf: "ONE" | "THREE" | "FIVE"): BestOf {
  if (bestOf === "ONE") return 1;
  if (bestOf === "FIVE") return 5;
  return 3;
}

function fromPrismaStatus(status: "setup" | "active" | "paused" | "finished") {
  return status;
}

function fromPrismaFormat(format: "SINGLES" | "DOUBLES"): TournamentFormat {
  return format === "SINGLES" ? "singles" : "doubles";
}

function toPrismaFormat(format: TournamentFormat): "SINGLES" | "DOUBLES" {
  return format === "singles" ? "SINGLES" : "DOUBLES";
}

function computeMatchWinner(sets: MatchSet[], bestOf: BestOf): 1 | 2 | null {
  const winsNeeded = bestOfToWinsNeeded(bestOf);
  let team1Wins = 0;
  let team2Wins = 0;
  for (const setEntry of sets) {
    if (setEntry.scoreTeam1 > setEntry.scoreTeam2) team1Wins += 1;
    if (setEntry.scoreTeam2 > setEntry.scoreTeam1) team2Wins += 1;
    if (team1Wins >= winsNeeded) return 1;
    if (team2Wins >= winsNeeded) return 2;
  }
  return null;
}

async function assertTournamentWritable(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!tournament) throw new Error("Turnier nicht gefunden.");
  if (tournament.status === "paused") {
    throw new Error("Während der Turnierpause sind keine Eintragungen erlaubt.");
  }
  if (tournament.status === "finished") {
    throw new Error("Das Turnier ist bereits beendet.");
  }
}

async function getTournamentRaw(tournamentId: string) {
  return prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      players: { orderBy: { createdAt: "asc" } },
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          matches: {
            orderBy: { matchNumber: "asc" },
            include: {
              players: {
                include: { player: true },
              },
              sets: { orderBy: { setNumber: "asc" } },
            },
          },
        },
      },
    },
  });
}

function mapTournamentDetail(raw: NonNullable<Awaited<ReturnType<typeof getTournamentRaw>>>): TournamentDetail {
  const rounds: RoundEntry[] = raw.rounds.map((round) => {
    const matches: MatchEntry[] = round.matches.map((match) => ({
      id: match.id,
      matchNumber: match.matchNumber,
      status: match.status,
      winnerTeam: (match.winnerTeam as 1 | 2 | null) ?? null,
      players: match.players.map((entry) => ({
        playerId: entry.playerId,
        name: entry.player.name,
        team: entry.team as 1 | 2,
      })),
      sets: match.sets.map((setEntry) => ({
        setNumber: setEntry.setNumber,
        scoreTeam1: setEntry.scoreTeam1,
        scoreTeam2: setEntry.scoreTeam2,
      })),
    }));
    return {
      id: round.id,
      roundNumber: round.roundNumber,
      status: round.status,
      matches,
    };
  });

  return {
    id: raw.id,
    name: raw.name,
    status: fromPrismaStatus(raw.status),
    format: fromPrismaFormat(raw.format),
    bestOf: fromPrismaBestOf(raw.bestOf),
    winnerName: raw.winnerName,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    players: raw.players.map((player) => ({
      id: player.id,
      name: player.name,
      active: player.active,
      joinedAtRound: player.joinedAtRound,
      leftAtRound: player.leftAtRound,
      roundsPlayed: player.roundsPlayed,
      roundsSatOut: player.roundsSatOut,
    })),
    rounds,
  };
}

export async function getTournamentList(): Promise<TournamentListItem[]> {
  const user = await getCurrentUser();
  const list = await prisma.tournament.findMany({
    where: user?.id === "guest" ? {} : { userId: user?.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      _count: { select: { players: { where: { active: true } } } },
    },
  });

  return list.map((item) => ({
    id: item.id,
    name: item.name,
    status: item.status,
    format: fromPrismaFormat(item.format),
    bestOf: fromPrismaBestOf(item.bestOf),
    winnerName: item.winnerName,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    playerCount: item._count.players,
  }));
}

export async function getTournamentById(tournamentId: string): Promise<TournamentDetail | null> {
  const raw = await getTournamentRaw(tournamentId);
  if (!raw) return null;
  return mapTournamentDetail(raw);
}

export async function createTournament(name: string, bestOf: BestOf, format: TournamentFormat) {
  const safeName = name.trim();
  if (!safeName) throw new Error("Bitte Turniername eingeben.");
  const user = await getCurrentUser();

  const created = await prisma.tournament.create({
    data: {
      name: safeName,
      bestOf: toPrismaBestOf(bestOf),
      format: toPrismaFormat(format),
      userId: user?.id === "guest" ? null : user?.id,
    },
  });

  revalidatePath("/tischtennis-turnier");
  return created.id;
}

export async function addPlayer(tournamentId: string, name: string) {
  const safeName = name.trim();
  if (!safeName) throw new Error("Bitte Spielernamen eingeben.");

  const existing = await prisma.tournamentPlayer.findFirst({
    where: {
      tournamentId,
      name: safeName,
    },
  });

  if (existing) {
    await prisma.tournamentPlayer.update({
      where: { id: existing.id },
      data: {
        active: true,
        leftAtRound: null,
      },
    });
  } else {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId,
        name: safeName,
      },
    });
  }

  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function updateBestOf(tournamentId: string, bestOf: BestOf) {
  const existing = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!existing) throw new Error("Turnier nicht gefunden.");
  if (existing.status !== "setup") {
    throw new Error("Best-of kann nur vor dem Turnierstart geändert werden.");
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { bestOf: toPrismaBestOf(bestOf) },
  });
  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function removePlayer(tournamentId: string, playerId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { rounds: { select: { roundNumber: true }, orderBy: { roundNumber: "desc" }, take: 1 } },
  });
  const latestRound = tournament?.rounds[0]?.roundNumber ?? null;

  await prisma.tournamentPlayer.update({
    where: { id: playerId },
    data: {
      active: false,
      leftAtRound: latestRound,
    },
  });

  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function reactivatePlayer(tournamentId: string, playerId: string) {
  await prisma.tournamentPlayer.update({
    where: { id: playerId },
    data: {
      active: true,
      leftAtRound: null,
    },
  });
  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function startTournament(tournamentId: string) {
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "active" },
  });
  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function drawRound(tournamentId: string) {
  await assertTournamentWritable(tournamentId);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      players: { where: { active: true } },
      rounds: {
        orderBy: { roundNumber: "desc" },
        include: {
          matches: {
            include: {
              players: true,
            },
          },
        },
      },
    },
  });
  if (!tournament) throw new Error("Turnier nicht gefunden.");

  const format = fromPrismaFormat(tournament.format);
  const activePlayerIds = tournament.players.map((p) => p.id);

  if (format === "doubles") {
    if (activePlayerIds.length < 4) {
      throw new Error("Mindestens vier aktive Spieler sind nötig, um eine Runde auszulosen.");
    }
  } else if (activePlayerIds.length < 2) {
    throw new Error("Mindestens zwei aktive Spieler sind nötig, um eine Runde auszulosen.");
  }

  if (isCoverageCompletePrisma(tournament.rounds, activePlayerIds, format)) {
    throw new Error(
      format === "doubles"
        ? "Alle Partnerpaare sind durchgespielt. Eine weitere Auslosung ist nicht vorgesehen. Du kannst das Turnier beenden."
        : "Alle Gegnerpaare sind durchgespielt. Eine weitere Auslosung ist nicht vorgesehen. Du kannst das Turnier beenden.",
    );
  }

  const previousTeamPairings: Array<[string, string]> = [];
  const previousMatchPairings: Array<[string, string, string, string]> = [];
  const previousOpponentPairings: Array<[string, string]> = [];
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      const team1 = match.players.filter((entry) => entry.team === 1).map((entry) => entry.playerId);
      const team2 = match.players.filter((entry) => entry.team === 2).map((entry) => entry.playerId);
      if (team1.length === 2) {
        previousTeamPairings.push([team1[0], team1[1]]);
      }
      if (team2.length === 2) {
        previousTeamPairings.push([team2[0], team2[1]]);
      }
      if (team1.length === 2 && team2.length === 2) {
        previousMatchPairings.push([team1[0], team1[1], team2[0], team2[1]]);
      }
      if (team1.length === 1 && team2.length === 1) {
        previousOpponentPairings.push([team1[0], team2[0]]);
      }
    }
  }

  const nextRound = (tournament.rounds[0]?.roundNumber ?? 0) + 1;
  const drawPlayers = tournament.players.map((player) => ({
    id: player.id,
    roundsPlayed: player.roundsPlayed,
    roundsSatOut: player.roundsSatOut,
  }));

  if (format === "doubles") {
    const draw = createRandomDoublesDraw(drawPlayers, {
      previousTeamPairings,
      previousMatchPairings,
    });

    if (draw.matches.length === 0) {
      throw new Error("Auslosung ergab keine Matches. Bitte Spielerzahl prüfen.");
    }

    await prisma.$transaction(async (tx) => {
      const round = await tx.round.create({
        data: {
          tournamentId,
          roundNumber: nextRound,
          status: "drawn",
        },
      });

      for (let i = 0; i < draw.matches.length; i += 1) {
        const match = draw.matches[i];
        const createdMatch = await tx.match.create({
          data: {
            roundId: round.id,
            matchNumber: i + 1,
            status: "pending",
          },
        });

        const players = [...match.team1, ...match.team2];
        for (const player of players) {
          const team = match.team1.some((entry) => entry.id === player.id) ? 1 : 2;
          await tx.matchPlayer.create({
            data: {
              matchId: createdMatch.id,
              playerId: player.id,
              team,
            },
          });
        }
      }

      const playedPlayerIds = draw.matches.flatMap((m) => [
        m.team1[0].id,
        m.team1[1].id,
        m.team2[0].id,
        m.team2[1].id,
      ]);

      if (playedPlayerIds.length > 0) {
        await tx.tournamentPlayer.updateMany({
          where: { id: { in: playedPlayerIds } },
          data: { roundsPlayed: { increment: 1 } },
        });
      }

      if (draw.benchedPlayerIds.length > 0) {
        await tx.tournamentPlayer.updateMany({
          where: { id: { in: draw.benchedPlayerIds } },
          data: { roundsSatOut: { increment: 1 } },
        });
      }
    });
  } else {
    const draw = createRandomSinglesDraw(drawPlayers, {
      previousOpponentPairings,
    });

    if (draw.matches.length === 0) {
      throw new Error("Auslosung ergab keine Matches. Bitte Spielerzahl prüfen.");
    }

    await prisma.$transaction(async (tx) => {
      const round = await tx.round.create({
        data: {
          tournamentId,
          roundNumber: nextRound,
          status: "drawn",
        },
      });

      for (let i = 0; i < draw.matches.length; i += 1) {
        const match = draw.matches[i];
        const createdMatch = await tx.match.create({
          data: {
            roundId: round.id,
            matchNumber: i + 1,
            status: "pending",
          },
        });

        await tx.matchPlayer.create({
          data: {
            matchId: createdMatch.id,
            playerId: match.player1.id,
            team: 1,
          },
        });
        await tx.matchPlayer.create({
          data: {
            matchId: createdMatch.id,
            playerId: match.player2.id,
            team: 2,
          },
        });
      }

      const playedPlayerIds = draw.matches.flatMap((m) => [m.player1.id, m.player2.id]);

      if (playedPlayerIds.length > 0) {
        await tx.tournamentPlayer.updateMany({
          where: { id: { in: playedPlayerIds } },
          data: { roundsPlayed: { increment: 1 } },
        });
      }

      if (draw.benchedPlayerIds.length > 0) {
        await tx.tournamentPlayer.updateMany({
          where: { id: { in: draw.benchedPlayerIds } },
          data: { roundsSatOut: { increment: 1 } },
        });
      }
    });
  }

  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function submitSetScore(
  tournamentId: string,
  matchId: string,
  setNumber: number,
  scoreTeam1: unknown,
  scoreTeam2: unknown,
) {
  await assertTournamentWritable(tournamentId);

  const valid = validateSetScore(scoreTeam1, scoreTeam2);
  if (!valid.ok) throw new Error(valid.error);

  await prisma.matchSet.upsert({
    where: {
      matchId_setNumber: {
        matchId,
        setNumber,
      },
    },
    create: {
      matchId,
      setNumber,
      scoreTeam1: valid.scoreTeam1,
      scoreTeam2: valid.scoreTeam2,
    },
    update: {
      scoreTeam1: valid.scoreTeam1,
      scoreTeam2: valid.scoreTeam2,
    },
  });

  await prisma.match.update({
    where: { id: matchId },
    data: { status: "playing" },
  });

  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function completeMatch(tournamentId: string, matchId: string) {
  await assertTournamentWritable(tournamentId);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { round: { include: { tournament: true } }, sets: { orderBy: { setNumber: "asc" } } },
  });
  if (!match) throw new Error("Match nicht gefunden.");

  const winnerTeam = computeMatchWinner(
    match.sets.map((setEntry) => ({
      setNumber: setEntry.setNumber,
      scoreTeam1: setEntry.scoreTeam1,
      scoreTeam2: setEntry.scoreTeam2,
    })),
    fromPrismaBestOf(match.round.tournament.bestOf),
  );

  if (!winnerTeam) throw new Error("Noch kein gültiger Match-Sieger vorhanden.");

  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "completed",
      winnerTeam,
    },
  });

  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

type MatchScoreDraft = {
  setNumber: number;
  scoreTeam1: number;
  scoreTeam2: number;
};

export async function saveAndCompleteMatch(
  tournamentId: string,
  matchId: string,
  draftSets: MatchScoreDraft[],
) {
  await assertTournamentWritable(tournamentId);

  await prisma.$transaction(async (tx) => {
    for (const setEntry of draftSets) {
      const valid = validateSetScore(setEntry.scoreTeam1, setEntry.scoreTeam2);
      if (!valid.ok) continue;
      await tx.matchSet.upsert({
        where: {
          matchId_setNumber: {
            matchId,
            setNumber: setEntry.setNumber,
          },
        },
        create: {
          matchId,
          setNumber: setEntry.setNumber,
          scoreTeam1: valid.scoreTeam1,
          scoreTeam2: valid.scoreTeam2,
        },
        update: {
          scoreTeam1: valid.scoreTeam1,
          scoreTeam2: valid.scoreTeam2,
        },
      });
    }

    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { round: { include: { tournament: true } }, sets: { orderBy: { setNumber: "asc" } } },
    });
    if (!match) throw new Error("Match nicht gefunden.");

    const winnerTeam = computeMatchWinner(
      match.sets.map((setEntry) => ({
        setNumber: setEntry.setNumber,
        scoreTeam1: setEntry.scoreTeam1,
        scoreTeam2: setEntry.scoreTeam2,
      })),
      fromPrismaBestOf(match.round.tournament.bestOf),
    );
    if (!winnerTeam) throw new Error("Noch kein gültiger Match-Sieger vorhanden.");

    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "completed",
        winnerTeam,
      },
    });
  });

  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function completeRound(tournamentId: string, roundId: string) {
  await assertTournamentWritable(tournamentId);

  await prisma.round.update({
    where: { id: roundId },
    data: { status: "completed" },
  });

  const [openRounds, tournament] = await Promise.all([
    prisma.round.count({
      where: { tournamentId, status: { not: "completed" } },
    }),
    prisma.tournament.findUnique({ where: { id: tournamentId }, include: { players: true } }),
  ]);

  if (openRounds === 0 && tournament?.status === "active") {
    const winner = tournament.players
      .filter((player) => player.active)
      .sort((a, b) => b.roundsPlayed - a.roundsPlayed)[0];
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { winnerName: winner?.name ?? null },
    });
  }

  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function pauseTournament(tournamentId: string) {
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "paused" },
  });
  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function resumeTournament(tournamentId: string) {
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "active" },
  });
  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function finishTournament(tournamentId: string) {
  const raw = await getTournamentRaw(tournamentId);
  if (!raw) throw new Error("Turnier nicht gefunden.");
  const standings = buildStandings(mapTournamentDetail(raw));
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: "finished",
      winnerName: standings[0]?.name ?? null,
    },
  });
  revalidatePath(`/tischtennis-turnier/${tournamentId}`);
}

export async function deleteTournament(tournamentId: string) {
  const user = await getCurrentUser();
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { userId: true },
  });
  if (!tournament) throw new Error("Turnier nicht gefunden.");
  if (
    user?.id !== "guest" &&
    tournament.userId &&
    tournament.userId !== user?.id
  ) {
    throw new Error("Keine Berechtigung dieses Turnier zu löschen.");
  }

  await prisma.tournament.delete({ where: { id: tournamentId } });
  revalidatePath("/tischtennis-turnier");
}
