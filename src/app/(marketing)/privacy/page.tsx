import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy Policy", robots: { index: false } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        <strong>PLACEHOLDER.</strong> This page must be replaced with On A Roll Catering’s privacy policy before launch. It should
        cover the personal data collected through the enquiry and contact forms (name, company, contact details, project information
        and any uploaded documents), the lawful basis for processing, retention periods, the email provider used to send confirmations
        and the rights of data subjects under UK GDPR.
      </p>
    </LegalPage>
  );
}
