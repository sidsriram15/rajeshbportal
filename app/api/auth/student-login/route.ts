import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Resolves a student username to their synthetic auth email.
// Never returns the password or auth user id — just enough for signInWithPassword.
export async function POST(request: Request) {
  const { username } = await request.json();
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .select("id")
    .eq("username", username.toLowerCase().trim())
    .single();

  if (error || !data) {
    // Don't reveal whether username exists
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  // Synthetic email: {student_uuid}@student.internal
  const email = `${data.id}@student.internal`;
  return NextResponse.json({ email });
}
