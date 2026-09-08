export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <section className="surface-dark">
        <div className="container-x pb-12 pt-32 md:pt-44">
          <h1 className="font-display display-lg">{title}</h1>
        </div>
      </section>
      <section className="surface-light">
        <div className="container-x max-w-3xl py-16 text-base leading-relaxed text-muted-light [&_p+p]:mt-5 [&_strong]:text-graphite md:py-24">{children}</div>
      </section>
    </>
  );
}
