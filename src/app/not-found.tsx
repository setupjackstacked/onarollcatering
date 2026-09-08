import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="surface-dark grain relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow text-copper">404</p>
      <h1 className="font-display display-lg mt-4">Page not found</h1>
      <p className="mt-4 max-w-md text-ivory/65">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-8 flex gap-3">
        <LinkButton href="/" variant="copper">
          Home
        </LinkButton>
        <LinkButton href="/services" variant="outlineLight">
          Services
        </LinkButton>
      </div>
      <Link href="/contact" className="mt-8 text-sm text-ivory/60 underline-offset-4 hover:underline">
        Contact us
      </Link>
    </main>
  );
}
