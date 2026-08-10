import { FileText, Link2 } from "lucide-react";
import type { ResourceKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ResourceIcon({ kind, className }: { kind: ResourceKind; className?: string }) {
  const Icon = kind === "pdf" ? FileText : Link2;
  return (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded border border-resource/20 bg-resource/[0.07] text-resource",
        className
      )}
    >
      <Icon className="size-3" />
    </span>
  );
}
