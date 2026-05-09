import { db } from "@/db";
import { recommenders, lorRequests, applications, universities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const recs = await db.select().from(recommenders);

  const recsWithLors = await Promise.all(
    recs.map(async (rec) => {
      const lors = await db
        .select({
          id: lorRequests.id,
          applicationId: lorRequests.applicationId,
          status: lorRequests.status,
          requestedDate: lorRequests.requestedDate,
          submittedDate: lorRequests.submittedDate,
          universityName: universities.name,
          programName: applications.programName,
        })
        .from(lorRequests)
        .innerJoin(applications, eq(lorRequests.applicationId, applications.id))
        .innerJoin(universities, eq(applications.universityId, universities.id))
        .where(eq(lorRequests.recommenderId, rec.id));

      return { ...rec, lorRequests: lors };
    })
  );

  return NextResponse.json(recsWithLors);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db
    .insert(recommenders)
    .values({
      name: body.name,
      email: body.email,
      designation: body.designation,
      institution: body.institution,
      notes: body.notes,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
