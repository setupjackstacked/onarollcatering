import { describe, expect, it } from "vitest";
import { enquirySchema, contactMessageSchema } from "@/lib/validation/enquiry";

const valid = {
  companyName: "Acme Construction",
  contactName: "Jane Smith",
  jobTitle: "",
  email: "jane@example.com",
  phone: "07700 900000",
  projectName: "North compound canteen",
  location: "Leeds",
  requiredStartDate: "2026-11-01",
  expectedDuration: "18 months",
  description: "Roughly 250 operatives on site, breakfast and lunch, seven days.",
  services: ["commercial-catering", "modular-kitchens"],
  catering: { breakfast: true, lunch: true, sevenDay: true, existingKitchen: "no" },
  kitchen: { kitchenType: ["modular"] },
  attachments: [],
  website: "",
};

describe("enquirySchema", () => {
  it("accepts a complete enquiry", () => {
    const r = enquirySchema.safeParse(valid);
    expect(r.success).toBe(true);
  });
  it("requires at least one service", () => {
    const r = enquirySchema.safeParse({ ...valid, services: [] });
    expect(r.success).toBe(false);
  });
  it("rejects an invalid email", () => {
    const r = enquirySchema.safeParse({ ...valid, email: "nope" });
    expect(r.success).toBe(false);
  });
  it("rejects a filled honeypot", () => {
    const r = enquirySchema.safeParse({ ...valid, website: "http://spam" });
    expect(r.success).toBe(false);
  });
  it("rejects unknown service values", () => {
    const r = enquirySchema.safeParse({ ...valid, services: ["hacking"] });
    expect(r.success).toBe(false);
  });
  it("caps attachments at 10", () => {
    const a = Array.from({ length: 11 }, (_, i) => ({ name: `f${i}.pdf`, path: `x/${i}`, size: 1, mime: "application/pdf" }));
    expect(enquirySchema.safeParse({ ...valid, attachments: a }).success).toBe(false);
  });
});

describe("contactMessageSchema", () => {
  it("requires a message of reasonable length", () => {
    expect(contactMessageSchema.safeParse({ name: "A B", email: "a@b.co", message: "hi" }).success).toBe(false);
    expect(contactMessageSchema.safeParse({ name: "A B", email: "a@b.co", message: "Hello, I have a question." }).success).toBe(true);
  });
});
