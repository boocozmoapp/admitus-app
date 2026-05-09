import { db } from "@/db";
import { emails, applications, universities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: emails.id,
      applicationId: emails.applicationId,
      subject: emails.subject,
      sender: emails.sender,
      recipient: emails.recipient,
      body: emails.body,
      direction: emails.direction,
      threadId: emails.threadId,
      sentAt: emails.sentAt,
      extractedMetadata: emails.extractedMetadata,
      createdAt: emails.createdAt,
      universityName: universities.name,
      programName: applications.programName,
    })
    .from(emails)
    .leftJoin(applications, eq(emails.applicationId, applications.id))
    .leftJoin(universities, eq(applications.universityId, universities.id));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db
    .insert(emails)
    .values({
      applicationId: body.applicationId || null,
      subject: body.subject,
      sender: body.sender,
      recipient: body.recipient,
      body: body.body,
      direction: body.direction,
      threadId: body.threadId,
      sentAt: body.sentAt || new Date().toISOString(),
      extractedMetadata: body.extractedMetadata ? JSON.stringify(body.extractedMetadata) : null,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
