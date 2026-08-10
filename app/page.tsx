"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { portal } = useStore();

  React.useEffect(() => {
    router.replace(portal === "student" ? "/student" : "/teacher");
  }, [portal, router]);

  return (
    <main className="grid min-h-screen place-items-center">
      <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.14em] text-faint">
        <span className="size-1.5 animate-pulse rounded-full bg-accent" />
        Cadence
      </div>
    </main>
  );
}
