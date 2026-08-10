"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { viewer } = useStore();

  React.useEffect(() => {
    router.replace(viewer === "student" ? "/student" : "/teacher");
  }, [viewer, router]);

  return (
    <main className="grid min-h-screen place-items-center">
      <span className="size-1.5 animate-pulse rounded-full bg-faint" />
    </main>
  );
}
