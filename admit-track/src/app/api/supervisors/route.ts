import { db } from "@/db";
import { supervisors, outreachEvents, supervisorApplications, applications, universities, profiles } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Compute next_action from supervisor fields + follow-up count
function computeNextAction(
  status: string,
  lastContactedAt: string | null,
  lastResponseAt: string | null,
  followUpCount: number
): { label: string; urgent: boolean } {
  const now = Date.now();
  const daysSinceLast = lastContactedAt
    ? Math.floor((now - new Date(lastContactedAt).getTime()) / 86400000)
    : null;

  switch (status) {
    case "not_contacted":
      return { label: "Send first email", urgent: false };
    case "emailed":
      if (daysSinceLast === null) return { label: "Send first email", urgent: false };
      if (daysSinceLast < 10) return { label: "Awaiting reply", urgent: false };
      if (daysSinceLast < 15 && followUpCount === 0)
        return { label: "Send follow-up #1", urgent: true };
      if (daysSinceLast < 28 && followUpCount === 1)
        return { label: "Awaiting reply (1 follow-up sent)", urgent: false };
      if (daysSinceLast >= 15 && followUpCount === 0)
        return { label: "Send follow-up #1", urgent: true };
      if (daysSinceLast >= 15 && followUpCount === 1)
        return { label: "Send follow-up #2", urgent: true };
      return { label: "Awaiting reply", urgent: false };
    case "replied_positive":
      return { label: "Schedule meeting", urgent: false };
    case "replied_neutral":
      return { label: "Apply through general pool", urgent: false };
    case "replied_declined":
      return { label: "No action needed", urgent: false };
    case "meeting_scheduled":
      return { label: "Prepare for meeting", urgent: true };
    case "meeting_completed":
      return { label: "Send thank-you / next steps", urgent: true };
    case "cold":
      return { label: "No action (cold)", urgent: false };
    default:
      return { label: "No action needed", urgent: false };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  let query = db
    .select({
      id: supervisors.id,
      profileId: supervisors.profileId,
      universityId: supervisors.universityId,
      name: supervisors.name,
      email: supervisors.email,
      university: supervisors.university,
      department: supervisors.department,
      program: supervisors.program,
      title: supervisors.title,
      researchInterests: supervisors.researchInterests,
      personalWebsiteUrl: supervisors.personalWebsiteUrl,
      status: supervisors.status,
      firstContactedAt: supervisors.firstContactedAt,
      lastContactedAt: supervisors.lastContactedAt,
      lastResponseAt: supervisors.lastResponseAt,
      notes: supervisors.notes,
      createdAt: supervisors.createdAt,
      updatedAt: supervisors.updatedAt,
    })
    .from(supervisors);

  const rows = profileId
    ? await db.select().from(supervisors).where(eq(supervisors.profileId, parseInt(profileId)))
    : await db.select().from(supervisors);

  // Enrich each with follow-up count, linked apps, next_action
  const enriched = await Promise.all(
    rows.map(async (sup) => {
      // Count email_sent events after the first one (follow-ups)
      const events = await db
        .select()
        .from(outreachEvents)
        .where(eq(outreachEvents.supervisorId, sup.id))
        .orderBy(outreachEvents.occurredAt);

      const emailsSent = events.filter((e) => e.type === "email_sent");
      const followUpCount = Math.max(0, emailsSent.length - 1);

      // Check if should auto-transition to cold
      let resolvedStatus = sup.status;
      if (
        sup.status === "emailed" &&
        sup.lastContactedAt &&
        followUpCount >= 2
      ) {
        const daysSince = Math.floor(
          (Date.now() - new Date(sup.lastContactedAt).getTime()) / 86400000
        );
        if (daysSince >= 28) resolvedStatus = "cold";
      }

      const nextAction = computeNextAction(
        resolvedStatus,
        sup.lastContactedAt,
        sup.lastResponseAt,
        followUpCount
      );

      // Linked applications
      const linkedApps = await db
        .select({
          applicationId: supervisorApplications.applicationId,
          universityName: universities.name,
          programName: applications.programName,
          status: applications.status,
        })
        .from(supervisorApplications)
        .innerJoin(applications, eq(supervisorApplications.applicationId, applications.id))
        .innerJoin(universities, eq(applications.universityId, universities.id))
        .where(eq(supervisorApplications.supervisorId, sup.id));

      return {
        ...sup,
        status: resolvedStatus,
        followUpCount,
        nextAction: nextAction.label,
        nextActionUrgent: nextAction.urgent,
        daysSinceLastContact: sup.lastContactedAt
          ? Math.floor((Date.now() - new Date(sup.lastContactedAt).getTime()) / 86400000)
          : null,
        linkedApplications: linkedApps,
        eventCount: events.length,
      };
    })
  );

  // Sort: urgent first, then by lastContactedAt ascending (oldest first)
  enriched.sort((a, b) => {
    if (a.nextActionUrgent && !b.nextActionUrgent) return -1;
    if (!a.nextActionUrgent && b.nextActionUrgent) return 1;
    const aDate = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
    const bDate = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
    return aDate - bDate;
  });

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await db
    .insert(supervisors)
    .values({
      profileId: body.profileId || null,
      universityId: body.universityId || null,
      name: body.name,
      email: body.email,
      university: body.university,
      department: body.department,
      program: body.program,
      title: body.title,
      researchInterests: body.researchInterests,
      personalWebsiteUrl: body.personalWebsiteUrl,
      status: body.status || "not_contacted",
      notes: body.notes,
    })
    .returning();

  const newSup = result[0];

  // Link to applications if provided
  if (body.applicationIds?.length) {
    for (const appId of body.applicationIds) {
      await db
        .insert(supervisorApplications)
        .values({ supervisorId: newSup.id, applicationId: appId });
    }
  }

  return NextResponse.json(newSup, { status: 201 });
}
