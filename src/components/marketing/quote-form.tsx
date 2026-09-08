"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import {
  enquirySchema,
  CATERING_SERVICES,
  KITCHEN_SERVICES,
  SERVICE_OPTIONS,
  UPLOAD,
  type EnquiryInput,
} from "@/lib/validation/enquiry";
import { submitEnquiry } from "@/features/enquiries/actions";
import { Field, Input, Textarea, Select, CheckboxTile } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { key: "contact", title: "Contact", fields: ["companyName", "contactName", "jobTitle", "email", "phone"] },
  { key: "project", title: "Project", fields: ["projectName", "location", "requiredStartDate", "expectedDuration", "description"] },
  { key: "services", title: "Services", fields: ["services"] },
  { key: "documents", title: "Documents", fields: ["attachments"] },
] as const;

const DRAFT_KEY = "oar:quote-draft:v1";
const SESSION_KEY = "oar:quote-session:v1";

type Attachment = { name: string; path: string; size: number; mime: string };
type UploadState = { id: string; name: string; size: number; status: "uploading" | "done" | "error"; error?: string; stored?: Attachment };

const defaultValues: EnquiryInput = {
  companyName: "",
  contactName: "",
  jobTitle: "",
  email: "",
  phone: "",
  projectName: "",
  location: "",
  requiredStartDate: "",
  expectedDuration: "",
  description: "",
  services: [],
  catering: {},
  kitchen: { kitchenType: [] },
  attachments: [],
  website: "",
};

function uuid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

/**
 * Multi-step commercial enquiry. Draft persists to localStorage so a long
 * submission is never lost. Uploads go to /api/enquiry-upload as they are
 * chosen; stored paths are attached on final submit.
 */
export function QuoteForm({ initialService }: { initialService?: string }) {
  "use no memo"; // react-hook-form's watch() is not React-Compiler safe
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ reference: string | null } | null>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [restored, setRestored] = useState(false);
  const sessionRef = useRef<string>("");
  const topRef = useRef<HTMLDivElement>(null);

  const form = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues,
    mode: "onBlur",
  });
  const { register, handleSubmit, trigger, watch, setValue, getValues, setError, formState } = form;
  const { errors } = formState;

  const services = watch("services") ?? [];
  const showCatering = services.some((s) => CATERING_SERVICES.includes(s));
  const showKitchen = services.some((s) => KITCHEN_SERVICES.includes(s));

  // Restore draft + session
  useEffect(() => {
    try {
      let session = localStorage.getItem(SESSION_KEY);
      if (!session) {
        session = uuid();
        localStorage.setItem(SESSION_KEY, session);
      }
      sessionRef.current = session;
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { values: EnquiryInput; step: number; uploads: UploadState[] };
        form.reset({ ...defaultValues, ...draft.values });
        setStep(Math.min(draft.step ?? 0, STEPS.length - 1));
        setUploads((draft.uploads ?? []).filter((u) => u.status === "done"));
        setRestored(true);
      }
    } catch {
      sessionRef.current = uuid();
    }
    if (initialService && SERVICE_OPTIONS.some((o) => o.value === initialService)) {
      const current = getValues("services") ?? [];
      if (!current.includes(initialService as EnquiryInput["services"][number])) {
        setValue("services", [...current, initialService as EnquiryInput["services"][number]]);
      }
    }
    track("quote_started");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft
  useEffect(() => {
    const sub = watch((values) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step, uploads }));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [watch, step, uploads]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), step, uploads }));
    } catch {}
  }, [step, uploads, getValues]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const next = async () => {
    const fields = STEPS[step]!.fields as unknown as FieldPath<EnquiryInput>[];
    const valid = await trigger(fields, { shouldFocus: true });
    if (!valid) return;
    track("quote_step_completed", { step: STEPS[step]!.key });
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollTop();
  };
  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  };

  const onUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const list = Array.from(files).slice(0, UPLOAD.maxFiles - uploads.length);
      for (const file of list) {
        const id = uuid();
        setUploads((u) => [...u, { id, name: file.name, size: file.size, status: "uploading" }]);
        const body = new FormData();
        body.append("file", file);
        body.append("session", sessionRef.current);
        try {
          const res = await fetch("/api/enquiry-upload", { method: "POST", body });
          const json = (await res.json()) as Attachment | { error: string };
          if (!res.ok || "error" in json) {
            setUploads((u) => u.map((x) => (x.id === id ? { ...x, status: "error", error: "error" in json ? json.error : "Upload failed" } : x)));
          } else {
            setUploads((u) => u.map((x) => (x.id === id ? { ...x, status: "done", stored: json } : x)));
          }
        } catch {
          setUploads((u) => u.map((x) => (x.id === id ? { ...x, status: "error", error: "Network error" } : x)));
        }
      }
    },
    [uploads.length],
  );

  const removeUpload = (id: string) => setUploads((u) => u.filter((x) => x.id !== id));

  const onSubmit = (values: EnquiryInput) => {
    setServerError(null);
    const attachments = uploads.filter((u) => u.status === "done" && u.stored).map((u) => u.stored!);
    startTransition(async () => {
      const result = await submitEnquiry({ ...values, attachments });
      if (result.ok) {
        track("quote_submitted");
        try {
          localStorage.removeItem(DRAFT_KEY);
          localStorage.removeItem(SESSION_KEY);
        } catch {}
        setSubmitted({ reference: result.reference });
        scrollTop();
        return;
      }
      if (result.fieldErrors) {
        const keys = Object.keys(result.fieldErrors);
        for (const k of keys) setError(k as FieldPath<EnquiryInput>, { message: result.fieldErrors[k]?.[0] });
        const firstStep = STEPS.findIndex((s) => (s.fields as readonly string[]).some((f) => keys.includes(f)));
        if (firstStep >= 0) setStep(firstStep);
      }
      setServerError(result.error);
    });
  };

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  if (submitted) {
    return (
      <div ref={topRef} role="status" className="max-w-xl scroll-mt-32">
        <CheckCircle2 className="size-8 text-copper-dark" aria-hidden />
        <h2 className="font-display display-md mt-4">Enquiry received</h2>
        <p className="mt-4 text-lg text-muted-light">
          Thank you. We’ve sent a confirmation to your email and a member of the team will be in touch to discuss scope and next steps.
        </p>
        {submitted.reference ? (
          <p className="mt-4 text-sm text-muted-light">
            Reference: <span className="font-mono text-graphite">{submitted.reference.slice(0, 8).toUpperCase()}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      {/* Stepper */}
      <ol className="flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex-1">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn("w-full text-left", i > step && "cursor-default")}
              aria-current={i === step ? "step" : undefined}
            >
              <span className={cn("block h-1 rounded-full transition-colors", i <= step ? "bg-copper" : "bg-graphite/15")} />
              <span className={cn("mt-2 hidden text-xs sm:block", i === step ? "text-graphite" : "text-muted-light")}>
                {String(i + 1).padStart(2, "0")} {s.title}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted-light sm:hidden">
        Step {step + 1} of {STEPS.length} — {STEPS[step]!.title}
      </p>
      <span className="sr-only">{Math.round(progress)}% complete</span>

      {restored ? (
        <p className="mt-6 rounded-md bg-copper/10 px-4 py-3 text-sm text-graphite">
          We restored your unfinished enquiry.{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => {
              form.reset(defaultValues);
              setUploads([]);
              setStep(0);
              setRestored(false);
              try {
                localStorage.removeItem(DRAFT_KEY);
              } catch {}
            }}
          >
            Start again
          </button>
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10">
        {/* Step 1 — Contact */}
        <fieldset className={cn(step !== 0 && "hidden")}>
          <legend className="font-display display-sm">Who are we talking to?</legend>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Company name" htmlFor="companyName" error={errors.companyName?.message} className="sm:col-span-2">
              <Input id="companyName" autoComplete="organization" aria-invalid={!!errors.companyName} {...register("companyName")} />
            </Field>
            <Field label="Contact name" htmlFor="contactName" error={errors.contactName?.message}>
              <Input id="contactName" autoComplete="name" aria-invalid={!!errors.contactName} {...register("contactName")} />
            </Field>
            <Field label="Job title" htmlFor="jobTitle" optional>
              <Input id="jobTitle" autoComplete="organization-title" {...register("jobTitle")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" inputMode="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
            </Field>
          </div>
        </fieldset>

        {/* Step 2 — Project */}
        <fieldset className={cn(step !== 1 && "hidden")}>
          <legend className="font-display display-sm">Tell us about the project</legend>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Project name" htmlFor="projectName" error={errors.projectName?.message} className="sm:col-span-2">
              <Input id="projectName" aria-invalid={!!errors.projectName} {...register("projectName")} />
            </Field>
            <Field label="Location" htmlFor="location" error={errors.location?.message} hint="Town / city or site postcode" className="sm:col-span-2">
              <Input id="location" aria-invalid={!!errors.location} {...register("location")} />
            </Field>
            <Field label="Required start date" htmlFor="requiredStartDate" optional error={errors.requiredStartDate?.message}>
              <Input id="requiredStartDate" type="date" {...register("requiredStartDate")} />
            </Field>
            <Field label="Expected duration" htmlFor="expectedDuration" optional hint="e.g. 18 months, ongoing, 6 weeks">
              <Input id="expectedDuration" {...register("expectedDuration")} />
            </Field>
            <Field label="Project description" htmlFor="description" error={errors.description?.message} className="sm:col-span-2" hint="Scope, headcount, existing facilities, constraints — whatever helps us understand the requirement.">
              <Textarea id="description" rows={7} aria-invalid={!!errors.description} {...register("description")} />
            </Field>
          </div>
        </fieldset>

        {/* Step 3 — Services */}
        <fieldset className={cn(step !== 2 && "hidden")}>
          <legend className="font-display display-sm">What do you need?</legend>
          <p className="mt-3 text-muted-light">Select everything that applies. We’ll ask a few follow-up questions based on your choices.</p>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SERVICE_OPTIONS.map((o) => (
              <CheckboxTile key={o.value} id={`svc-${o.value}`} label={o.label} value={o.value} {...register("services")} />
            ))}
          </div>
          {errors.services?.message ? (
            <p role="alert" className="mt-3 text-sm text-status-danger">
              {errors.services.message as string}
            </p>
          ) : null}

          {showCatering ? (
            <div className="mt-12 border-t border-graphite/12 pt-10">
              <h3 className="font-display text-3xl">Catering requirements</h3>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Estimated workforce / diners" htmlFor="estimatedDiners" optional>
                  <Input id="estimatedDiners" inputMode="numeric" {...register("catering.estimatedDiners")} />
                </Field>
                <Field label="Meals required per day" htmlFor="mealsPerDay" optional>
                  <Input id="mealsPerDay" inputMode="numeric" {...register("catering.mealsPerDay")} />
                </Field>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium">Meals required</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <CheckboxTile id="m-breakfast" label="Breakfast" {...register("catering.breakfast")} />
                    <CheckboxTile id="m-lunch" label="Lunch" {...register("catering.lunch")} />
                    <CheckboxTile id="m-dinner" label="Dinner" {...register("catering.dinner")} />
                    <CheckboxTile id="m-sevenday" label="7-day service" {...register("catering.sevenDay")} />
                  </div>
                </div>
                <Field label="Operating hours" htmlFor="operatingHours" optional hint="e.g. 06:00–20:00, shifts">
                  <Input id="operatingHours" {...register("catering.operatingHours")} />
                </Field>
                <Field label="Contract duration" htmlFor="contractDuration" optional>
                  <Input id="contractDuration" {...register("catering.contractDuration")} />
                </Field>
                <Field label="Is there an existing kitchen?" htmlFor="existingKitchen" optional>
                  <Select id="existingKitchen" {...register("catering.existingKitchen")}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="unsure">Not sure</option>
                  </Select>
                </Field>
                <Field label="Temporary facility required?" htmlFor="temporaryFacility" optional>
                  <Select id="temporaryFacility" {...register("catering.temporaryFacility")}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="unsure">Not sure</option>
                  </Select>
                </Field>
              </div>
            </div>
          ) : null}

          {showKitchen ? (
            <div className="mt-12 border-t border-graphite/12 pt-10">
              <h3 className="font-display text-3xl">Kitchen requirements</h3>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium">Type of kitchen</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ["new-installation", "New installation"],
                      ["refurbishment", "Refurbishment"],
                      ["temporary", "Temporary"],
                      ["modular", "Modular"],
                      ["portacabin", "Portacabin"],
                      ["container", "Container"],
                    ].map(([v, l]) => (
                      <CheckboxTile key={v} id={`kt-${v}`} label={l!} value={v} {...register("kitchen.kitchenType")} />
                    ))}
                  </div>
                </div>
                <Field label="Approximate kitchen size" htmlFor="approximateSize" optional hint="m² or dimensions">
                  <Input id="approximateSize" {...register("kitchen.approximateSize")} />
                </Field>
                <Field label="Required throughput" htmlFor="requiredThroughput" optional hint="covers per service / per day">
                  <Input id="requiredThroughput" {...register("kitchen.requiredThroughput")} />
                </Field>
                <Field label="Required completion date" htmlFor="requiredCompletionDate" optional error={errors.kitchen?.requiredCompletionDate?.message}>
                  <Input id="requiredCompletionDate" type="date" {...register("kitchen.requiredCompletionDate")} />
                </Field>
                <div className="grid grid-cols-2 gap-5">
                  <Field label="Existing drawings?" htmlFor="existingDrawings" optional>
                    <Select id="existingDrawings" {...register("kitchen.existingDrawings")}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Select>
                  </Field>
                  <Field label="Existing equipment?" htmlFor="existingEquipment" optional>
                    <Select id="existingEquipment" {...register("kitchen.existingEquipment")}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Select>
                  </Field>
                </div>
              </div>
            </div>
          ) : null}
        </fieldset>

        {/* Step 4 — Documents */}
        <fieldset className={cn(step !== 3 && "hidden")}>
          <legend className="font-display display-sm">Any documents to share?</legend>
          <p className="mt-3 text-muted-light">
            Drawings, tender documents, photos, specifications, site plans or equipment schedules. PDF, DOCX, XLSX, JPG or PNG up to {UPLOAD.maxBytes / 1024 / 1024} MB each. Optional.
          </p>

          <label
            htmlFor="attachments"
            className="mt-8 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-graphite/30 bg-white/40 p-8 text-center transition-colors hover:border-copper focus-within:border-copper"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void onUpload(e.dataTransfer.files);
            }}
          >
            <UploadCloud className="size-7 text-copper-dark" aria-hidden />
            <span className="text-[0.9375rem] font-medium">Tap to choose files, or drag them here</span>
            <span className="text-xs text-muted-light">Up to {UPLOAD.maxFiles} files</span>
            <input
              id="attachments"
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(e) => {
                void onUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {uploads.length ? (
            <ul className="mt-6 divide-y divide-graphite/12 border-y border-graphite/12">
              {uploads.map((u) => (
                <li key={u.id} className="flex items-center gap-4 py-3">
                  {u.status === "uploading" ? <Loader2 className="size-5 animate-spin text-muted-light" aria-hidden /> : <FileText className={cn("size-5", u.status === "error" ? "text-status-danger" : "text-copper-dark")} aria-hidden />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem]">{u.name}</p>
                    <p className={cn("text-xs", u.status === "error" ? "text-status-danger" : "text-muted-light")}>
                      {u.status === "uploading" ? "Uploading…" : u.status === "error" ? u.error : `${(u.size / 1024 / 1024).toFixed(1)} MB`}
                    </p>
                  </div>
                  <button type="button" onClick={() => removeUpload(u.id)} aria-label={`Remove ${u.name}`} className="inline-flex size-11 items-center justify-center rounded-full text-muted-light hover:bg-graphite/5 hover:text-graphite">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-10 border-t border-graphite/12 pt-8">
            <h3 className="font-display text-2xl">Review</h3>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Summary label="Company" value={watch("companyName")} />
              <Summary label="Contact" value={`${watch("contactName")}${watch("email") ? ` · ${watch("email")}` : ""}`} />
              <Summary label="Project" value={watch("projectName")} />
              <Summary label="Location" value={watch("location")} />
              <Summary label="Services" value={services.map((s) => SERVICE_OPTIONS.find((o) => o.value === s)?.label ?? s).join(", ")} />
            </dl>
          </div>
        </fieldset>

        {/* Honeypot */}
        <div className="hidden" aria-hidden>
          <label htmlFor="website">Website</label>
          <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>

        {serverError ? (
          <p role="alert" className="mt-8 rounded-md bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
            {serverError}
          </p>
        ) : null}

        {/* Actions — sticky on mobile */}
        <div className="sticky bottom-0 z-10 -mx-5 mt-10 flex items-center justify-between gap-3 border-t border-graphite/12 bg-ivory/95 px-5 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={back} className="pl-0">
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="obsidian" size="lg" onClick={next} arrow>
              Continue
            </Button>
          ) : (
            <Button type="submit" variant="copper" size="lg" disabled={pending || uploads.some((u) => u.status === "uploading")} arrow>
              {pending ? "Submitting…" : "Submit enquiry"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Summary({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-3 border-b border-graphite/10 pb-2">
      <dt className="w-24 shrink-0 text-muted-light">{label}</dt>
      <dd className="min-w-0 flex-1 truncate">{value || <span className="text-muted-light">—</span>}</dd>
    </div>
  );
}
