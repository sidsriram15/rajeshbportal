import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          The student or class you were looking for may have been removed, or the link is wrong.
        </p>
        <div className="mt-5">
          <Link href="/" className="text-2xs text-accent underline-offset-4 hover:underline">
            Go back
          </Link>
        </div>
      </div>
    </main>
  );
}
