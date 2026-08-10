import Link from "next/link";
import { Mark } from "@/components/brand";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-sm text-center">
        <Mark className="mx-auto size-5 text-faint" />
        <h1 className="mt-4 text-[15px] font-semibold tracking-[-0.015em] text-ink">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          The student or session you were looking for may have been removed, or the link is wrong.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3 text-2xs">
          <Link href="/teacher" className="text-accent underline-offset-4 hover:underline">
            Teacher portal
          </Link>
          <span className="text-line-strong">·</span>
          <Link href="/student" className="text-accent underline-offset-4 hover:underline">
            Student portal
          </Link>
        </div>
      </div>
    </main>
  );
}
