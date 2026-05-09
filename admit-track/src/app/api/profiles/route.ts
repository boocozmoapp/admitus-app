import { db } from "@/db";
import { profiles } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const all = await db.select().from(profiles);
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db
    .insert(profiles)
    .values({
      name: body.name,
      degreeLevel: body.degreeLevel,
      fieldOfStudy: body.fieldOfStudy,
      targetCountries: body.targetCountries,
      ieltsScore: body.ieltsScore,
      toeflScore: body.toeflScore,
      gpa: body.gpa,
      greScore: body.greScore,
      budgetAmount: body.budgetAmount,
      budgetCurrency: body.budgetCurrency,
      accentColor: body.accentColor || "#1A4040",
      isActive: false,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
