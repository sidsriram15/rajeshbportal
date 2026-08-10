"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Verify the caller is an authenticated teacher
async function requireTeacher(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  const { data: teacher } = await supabase.from("teachers").select("id").eq("id", user.id).single();
  if (!teacher) throw new Error("Unauthorized");
  return user.id;
}

export interface CreateStudentInput {
  name: string;
  username: string;
  password: string;
  yearGroup?: string;
  usualSlot?: string;
  timezone?: string;
  color?: string;
}

export async function createStudent(input: CreateStudentInput) {
  const teacherId = await requireTeacher();
  const admin = createAdminClient();
  const username = input.username.toLowerCase().trim();

  // Create auth user with synthetic email
  // We'll use a placeholder email; once we have the UUID we finalize it
  const tempEmail = `tmp_${Date.now()}@student.internal`;
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: tempEmail,
    password: input.password,
    email_confirm: true,
  });
  if (authError) throw new Error(authError.message);

  const studentId = authData.user.id;
  const realEmail = `${studentId}@student.internal`;

  // Update auth user email to the UUID-based synthetic email
  await admin.auth.admin.updateUserById(studentId, { email: realEmail });

  // Insert student profile
  const { error: insertError } = await admin.from("students").insert({
    id: studentId,
    teacher_id: teacherId,
    name: input.name,
    username,
    color: input.color ?? "gray",
    year_group: input.yearGroup ?? null,
    usual_slot: input.usualSlot ?? null,
    timezone: input.timezone ?? "UTC",
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(studentId);
    throw new Error(insertError.message);
  }

  // Create empty snapshot
  await admin.from("snapshots").insert({ student_id: studentId, working_on: "" });

  return { id: studentId };
}

export async function resetStudentPassword(studentId: string, newPassword: string) {
  const teacherId = await requireTeacher();
  const admin = createAdminClient();

  // Verify this student belongs to this teacher
  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("teacher_id", teacherId)
    .single();
  if (!student) throw new Error("Student not found");

  const { error } = await admin.auth.admin.updateUserById(studentId, { password: newPassword });
  if (error) throw new Error(error.message);
}

export async function deleteStudent(studentId: string) {
  const teacherId = await requireTeacher();
  const admin = createAdminClient();

  // Verify ownership
  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("teacher_id", teacherId)
    .single();
  if (!student) throw new Error("Student not found");

  // Delete auth user — cascades to students row via FK
  const { error } = await admin.auth.admin.deleteUser(studentId);
  if (error) throw new Error(error.message);
}
