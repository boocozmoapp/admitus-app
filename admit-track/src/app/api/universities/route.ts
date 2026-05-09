import { db } from "@/db";
import { universities } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(universities);
  return NextResponse.json(rows);
}

/** Find-or-create a university by name (case-insensitive). */
export async function POST(request: NextRequest) {
  const { name, country, city, website } = await request.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  // Case-insensitive look-up in JS (keeps SQL simple for SQLite)
  const all = await db.select().from(universities);
  const existing = all.find((u) => u.name.toLowerCase() === name.toLowerCase());
  if (existing) return NextResponse.json(existing);

  const [created] = await db
    .insert(universities)
    .values({
      name,
      country: country || "Unknown",
      city: city || "Unknown",
      website: website || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
