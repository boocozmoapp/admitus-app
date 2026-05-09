import { db } from "@/db";
import { profiles, applications, profileDocuments, fitScores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, parseInt(id)));

  if (!profile[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile[0]);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.degreeLevel !== undefined) updateData.degreeLevel = body.degreeLevel;
  if (body.fieldOfStudy !== undefined) updateData.fieldOfStudy = body.fieldOfStudy;
  if (body.targetCountries !== undefined) updateData.targetCountries = body.targetCountries;
  if (body.ieltsScore !== undefined) updateData.ieltsScore = body.ieltsScore;
  if (body.toeflScore !== undefined) updateData.toeflScore = body.toeflScore;
  if (body.gpa !== undefined) updateData.gpa = body.gpa;
  if (body.greScore !== undefined) updateData.greScore = body.greScore;
  if (body.budgetAmount !== undefined) updateData.budgetAmount = body.budgetAmount;
  if (body.budgetCurrency !== undefined) updateData.budgetCurrency = body.budgetCurrency;
  if (body.accentColor !== undefined) updateData.accentColor = body.accentColor;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  updateData.updatedAt = new Date().toISOString();

  await db
    .update(profiles)
    .set(updateData)
    .where(eq(profiles.id, parseInt(id)));

  if (body.isActive) {
    await db.update(profiles).set({ isActive: false }).where(eq(profiles.isActive, true));
    await db.update(profiles).set({ isActive: true }).where(eq(profiles.id, parseInt(id)));
  }

  const updated = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, parseInt(id)));

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pid = parseInt(id);
  // Null out references first
  await db.update(applications).set({ profileId: null }).where(eq(applications.profileId, pid));
  await db.delete(profileDocuments).where(eq(profileDocuments.profileId, pid));
  await db.delete(fitScores).where(eq(fitScores.profileId, pid));
  await db.delete(profiles).where(eq(profiles.id, pid));
  return NextResponse.json({ success: true });
}
