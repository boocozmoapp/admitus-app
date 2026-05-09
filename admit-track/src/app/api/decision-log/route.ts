import { db } from "@/db";
import { decisionLog, applications, universities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: decisionLog.id,
      entryType: decisionLog.entryType,
      title: decisionLog.title,
      reasoning: decisionLog.reasoning,
      relatedApplicationId: decisionLog.relatedApplicationId,
      createdAt: decisionLog.createdAt,
      universityName: universities.name,
      programName: applications.programName,
    })
    .from(decisionLog)
    .leftJoin(applications, eq(decisionLog.relatedApplicationId, applications.id))
    .leftJoin(universities, eq(applications.universityId, universities.id));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db
    .insert(decisionLog)
    .values({
      entryType: body.entryType,
      title: body.title,
      reasoning: body.reasoning,
      relatedApplicationId: body.relatedApplicationId || null,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
