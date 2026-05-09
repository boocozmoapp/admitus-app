import { db } from "@/db";
import { applicationDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { applicationId, documentId } = body;
  if (!applicationId || !documentId) {
    return NextResponse.json({ error: "applicationId and documentId required" }, { status: 400 });
  }
  db.insert(applicationDocuments).values({ applicationId, documentId }).run();
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("applicationId");
  const docId = searchParams.get("documentId");
  if (!appId || !docId) {
    return NextResponse.json({ error: "applicationId and documentId required" }, { status: 400 });
  }
  db.delete(applicationDocuments)
    .where(and(
      eq(applicationDocuments.applicationId, parseInt(appId)),
      eq(applicationDocuments.documentId, parseInt(docId))
    ))
    .run();
  return NextResponse.json({ success: true });
}