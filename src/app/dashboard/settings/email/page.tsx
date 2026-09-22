import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { serverEnv, publicEnv } from "@/lib/env";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard/primitives";
import { DescriptionList } from "@/components/dashboard/entity";
import { TestEmailForm } from "@/components/dashboard/forms/invite-forms";

export const metadata = { title: "Email" };

/** The address inside "Name <someone@domain>". */
function fromDomain(from: string) {
  const match = from.match(/<([^>]+)>/);
  const address = match?.[1] ?? from;
  return address.split("@")[1] ?? null;
}

/**
 * Shows whether outgoing email is actually wired up, and proves it with a real
 * send. Everything the business does by email — welcome messages, invoices,
 * quotes, enquiry alerts, the nightly digest — goes through this one key, so
 * it is worth being able to check it without reading logs.
 */
export default async function EmailSettingsPage() {
  const ctx = await requireOrgContext("/dashboard/settings/email");
  if (!ctx.can("org.manage")) redirect("/dashboard/settings");

  const { RESEND_API_KEY, EMAIL_FROM, INTERNAL_NOTIFICATION_EMAIL } = serverEnv();
  const configured = Boolean(RESEND_API_KEY);
  const domain = fromDomain(EMAIL_FROM);
  const siteDomain = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const domainMatches = domain ? siteDomain.endsWith(domain) : false;

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Email"
        description="Welcome emails, invoices, quotes and alerts all send through Resend."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Configuration">
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge label={configured ? "API key set" : "No API key"} tone={configured ? "green" : "red"} />
            <StatusBadge label={domainMatches ? "Sending from your own domain" : "Check the from address"} tone={domainMatches ? "green" : "amber"} />
          </div>
          <DescriptionList
            cols={1}
            items={[
              { label: "From address", value: EMAIL_FROM },
              { label: "Sending domain", value: domain },
              { label: "Application", value: publicEnv.NEXT_PUBLIC_SITE_URL },
              { label: "Internal alerts go to", value: INTERNAL_NOTIFICATION_EMAIL ?? "Not set" },
            ]}
          />
          {!configured ? (
            <p className="mt-4 rounded-md bg-status-warning/10 px-4 py-3 text-sm">
              Nothing can be emailed until <code>RESEND_API_KEY</code> is set in Vercel and the project is
              redeployed. Until then the system logs what it would have sent and carries on, so no work is lost.
            </p>
          ) : null}
          {configured && !domainMatches ? (
            <p className="mt-4 rounded-md bg-status-warning/10 px-4 py-3 text-sm">
              The from address doesn&rsquo;t match this site&rsquo;s domain. Resend will refuse to send unless{" "}
              {domain ?? "that domain"} is verified in your Resend account.
            </p>
          ) : null}
        </Panel>
        <Panel title="Test it">
          <p className="mb-4 text-sm text-muted-light">
            Sends one real message to <strong>{ctx.user.email}</strong> — your own address, never anyone else&rsquo;s.
            If it arrives in the inbox rather than spam, the domain is verified and everything else will send too.
          </p>
          <TestEmailForm />
        </Panel>
      </div>
    </>
  );
}
