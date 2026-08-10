"use client";

import { AccountMenu } from "@/components/account-menu";
import { useStore } from "@/lib/store";

/**
 * One bar, one column. Students come here to read what happened in a class,
 * so there is no dashboard and nothing to manage.
 */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const { students, viewerStudentId } = useStore();
  const student = students.find((s) => s.id === viewerStudentId) ?? students[0];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[760px] items-center px-5">
          <div className="ml-auto">
            <AccountMenu
              align="end"
              name={student?.name ?? "Student"}
              color={student?.color}
              avatarUrl={student?.avatarUrl}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-7">{children}</main>
    </div>
  );
}
