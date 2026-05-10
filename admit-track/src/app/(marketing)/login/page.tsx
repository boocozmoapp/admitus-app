"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdmitusMark, BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim() || !password || (mode === "register" && !name.trim())) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        return;
      }

      if (mode === "register") {
        setMessage(data.message || "Check your email to verify your account before signing in.");
        setMode("login");
        setPassword("");
        return;
      }

      const redirectTo = new URLSearchParams(window.location.search).get("from") || "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send verification email.");
        return;
      }
      setMessage("If an unverified account exists for that email, a verification link has been sent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-[#AAD8D8]/10 bg-[#022226] px-6 py-4">
        <Link href="/" className="flex w-fit items-center gap-2.5">
          <BrandLogo markClassName="h-9 w-8" textClassName="text-lg" />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <AdmitusMark className="h-16 w-14" />
          </div>

          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your admitus account"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {mode === "login"
                ? "Sign in to manage your applications, documents, supervisors, and funding signals."
                : "Set up a secure workspace with your email and password."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">Full name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="h-11 rounded-lg bg-card text-base"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
                className="h-11 rounded-lg bg-card text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-11 rounded-lg bg-card text-base"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
                {error.toLowerCase().includes("verify") && (
                  <button type="button" onClick={resendVerification} className="ml-1 font-semibold underline">
                    Resend verification email
                  </button>
                )}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={!email.trim() || !password || (mode === "register" && !name.trim()) || loading}
              className="h-11 w-full rounded-lg text-base font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Passwords are hashed on the server. New accounts must verify their email before signing in.
          </p>
        </div>
      </div>

      <footer className="border-t border-border px-6 py-4 text-center">
        <Link href="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
          Back to landing page
        </Link>
      </footer>
    </div>
  );
}
