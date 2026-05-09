import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createVerificationToken, hashPassword, hashVerificationToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const token = createVerificationToken();
  const tokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: hashPassword(password),
      verificationTokenHash: hashVerificationToken(token),
      verificationTokenExpiresAt: tokenExpires,
    })
    .returning({ id: users.id, name: users.name, email: users.email });

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const verificationUrl = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const emailResult = await sendVerificationEmail({ to: email, name, verificationUrl });

  return NextResponse.json(
    {
      user: created,
      message: "Account created. Check your email to verify your account before signing in.",
      devVerificationUrl: emailResult.devUrl,
    },
    { status: 201 }
  );
}
