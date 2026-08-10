"use client";

import { useRouter } from "next/navigation";
import { Moon, Sun, LogOut } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Avatar } from "@/components/ui/primitives";
import { useTheme } from "@/components/providers";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

/**
 * Occupies the slot the wordmark used to. Profile picture and sign out land
 * here in Phase 2, once there is an account to sign out of.
 */
export function AccountMenu({
  name,
  color,
  avatarUrl,
  subtitle,
  className,
  align = "start",
}: {
  name: string;
  color?: string;
  avatarUrl?: string;
  subtitle?: string;
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const { dark, toggle } = useTheme();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          className={cn(
            "flex min-w-0 items-center gap-2 rounded px-1 py-1 text-left transition-colors hover:bg-ink/[0.05]",
            className
          )}
        >
          <Avatar name={name} color={color} src={avatarUrl} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium leading-tight text-ink">
              {name}
            </span>
            {subtitle ? (
              <span className="block truncate text-2xs leading-tight text-faint">{subtitle}</span>
            ) : null}
          </span>
        </button>
      </MenuTrigger>
      <MenuContent align={align} className="min-w-[180px]">
        <MenuItem onSelect={toggle}>
          {dark ? <Sun /> : <Moon />}
          {dark ? "Light appearance" : "Dark appearance"}
        </MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={signOut}>
          <LogOut />
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
