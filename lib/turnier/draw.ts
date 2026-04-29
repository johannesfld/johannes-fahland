type DrawPlayer = {
  id: string;
  roundsPlayed: number;
  roundsSatOut: number;
};

type Team = [DrawPlayer, DrawPlayer];

export type DrawResult = {
  matches: Array<{ team1: Team; team2: Team }>;
  benchedPlayerIds: string[];
  byeTeam: Team | null;
};

export type DrawOptions = {
  previousTeamPairings?: Array<[string, string]>;
  previousMatchPairings?: Array<[string, string, string, string]>;
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function matchKey(t1: [string, string], t2: [string, string]) {
  const t1Key = pairKey(t1[0], t1[1]);
  const t2Key = pairKey(t2[0], t2[1]);
  return [t1Key, t2Key].sort().join("#");
}

function buildTeams(
  players: DrawPlayer[],
  forbiddenTeamKeys: Set<string>,
): Team[] | null {
  if (players.length === 0) return [];
  if (players.length % 2 !== 0) return null;

  const remaining = [...players];
  const result: Team[] = [];

  while (remaining.length > 0) {
    const head = remaining.shift()!;
    let partnerIndex = -1;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      if (!forbiddenTeamKeys.has(pairKey(head.id, candidate.id))) {
        partnerIndex = i;
        break;
      }
    }

    if (partnerIndex === -1) {
      partnerIndex = 0;
    }

    const partner = remaining.splice(partnerIndex, 1)[0];
    result.push([head, partner]);
  }

  return result;
}

function pairTeamsIntoMatches(
  teams: Team[],
  forbiddenMatchKeys: Set<string>,
): { matches: Array<{ team1: Team; team2: Team }>; byeTeam: Team | null } {
  const remaining = [...teams];
  const matches: Array<{ team1: Team; team2: Team }> = [];
  let byeTeam: Team | null = null;

  while (remaining.length > 0) {
    const head = remaining.shift()!;
    if (remaining.length === 0) {
      byeTeam = head;
      break;
    }

    let opponentIndex = -1;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const key = matchKey(
        [head[0].id, head[1].id],
        [candidate[0].id, candidate[1].id],
      );
      if (!forbiddenMatchKeys.has(key)) {
        opponentIndex = i;
        break;
      }
    }

    if (opponentIndex === -1) {
      opponentIndex = 0;
    }

    const opponent = remaining.splice(opponentIndex, 1)[0];
    matches.push({ team1: head, team2: opponent });
  }

  return { matches, byeTeam };
}

export function createRandomDoublesDraw(
  players: DrawPlayer[],
  options: DrawOptions = {},
): DrawResult {
  if (players.length < 4) {
    return { matches: [], benchedPlayerIds: players.map((p) => p.id), byeTeam: null };
  }

  const forbiddenTeamKeys = new Set(
    (options.previousTeamPairings ?? []).map(([a, b]) => pairKey(a, b)),
  );
  const forbiddenMatchKeys = new Set(
    (options.previousMatchPairings ?? []).map(([a, b, c, d]) =>
      matchKey([a, b], [c, d]),
    ),
  );

  const ordered = shuffle(players).sort((a, b) => {
    if (a.roundsPlayed !== b.roundsPlayed) return a.roundsPlayed - b.roundsPlayed;
    return a.roundsSatOut - b.roundsSatOut;
  });

  const usableCount = Math.floor(ordered.length / 4) * 4;
  const inRound = ordered.slice(0, usableCount);
  const benchedPlayerIds = ordered.slice(usableCount).map((p) => p.id);

  let bestTeams: Team[] | null = null;
  let bestRepeats = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = buildTeams(shuffle(inRound), forbiddenTeamKeys);
    if (!candidate) continue;
    const repeats = candidate.reduce(
      (acc, team) => acc + (forbiddenTeamKeys.has(pairKey(team[0].id, team[1].id)) ? 1 : 0),
      0,
    );
    if (repeats < bestRepeats) {
      bestTeams = candidate;
      bestRepeats = repeats;
      if (repeats === 0) break;
    }
  }

  const teams = bestTeams ?? buildTeams(inRound, forbiddenTeamKeys) ?? [];

  let bestMatches: { matches: Array<{ team1: Team; team2: Team }>; byeTeam: Team | null } | null = null;
  let bestMatchRepeats = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = pairTeamsIntoMatches(shuffle(teams), forbiddenMatchKeys);
    const repeats = candidate.matches.reduce(
      (acc, match) =>
        acc +
        (forbiddenMatchKeys.has(
          matchKey([match.team1[0].id, match.team1[1].id], [match.team2[0].id, match.team2[1].id]),
        )
          ? 1
          : 0),
      0,
    );
    if (repeats < bestMatchRepeats) {
      bestMatches = candidate;
      bestMatchRepeats = repeats;
      if (repeats === 0) break;
    }
  }

  const finalMatches =
    bestMatches ?? pairTeamsIntoMatches(teams, forbiddenMatchKeys);

  return {
    matches: finalMatches.matches,
    benchedPlayerIds,
    byeTeam: finalMatches.byeTeam,
  };
}
