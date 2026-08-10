"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export function MenuContent({
  children,
  align = "end",
  className,
  side = "bottom",
}: {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        side={side}
        sideOffset={6}
        className={cn(
          "z-50 min-w-[180px] overflow-hidden rounded-lg border border-line bg-raised p-1 shadow-pop",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]",
          className
        )}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function MenuItem({
  children,
  onSelect,
  destructive,
  shortcut,
  className,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  destructive?: boolean;
  shortcut?: string;
  className?: string;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded px-2 py-1.5 text-[13px] outline-none transition-colors",
        destructive
          ? "text-danger data-[highlighted]:bg-danger/[0.09]"
          : "text-ink data-[highlighted]:bg-ink/[0.06]",
        "[&_svg]:size-3.5 [&_svg]:text-faint",
        className
      )}
    >
      {children}
      {shortcut ? <span className="kbd ml-auto">{shortcut}</span> : null}
    </DropdownMenu.Item>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-1.5 text-2xs font-medium uppercase tracking-wide text-faint">{children}</div>;
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-line" />;
}
