import { db } from "@/db";
import { supervisors, outreachEvents, supervisorApplications, applications, universities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supId = parseInt(id);

  const [sup] = await db.select().from(supervisors).where(eq(supervisors.id, supId));
  if (!sup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const events = await db
    .select()
    .from(outreachEvents)
    .where(eq(outreachEvents.supervisorId, supId))
    .orderBy(outreachEvents.occurredAt);

  const linkedApps = await db
    .select({
      id: supervisorApplications.id,
      applicationId: supervisorApplications.applicationId,
      universityName: universities.name,
      programName: applications.programName,
      status: applications.status,
      applicationDeadline: applications.applicationDeadline,
    })
    .from(supervisorApplications)
    .innerJoin(applications, eq(supervisorApplications.applicationId, applications.id))
    .innerJoin(universities, eq(applications.universityId, universities.id))
    .where(eq(supervisorApplications.supervisorId, supId));

  return NextResponse.json({ ...sup, events, linkedApplications: linkedApps });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supId = parseInt(id);
  const body = await request.json();

  const result = await db
    .update(supervisors)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(supervisors.id, supId))
    .returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supId = parseInt(id);

  await db.delete(outreachEvents).where(eq(outreachEvents.supervisorId, supId));
  await db.delete(supervisorApplications).where(eq(supervisorApplications.supervisorId, supId));
  await db.delete(supervisors).where(eq(supervisors.id, supId));

  return NextResponse.json({ success: true });
}
