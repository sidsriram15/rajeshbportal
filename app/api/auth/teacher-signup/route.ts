import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { name, email, password, code } = await request.json();

  if (code !== process.env.TEACHER_SIGNUP_CODE) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 403 });
  }
  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email and password required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Insert teacher profile
  const { error: profileError } = await admin
    .from("teachers")
    .insert({ id: authData.user.id, name });
  if (profileError) {
    // Roll back auth user
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
