"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Flow = "teacher" | "student";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [flow, setFlow] = React.useState<Flow>("teacher");
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (flow === "teacher") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/teacher");
      } else {
        // Resolve username → synthetic email via server action
        const res = await fetch("/api/auth/student-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Login failed");
        const { error } = await supabase.auth.signInWithPassword({
          email: json.email,
          password,
        });
        if (error) throw error;
        router.replace("/student");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-ink">Sign in</h1>
          <p className="text-sm text-muted">Your tutoring records</p>
        </div>

        <div className="flex rounded-lg border border-line bg-surface p-0.5">
          {(["teacher", "student"] as Flow[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setFlow(f); setError(""); }}
              className={cn(
                "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
                flow === f
                  ? "bg-ink text-canvas"
                  : "text-muted hover:text-ink"
              )}
            >
              {f === "teacher" ? "Teacher" : "Student"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {flow === "teacher" ? (
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          ) : (
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          )}
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {flow === "teacher" ? (
          <p className="text-center text-xs text-faint">
            No account?{" "}
            <a href="/signup" className="text-accent hover:underline">
              Request access
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
