import { Logo } from "@/components/marketing/logo";

/** Shared frame for sign-in / reset pages: dark, centred, no marketing chrome. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="surface-dark grain relative flex min-h-dvh flex-col">
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Logo variant="horizontal" className="mx-auto h-10" priority />
          <div className="mt-10">{children}</div>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-ivory/40">On A Roll Catering — internal system</p>
    </main>
  );
}
