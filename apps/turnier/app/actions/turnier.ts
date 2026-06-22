"use server";

import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@pasch/db";
import { buildStandings } from "@/lib/turnier/standings";
import { bestOfToWinsNeeded, validateSetScore } from "@/lib/turnier/validation";
import { getEngine } from "@/lib/turnier/modes";
import type { EngineRound } from "@/lib/turnier/modes";
import type {
  BestOf,
  MatchEntry,
  MatchSet,
  RoundEntry,
  TournamentConfig,
  TournamentDetail,
  TournamentFormat,
  TournamentListItem,
  TournamentMode,
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

type PrismaMode = "ROUND_ROBIN" | "KNOCKOUT" | "SWISS" | "GROUPS_KO";

function fromPrismaMode(mode: PrismaMode): TournamentMode {
  switch (mode) {
    case "KNOCKOUT":
      return "knockout";
    case "SWISS":
      return "swiss";
    case "GROUPS_KO":
      return "groups_ko";
    default:
      return "round_robin";
  }
}

function toPrismaMode(mode: TournamentMode): PrismaMode {
  switch (mode) {
    case "knockout":
      return "KNOCKOUT";
    case "swiss":
      return "SWISS";
    case "groups_ko":
      return "GROUPS_KO";
    default:
      return "ROUND_ROBIN";
  }
}

function parseConfig(value: unknown): TournamentConfig | null {
  if (!value || typeof value !== "object") return null;
  return value as TournamentConfig;
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

const tournamentRawInclude = {
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
} satisfies Prisma.TournamentInclude;

type TournamentRaw = Prisma.TournamentGetPayload<{ include: typeof tournamentRawInclude }>;

async function getTournamentRaw(tournamentId: string) {
  return prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: tournamentRawInclude,
  });
}

function mapTournamentDetail(raw: TournamentRaw): TournamentDetail {
  const rounds: RoundEntry[] = raw.rounds.map((round) => {
    const matches: MatchEntry[] = round.matches.map((match) => ({
      id: match.id,
      matchNumber: match.matchNumber,
      status: match.status,
      winnerTeam: (match.winnerTeam as 1 | 2 | null) ?? null,
      groupLabel: match.groupLabel ?? null,
      bracketSlot: match.bracketSlot ?? null,
      nextMatchId: match.nextMatchId ?? null,
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
      stageLabel: round.stageLabel ?? null,
      matches,
    };
  });

  return {
    id: raw.id,
    name: raw.name,
    status: fromPrismaStatus(raw.status),
    format: fromPrismaFormat(raw.format),
    mode: fromPrismaMode(raw.mode as PrismaMode),
    config: parseConfig(raw.config),
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
  const list = await prisma.tournament.findMany({
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
    mode: fromPrismaMode(item.mode as PrismaMode),
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

export async function createTournament(
  name: string,
  bestOf: BestOf,
  format: TournamentFormat,
  mode: TournamentMode = "round_robin",
  config: TournamentConfig | null = null,
) {
  const safeName = name.trim();
  if (!safeName) throw new Error("Bitte Turniername eingeben.");

  // Modi außer Round-Robin sind aktuell Einzel-basiert.
  const engine = getEngine(mode);
  const effectiveFormat: TournamentFormat = engine.supportsFormats.includes(format)
    ? format
    : engine.supportsFormats[0];

  const created = await prisma.tournament.create({
    data: {
      name: safeName,
      bestOf: toPrismaBestOf(bestOf),
      format: toPrismaFormat(effectiveFormat),
      mode: toPrismaMode(mode),
      config: config ? (config as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });

  revalidatePath("/");
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

  revalidatePath(`/${tournamentId}`);
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
  revalidatePath(`/${tournamentId}`);
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

  revalidatePath(`/${tournamentId}`);
}

export async function reactivatePlayer(tournamentId: string, playerId: string) {
  await prisma.tournamentPlayer.update({
    where: { id: playerId },
    data: {
      active: true,
      leftAtRound: null,
    },
  });
  revalidatePath(`/${tournamentId}`);
}

export async function startTournament(tournamentId: string) {
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "active" },
  });
  revalidatePath(`/${tournamentId}`);
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
              sets: true,
            },
          },
        },
      },
    },
  });
  if (!tournament) throw new Error("Turnier nicht gefunden.");

  const format = fromPrismaFormat(tournament.format);
  const mode = fromPrismaMode(tournament.mode as PrismaMode);
  const config = parseConfig(tournament.config);
  const engine = getEngine(mode);
  const activePlayers = tournament.players.map((p) => ({
    id: p.id,
    roundsPlayed: p.roundsPlayed,
    roundsSatOut: p.roundsSatOut,
  }));

  const minPlayersNeeded = engine.minPlayers({
    format,
    config,
    activePlayers,
    rounds: [],
  });
  if (activePlayers.length < minPlayersNeeded) {
    throw new Error(
      `Mindestens ${minPlayersNeeded} aktive Spieler sind nötig, um eine Runde auszulosen.`,
    );
  }

  const engineRounds: EngineRound[] = tournament.rounds.map((round) => ({
    roundNumber: round.roundNumber,
    status: round.status,
    matches: round.matches.map((match) => ({
      status: match.status,
      winnerTeam: match.winnerTeam,
      players: match.players.map((p) => ({ playerId: p.playerId, team: p.team })),
      sets: match.sets.map((s) => ({ scoreTeam1: s.scoreTeam1, scoreTeam2: s.scoreTeam2 })),
      // groupLabel über das Match getragen für Gruppen-Modus:
      ...(match.groupLabel ? { groupLabel: match.groupLabel } : {}),
    })),
    ...(round.stageLabel ? { stageLabel: round.stageLabel } : {}),
  }));

  const ctx = { format, config, activePlayers, rounds: engineRounds };

  if (engine.isComplete(ctx)) {
    throw new Error(
      "Das Turnier ist nach diesem Modus durchgespielt. Eine weitere Auslosung ist nicht vorgesehen. Du kannst das Turnier beenden.",
    );
  }

  const outcome = engine.drawNextRound(ctx);
  if (!outcome.ok) throw new Error(outcome.error);
  const plan = outcome.plan;

  if (plan.matches.length === 0) {
    throw new Error("Auslosung ergab keine Matches. Bitte Spielerzahl prüfen.");
  }

  const nextRound = (tournament.rounds[0]?.roundNumber ?? 0) + 1;

  await prisma.$transaction(async (tx) => {
    const round = await tx.round.create({
      data: {
        tournamentId,
        roundNumber: nextRound,
        status: "drawn",
        stageLabel: plan.stageLabel ?? null,
      },
    });

    for (let i = 0; i < plan.matches.length; i += 1) {
      const match = plan.matches[i];
      const createdMatch = await tx.match.create({
        data: {
          roundId: round.id,
          matchNumber: i + 1,
          status: "pending",
          groupLabel: match.groupLabel ?? null,
          bracketSlot: match.bracketSlot ?? null,
        },
      });

      for (const playerId of match.team1) {
        await tx.matchPlayer.create({
          data: { matchId: createdMatch.id, playerId, team: 1 },
        });
      }
      for (const playerId of match.team2) {
        await tx.matchPlayer.create({
          data: { matchId: createdMatch.id, playerId, team: 2 },
        });
      }
    }

    const playedPlayerIds = plan.matches.flatMap((m) => [...m.team1, ...m.team2]);
    if (playedPlayerIds.length > 0) {
      await tx.tournamentPlayer.updateMany({
        where: { id: { in: playedPlayerIds } },
        data: { roundsPlayed: { increment: 1 } },
      });
    }
    if (plan.benchedPlayerIds.length > 0) {
      await tx.tournamentPlayer.updateMany({
        where: { id: { in: plan.benchedPlayerIds } },
        data: { roundsSatOut: { increment: 1 } },
      });
    }
  });

  revalidatePath(`/${tournamentId}`);
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

  revalidatePath(`/${tournamentId}`);
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

  revalidatePath(`/${tournamentId}`);
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

  revalidatePath(`/${tournamentId}`);
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
    // Vorläufiger Zwischen-Sieger (echtes Finalergebnis erst bei finishTournament).
    const raw = await getTournamentRaw(tournamentId);
    const winnerName = raw ? computeWinnerName(raw) : null;
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { winnerName },
    });
  }

  revalidatePath(`/${tournamentId}`);
}

/** Sieger je Modus: K.o./Gruppe+K.o. = Sieger des Finales, sonst Tabellenführer. */
function computeWinnerName(raw: TournamentRaw): string | null {
  const detail = mapTournamentDetail(raw);
  const mode = detail.mode;
  if (mode === "knockout" || mode === "groups_ko") {
    // Finale = letzte Runde mit genau einem Match.
    const sorted = [...detail.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      const round = sorted[i];
      const koMatches =
        mode === "groups_ko" ? round.matches.filter((m) => !m.groupLabel) : round.matches;
      if (koMatches.length === 1 && koMatches[0].status === "completed" && koMatches[0].winnerTeam) {
        const champ = koMatches[0].players.find((p) => p.team === koMatches[0].winnerTeam);
        return champ?.name ?? null;
      }
    }
  }
  const standings = buildStandings(detail);
  return standings[0]?.name ?? null;
}

export async function pauseTournament(tournamentId: string) {
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "paused" },
  });
  revalidatePath(`/${tournamentId}`);
}

export async function resumeTournament(tournamentId: string) {
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "active" },
  });
  revalidatePath(`/${tournamentId}`);
}

export async function finishTournament(tournamentId: string) {
  const raw = await getTournamentRaw(tournamentId);
  if (!raw) throw new Error("Turnier nicht gefunden.");
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: "finished",
      winnerName: computeWinnerName(raw),
    },
  });
  revalidatePath(`/${tournamentId}`);
}

export async function deleteTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!tournament) throw new Error("Turnier nicht gefunden.");

  await prisma.tournament.delete({ where: { id: tournamentId } });
  revalidatePath("/");
}
