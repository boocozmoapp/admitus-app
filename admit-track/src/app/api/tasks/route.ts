import { db } from "@/db";
import { tasks, applications, universities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: tasks.id,
      applicationId: tasks.applicationId,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      completed: tasks.completed,
      priority: tasks.priority,
      createdAt: tasks.createdAt,
      completedAt: tasks.completedAt,
      universityName: universities.name,
      programName: applications.programName,
    })
    .from(tasks)
    .leftJoin(applications, eq(tasks.applicationId, applications.id))
    .leftJoin(universities, eq(applications.universityId, universities.id));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db
    .insert(tasks)
    .values({
      applicationId: body.applicationId || null,
      title: body.title,
      description: body.description,
      dueDate: body.dueDate,
      completed: false,
      priority: body.priority || "medium",
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const result = await db
    .update(tasks)
    .set({
      completed: body.completed,
      completedAt: body.completed ? new Date().toISOString() : null,
    })
    .where(eq(tasks.id, body.id))
    .returning();

  return NextResponse.json(result[0]);
}
