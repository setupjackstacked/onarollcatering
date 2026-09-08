import { z } from "zod";

export const SERVICE_OPTIONS = [
  { value: "commercial-catering", label: "Commercial Catering" },
  { value: "commercial-kitchen-design", label: "Commercial Kitchen Design" },
  { value: "modular-kitchens", label: "Modular Kitchen" },
  { value: "kitchen-fit-out", label: "Kitchen Fit-Out" },
  { value: "catering-staffing", label: "Staffing" },
  { value: "equipment", label: "Equipment" },
  { value: "consultancy", label: "Consultancy" },
  { value: "other", label: "Other" },
] as const;

export type ServiceOption = (typeof SERVICE_OPTIONS)[number]["value"];
const serviceValues = SERVICE_OPTIONS.map((s) => s.value) as [ServiceOption, ...ServiceOption[]];

export const CATERING_SERVICES: ServiceOption[] = ["commercial-catering", "catering-staffing"];
export const KITCHEN_SERVICES: ServiceOption[] = ["commercial-kitchen-design", "modular-kitchens", "kitchen-fit-out", "equipment"];

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => trimmed(max).optional().or(z.literal(""));

export const contactStepSchema = z.object({
  companyName: trimmed(160).min(2, "Enter your company name"),
  contactName: trimmed(120).min(2, "Enter your name"),
  jobTitle: optionalText(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: trimmed(40).min(6, "Enter a contact number"),
});

export const projectStepSchema = z.object({
  projectName: trimmed(160).min(2, "Give the project a name"),
  location: trimmed(200).min(2, "Where is the site?"),
  requiredStartDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date")
    .optional()
    .or(z.literal("")),
  expectedDuration: optionalText(120),
  description: trimmed(4000).min(20, "Tell us a little more — at least a sentence or two"),
});

export const cateringDetailsSchema = z.object({
  estimatedDiners: optionalText(40),
  mealsPerDay: optionalText(40),
  breakfast: z.boolean().optional(),
  lunch: z.boolean().optional(),
  dinner: z.boolean().optional(),
  sevenDay: z.boolean().optional(),
  operatingHours: optionalText(120),
  contractDuration: optionalText(120),
  existingKitchen: z.enum(["yes", "no", "unsure", ""]).optional(),
  temporaryFacility: z.enum(["yes", "no", "unsure", ""]).optional(),
});

export const kitchenDetailsSchema = z.object({
  kitchenType: z.array(z.enum(["new-installation", "refurbishment", "temporary", "modular", "portacabin", "container"])).optional(),
  approximateSize: optionalText(120),
  requiredThroughput: optionalText(120),
  requiredCompletionDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date")
    .optional()
    .or(z.literal("")),
  existingDrawings: z.enum(["yes", "no", ""]).optional(),
  existingEquipment: z.enum(["yes", "no", ""]).optional(),
});

export const servicesStepSchema = z.object({
  services: z.array(z.enum(serviceValues)).min(1, "Select at least one service"),
  catering: cateringDetailsSchema.optional(),
  kitchen: kitchenDetailsSchema.optional(),
});

export const uploadedFileSchema = z.object({
  name: z.string().max(255),
  path: z.string().max(500),
  size: z.number().int().nonnegative(),
  mime: z.string().max(100),
});

export const enquirySchema = contactStepSchema.merge(projectStepSchema).merge(servicesStepSchema).extend({
  attachments: z.array(uploadedFileSchema).max(10).default([]),
  /** Honeypot — must be empty. */
  website: z.string().max(0).optional(),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;

export const contactMessageSchema = z.object({
  name: trimmed(120).min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email address").max(254),
  company: optionalText(160),
  message: trimmed(3000).min(10, "Enter a message"),
  website: z.string().max(0).optional(),
});
export type ContactMessage = z.infer<typeof contactMessageSchema>;

/** Upload constraints shared by client and server. */
export const UPLOAD = {
  maxFiles: 10,
  maxBytes: 20 * 1024 * 1024,
  allowed: {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  } as Record<string, string[]>,
} as const;
