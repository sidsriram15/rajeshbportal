"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, FlaskConical, GraduationCap, Moon, Presentation, Sun } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { useStore } from "@/lib/store";
import { useTheme } from "@/components/providers";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Temporary prototype affordance: jump between the two portals and pick which
 * student you are signed in as. Not part of the real product surface.
 */
export function PortalSwitcher() {
  const { portal, setPortal, viewerId, setViewer, students, liveId } = useStore();
  const { dark, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  /* Hide entirely on the live session screen — it demands full attention. */
  if (pathname?.startsWith("/session/")) return null;

  const viewer = students.find((s) => s.id === viewerId);

  const go = (p: "teacher" | "student") => {
    setPortal(p);
    router.push(p === "teacher" ? "/teacher" : "/student");
  };

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
            {portal === "teacher" ? "Teacher" : viewer?.name.split(" ")[0] ?? "Student"}
          </span>
        </button>
      </MenuTrigger>

      <MenuContent align="end" side="top" className="min-w-[236px]">
        <MenuLabel>Prototype controls</MenuLabel>
        <MenuItem onSelect={() => go("teacher")}>
          <Presentation />
          Teacher portal
          {portal === "teacher" ? <Check className="ml-auto !text-ink" /> : null}
        </MenuItem>
        <MenuItem onSelect={() => go("student")}>
          <GraduationCap />
          Student portal
          {portal === "student" ? <Check className="ml-auto !text-ink" /> : null}
        </MenuItem>

        <MenuSeparator />
        <MenuLabel>Sign in as student</MenuLabel>
        <div className="max-h-56 overflow-y-auto scrollbar-thin">
          {students.map((s) => (
            <MenuItem
              key={s.id}
              onSelect={() => {
                setViewer(s.id);
                setPortal("student");
                router.push("/student");
              }}
            >
              <Avatar name={s.name} color={s.color} size="xs" />
              <span className="truncate">{s.name}</span>
              {viewerId === s.id ? <Check className="ml-auto !text-ink" /> : null}
            </MenuItem>
          ))}
        </div>

        <MenuSeparator />
        <MenuItem onSelect={toggle}>
          {dark ? <Sun /> : <Moon />}
          {dark ? "Light appearance" : "Dark appearance"}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
