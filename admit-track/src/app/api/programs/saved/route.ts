import { db } from "@/db";
import { savedPrograms, programs, universities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: savedPrograms.id,
      programId: savedPrograms.programId,
      notes: savedPrograms.notes,
      savedAt: savedPrograms.savedAt,
      programName: programs.name,
      universityName: universities.name,
      universityCountry: universities.country,
      degreeLevel: programs.degreeLevel,
      tuitionAmount: programs.tuitionAmount,
      tuitionCurrency: programs.tuitionCurrency,
    })
    .from(savedPrograms)
    .innerJoin(programs, eq(savedPrograms.programId, programs.id))
    .innerJoin(universities, eq(programs.universityId, universities.id));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db
    .insert(savedPrograms)
    .values({ programId: body.programId, notes: body.notes })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");
  if (programId) {
    await db.delete(savedPrograms).where(eq(savedPrograms.programId, parseInt(programId)));
  }
  return NextResponse.json({ success: true });
}
