import { db } from "@/db";
import { xpEvents, userStats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await db.select().from(xpEvents);
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Insert XP event
  const event = await db
    .insert(xpEvents)
    .values({
      actionType: body.actionType,
      xpAwarded: body.xpAwarded,
      relatedEntityType: body.relatedEntityType,
      relatedEntityId: body.relatedEntityId,
    })
    .returning();

  // Update user stats
  const [stats] = await db.select().from(userStats).limit(1);
  if (stats) {
    const newXp = stats.xp + body.xpAwarded;
    const newLevel = Math.floor(newXp / 500) + 1;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let newStreak = stats.currentStreak;
    if (stats.lastActiveDate !== today) {
      if (stats.lastActiveDate === yesterday) {
        newStreak += 1;
      } else if (stats.lastActiveDate !== today) {
        newStreak = 1;
      }
    }

    await db
      .update(userStats)
      .set({
        xp: newXp,
        level: newLevel,
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak),
        lastActiveDate: today,
      })
      .where(eq(userStats.id, stats.id));
  }

  return NextResponse.json(event[0], { status: 201 });
}
