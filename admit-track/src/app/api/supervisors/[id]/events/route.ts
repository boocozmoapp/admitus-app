import { db } from "@/db";
import { outreachEvents, supervisors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supId = parseInt(id);
  const body = await request.json();

  // Insert event
  const result = await db
    .insert(outreachEvents)
    .values({
      supervisorId: supId,
      type: body.type,
      subject: body.subject,
      body: body.body,
      occurredAt: body.occurredAt || new Date().toISOString(),
    })
    .returning();

  // Update supervisor timestamps based on event type
  const now = new Date().toISOString();
  const updates: Record<string, string | null> = { updatedAt: now };

  if (body.type === "email_sent") {
    updates.lastContactedAt = body.occurredAt || now;
    // Set firstContactedAt if not already set
    const [sup] = await db.select().from(supervisors).where(eq(supervisors.id, supId));
    if (!sup.firstContactedAt) updates.firstContactedAt = body.occurredAt || now;
    if (sup.status === "not_contacted") updates.status = "emailed";
  } else if (body.type === "email_received") {
    updates.lastResponseAt = body.occurredAt || now;
    // Update status if still 'emailed'
    const [sup] = await db.select().from(supervisors).where(eq(supervisors.id, supId));
    if (sup.status === "emailed") updates.status = "replied_neutral";
  }

  await db.update(supervisors).set(updates).where(eq(supervisors.id, supId));

  return NextResponse.json(result[0], { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supId = parseInt(id);

  const events = await db
    .select()
    .from(outreachEvents)
    .where(eq(outreachEvents.supervisorId, supId))
    .orderBy(outreachEvents.occurredAt);

  return NextResponse.json(events);
}
