import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];
const AUTH_COOKIE = "admitus_session";

function base64Url(input: ArrayBuffer | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function verifySession(token: string | undefined) {
  if (!token) return false;
  const [userIdRaw, expiresRaw, signature] = token.split(".");
  if (!userIdRaw || !expiresRaw || !signature) return false;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;

  const secret = process.env.AUTH_SECRET || process.env.OPENROUTER_API_KEY || "admitus-local-dev-secret-change-me";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const payload = `${userIdRaw}.${expiresRaw}`;
  const expected = base64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return expected === signature;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isLoggedIn = await verifySession(request.cookies.get(AUTH_COOKIE)?.value);

  if (pathname.startsWith("/api") && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (isLoggedIn && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isLoggedIn && !PUBLIC_PATHS.includes(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
