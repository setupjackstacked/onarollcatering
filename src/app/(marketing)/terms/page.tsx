import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms", robots: { index: false } };

export default function TermsPage() {
  return (
    <LegalPage title="Website Terms">
      <p>
        <strong>PLACEHOLDER.</strong> Replace with the company’s website terms of use before launch.
      </p>
    </LegalPage>
  );
}
