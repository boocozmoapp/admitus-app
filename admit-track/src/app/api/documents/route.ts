import { db } from "@/db";
import { documents, applicationDocuments, applications, universities } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function withLinks(doc: typeof documents.$inferSelect) {
  const links = await db
    .select({
      applicationId: applicationDocuments.applicationId,
      universityName: universities.name,
      programName: applications.programName,
    })
    .from(applicationDocuments)
    .innerJoin(applications, eq(applicationDocuments.applicationId, applications.id))
    .innerJoin(universities, eq(applications.universityId, universities.id))
    .where(eq(applicationDocuments.documentId, doc.id));

  return { ...doc, applicationCount: links.length, linkedApplications: links };
}

export async function GET() {
  const docs = await db.select().from(documents).orderBy(documents.type, documents.name);
  const result = await Promise.all(docs.map(withLinks));
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [result] = await db
    .insert(documents)
    .values({
      name: body.name,
      type: body.type,
      status: body.status || "draft",
      version: 1,
      content: body.content ?? null,
      fileUrl: body.fileUrl ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  return NextResponse.json(await withLinks(result), { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const allowed: Record<string, unknown> = {};
  if (fields.name !== undefined)    allowed.name    = fields.name;
  if (fields.status !== undefined)  allowed.status  = fields.status;
  if (fields.fileUrl !== undefined) allowed.fileUrl = fields.fileUrl;
  if (fields.notes !== undefined)   allowed.notes   = fields.notes;
  if (fields.version !== undefined) allowed.version = fields.version;

  allowed.updatedAt = new Date().toISOString();

  const [updated] = await db.update(documents).set(allowed).where(eq(documents.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(await withLinks(updated));
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.delete(applicationDocuments).where(eq(applicationDocuments.documentId, id));
  await db.delete(documents).where(eq(documents.id, id));
  return NextResponse.json({ ok: true });
}
