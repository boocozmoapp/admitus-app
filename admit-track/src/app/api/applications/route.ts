import { db } from "@/db";
import { applications, universities, applicationDocuments, documents } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows: any[] = db
    .select({
      id: applications.id,
      universityId: applications.universityId,
      profileId: applications.profileId,
      universityName: universities.name,
      universityCountry: universities.country,
      universityCity: universities.city,
      programName: applications.programName,
      degreeLevel: applications.degreeLevel,
      intakeTerm: applications.intakeTerm,
      intakeYear: applications.intakeYear,
      applicationDeadline: applications.applicationDeadline,
      decisionExpectedDate: applications.decisionExpectedDate,
      tuitionAmount: applications.tuitionAmount,
      tuitionCurrency: applications.tuitionCurrency,
      tuitionPeriod: applications.tuitionPeriod,
      applicationFeeAmount: applications.applicationFeeAmount,
      applicationFeeCurrency: applications.applicationFeeCurrency,
      status: applications.status,
      priority: applications.priority,
      minGpa: applications.minGpa,
      ieltsRequired: applications.ieltsRequired,
      toeflRequired: applications.toeflRequired,
      greRequired: applications.greRequired,
      sourceUrl: applications.sourceUrl,
      notes: applications.notes,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
    })
    .from(applications)
    .innerJoin(universities, eq(applications.universityId, universities.id))
    .all();

  // Attach documents
  const appIds = rows.map((r: any) => r.id);
  const docsByApp: Record<number, Array<{ id: number; name: string; type: string; status: string }>> = {};
  if (appIds.length > 0) {
    const links = db
      .select({
        applicationId: applicationDocuments.applicationId,
        docId: documents.id,
        docName: documents.name,
        docType: documents.type,
        docStatus: documents.status,
      })
      .from(applicationDocuments)
      .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
      .where(inArray(applicationDocuments.applicationId, appIds))
      .all();
    for (const d of links) {
      if (!docsByApp[d.applicationId]) docsByApp[d.applicationId] = [];
      docsByApp[d.applicationId].push({ id: d.docId, name: d.docName, type: d.docType, status: d.docStatus });
    }
  }

  const result = rows.map((r: any) => ({ ...r, documents: docsByApp[r.id] || [] }));
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = db
    .insert(applications)
    .values({
      universityId: body.universityId,
      profileId: body.profileId,
      programName: body.programName,
      degreeLevel: body.degreeLevel,
      intakeTerm: body.intakeTerm,
      intakeYear: body.intakeYear,
      applicationDeadline: body.applicationDeadline,
      decisionExpectedDate: body.decisionExpectedDate,
      tuitionAmount: body.tuitionAmount,
      tuitionCurrency: body.tuitionCurrency,
      tuitionPeriod: body.tuitionPeriod,
      applicationFeeAmount: body.applicationFeeAmount,
      applicationFeeCurrency: body.applicationFeeCurrency,
      status: body.status || "researching",
      priority: body.priority || "medium",
      minGpa: body.minGpa,
      ieltsRequired: body.ieltsRequired,
      toeflRequired: body.toeflRequired,
      greRequired: body.greRequired,
      sourceUrl: body.sourceUrl,
      notes: body.notes,
    })
    .returning();
  const created = result as unknown as any[];
  return NextResponse.json(created[0], { status: 201 });
}