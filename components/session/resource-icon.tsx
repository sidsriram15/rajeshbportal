import { FileText, Link2, PenLine, PlayCircle } from "lucide-react";
import type { Resource } from "@/lib/types";
import { cn } from "@/lib/utils";

const map = {
  link: Link2,
  video: PlayCircle,
  doc: FileText,
  practice: PenLine,
} as const;

export function ResourceIcon({
  kind,
  className,
}: {
  kind: Resource["kind"];
  className?: string;
}) {
  const Icon = map[kind] ?? Link2;
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
