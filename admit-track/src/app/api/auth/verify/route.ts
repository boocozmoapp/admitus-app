import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AUTH_COOKIE, AUTH_MAX_AGE_SECONDS, createSession, hashVerificationToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/login", request.nextUrl.origin);

  if (!token) {
    loginUrl.searchParams.set("verified", "missing");
    return NextResponse.redirect(loginUrl);
  }

  const tokenHash = hashVerificationToken(token);
  const [user] = await db.select().from(users).where(eq(users.verificationTokenHash, tokenHash)).limit(1);

  if (!user || !user.verificationTokenExpiresAt || new Date(user.verificationTokenExpiresAt) < new Date()) {
    loginUrl.searchParams.set("verified", "expired");
    return NextResponse.redirect(loginUrl);
  }

  await db
    .update(users)
    .set({
      emailVerifiedAt: new Date().toISOString(),
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id));

  const response = NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  response.cookies.set(AUTH_COOKIE, createSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
  });
  return response;
}
