import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AUTH_COOKIE, AUTH_MAX_AGE_SECONDS, createSession, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  if (!user.emailVerifiedAt) {
    return NextResponse.json({ error: "Please verify your email before signing in.", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
  }

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
  response.cookies.set(AUTH_COOKIE, createSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
  });
  response.cookies.delete("gradpilot_user");
  return response;
}
