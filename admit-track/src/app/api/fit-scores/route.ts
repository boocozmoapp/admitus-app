import { db } from "@/db";
import { fitScores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  const programId = searchParams.get("programId");

  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

  const conditions = [eq(fitScores.profileId, parseInt(profileId))];
  if (programId) conditions.push(eq(fitScores.programId, parseInt(programId)));

  const scores = await db
    .select()
    .from(fitScores)
    .where(and(...conditions));

  return NextResponse.json(scores);
}
