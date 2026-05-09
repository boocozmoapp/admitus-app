import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AUTH_COOKIE, parseSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = parseSession(request.cookies.get(AUTH_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
