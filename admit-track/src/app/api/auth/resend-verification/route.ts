import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createVerificationToken, hashVerificationToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return NextResponse.json({ ok: true });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, message: "Email is already verified." });
  }

  const token = createVerificationToken();
  const tokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
  await db
    .update(users)
    .set({
      verificationTokenHash: hashVerificationToken(token),
      verificationTokenExpiresAt: tokenExpires,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id));

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const verificationUrl = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const emailResult = await sendVerificationEmail({ to: user.email, name: user.name, verificationUrl });
  return NextResponse.json({ ok: true, devVerificationUrl: emailResult.devUrl });
}
