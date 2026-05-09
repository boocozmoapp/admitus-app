import { db } from "@/db";
import {
  applications, universities, applicationDocuments, documents,
  emails, tasks, lorRequests, recommenders, deadlines,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appId = parseInt(id);

  const [app] = await db
    .select({
      id: applications.id,
      universityId: applications.universityId,
      universityName: universities.name,
      universityCountry: universities.country,
      universityCity: universities.city,
      universityWebsite: universities.website,
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
    .where(eq(applications.id, appId));

  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get linked documents
  const docs = await db
    .select({
      id: documents.id,
      name: documents.name,
      type: documents.type,
      status: documents.status,
      version: documents.version,
    })
    .from(applicationDocuments)
    .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
    .where(eq(applicationDocuments.applicationId, appId));

  // Get emails
  const appEmails = await db
    .select()
    .from(emails)
    .where(eq(emails.applicationId, appId));

  // Get tasks
  const appTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.applicationId, appId));

  // Get LOR requests
  const lors = await db
    .select({
      id: lorRequests.id,
      status: lorRequests.status,
      requestedDate: lorRequests.requestedDate,
      submittedDate: lorRequests.submittedDate,
      notes: lorRequests.notes,
      recommenderName: recommenders.name,
      recommenderEmail: recommenders.email,
      recommenderDesignation: recommenders.designation,
      recommenderInstitution: recommenders.institution,
    })
    .from(lorRequests)
    .innerJoin(recommenders, eq(lorRequests.recommenderId, recommenders.id))
    .where(eq(lorRequests.applicationId, appId));

  // Get deadlines
  const appDeadlines = await db
    .select()
    .from(deadlines)
    .where(eq(deadlines.applicationId, appId));

  return NextResponse.json({
    ...app,
    documents: docs,
    emails: appEmails,
    tasks: appTasks,
    lorRequests: lors,
    deadlines: appDeadlines,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appId = parseInt(id);
  const body = await request.json();

  const result = await db
    .update(applications)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(applications.id, appId))
    .returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appId = parseInt(id);

  await db.delete(applicationDocuments).where(eq(applicationDocuments.applicationId, appId));
  await db.delete(lorRequests).where(eq(lorRequests.applicationId, appId));
  await db.delete(emails).where(eq(emails.applicationId, appId));
  await db.delete(tasks).where(eq(tasks.applicationId, appId));
  await db.delete(deadlines).where(eq(deadlines.applicationId, appId));
  await db.delete(applications).where(eq(applications.id, appId));

  return NextResponse.json({ success: true });
}
