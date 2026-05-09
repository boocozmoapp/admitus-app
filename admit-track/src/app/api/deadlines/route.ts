import { db } from "@/db";
import { deadlines, applications, universities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: deadlines.id,
      applicationId: deadlines.applicationId,
      title: deadlines.title,
      type: deadlines.type,
      dueDate: deadlines.dueDate,
      completed: deadlines.completed,
      notes: deadlines.notes,
      createdAt: deadlines.createdAt,
      universityName: universities.name,
      programName: applications.programName,
    })
    .from(deadlines)
    .leftJoin(applications, eq(deadlines.applicationId, applications.id))
    .leftJoin(universities, eq(applications.universityId, universities.id));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db
    .insert(deadlines)
    .values({
      applicationId: body.applicationId || null,
      title: body.title,
      type: body.type,
      dueDate: body.dueDate,
      completed: body.completed || false,
      notes: body.notes,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const result = await db
    .update(deadlines)
    .set({ completed: body.completed })
    .where(eq(deadlines.id, body.id))
    .returning();

  return NextResponse.json(result[0]);
}
