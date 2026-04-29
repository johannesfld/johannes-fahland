import { NextResponse } from "next/server";
import { getTournamentById } from "@/app/actions/turnier";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const tournament = await getTournamentById(id);
  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      data: tournament,
      updatedAt: tournament.updatedAt,
    },
    {
      headers: {
        ETag: tournament.updatedAt,
      },
    },
  );
}
