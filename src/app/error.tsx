"use client";

import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Digest is safe to log; raw error message is not shown to users.
    console.error("route.error", error.digest);
  }, [error]);
  return (
    <main className="surface-light flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow text-copper-dark">Something went wrong</p>
      <h1 className="font-display display-md mt-4">We hit a problem loading this page</h1>
      <p className="mt-4 max-w-md text-muted-light">Please try again. If the problem persists, contact us directly.</p>
      <div className="mt-8 flex gap-3">
        <Button variant="obsidian" onClick={reset}>
          Try again
        </Button>
        <LinkButton href="/" variant="outlineDark">
          Home
        </LinkButton>
      </div>
    </main>
  );
}
