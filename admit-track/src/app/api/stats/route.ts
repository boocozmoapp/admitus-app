import { db } from "@/db";
import { userStats } from "@/db/schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await db.select().from(userStats).limit(1);
  if (stats.length === 0) {
    return NextResponse.json({
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      totalApplicationsSubmitted: 0,
      totalEmailsSent: 0,
    });
  }
  return NextResponse.json(stats[0]);
}
