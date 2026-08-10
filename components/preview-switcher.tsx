"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, FlaskConical, GraduationCap, Presentation } from "lucide-react";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * TEMPORARY. Until real authentication lands in Phase 2 there is no other way
 * to look at the student side of the application. Deleted in Phase 2 — nothing
 * should be built on top of it.
 */
export function PreviewSwitcher() {
  const { viewer, setViewer, viewerStudentId, setViewerStudent, students, liveId } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  /* Hidden during a live session — that screen demands full attention. */
  if (pathname?.startsWith("/session/")) return null;

  const current = students.find((s) => s.id === viewerStudentId);

  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          className={cn(
            "fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-line bg-raised/90 py-1.5 pl-2.5 pr-3 text-2xs font-medium text-muted shadow-pop backdrop-blur transition-all duration-150 ease-snap hover:border-line-strong hover:text-ink",
            liveId && "bottom-16 sm:bottom-4"
          )}
        >
          <FlaskConical className="size-3.5 text-faint" />
          <span className="hidden sm:inline">Viewing as</span>
          <span className="text-ink">
            {viewer === "teacher" ? "Teacher" : (current?.name.split(" ")[0] ?? "Student")}
          </span>
        </button>
      </MenuTrigger>

      <MenuContent align="end" side="top" className="min-w-[236px]">
        <MenuLabel>Preview — replaced by sign-in</MenuLabel>
        <MenuItem
          onSelect={() => {
            setViewer("teacher");
            router.push("/teacher");
          }}
        >
          <Presentation />
          Teacher
          {viewer === "teacher" ? <Check className="ml-auto !text-ink" /> : null}
        </MenuItem>

        <MenuSeparator />
        <MenuLabel>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="size-3" />
            As a student
          </span>
        </MenuLabel>
        <div className="max-h-56 overflow-y-auto scrollbar-thin">
          {students.map((s) => (
            <MenuItem
              key={s.id}
              onSelect={() => {
                setViewerStudent(s.id);
                setViewer("student");
                router.push("/student");
              }}
            >
              <Avatar name={s.name} color={s.color} src={s.avatarUrl} size="xs" />
              <span className="truncate">{s.name}</span>
              {viewer === "student" && viewerStudentId === s.id ? (
                <Check className="ml-auto !text-ink" />
              ) : null}
            </MenuItem>
          ))}
        </div>
      </MenuContent>
    </Menu>
  );
}
