"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { contactMessageSchema, type ContactMessage } from "@/lib/validation/enquiry";
import { submitContactMessage } from "@/features/enquiries/actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/events";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactMessage>({ resolver: zodResolver(contactMessageSchema), mode: "onBlur" });

  if (done) {
    return (
      <div role="status" className="border-l-2 border-copper pl-6">
        <CheckCircle2 className="size-6 text-copper-dark" aria-hidden />
        <p className="mt-3 font-display text-3xl">Message sent</p>
        <p className="mt-2 text-muted-light">Thanks — we’ll reply by email.</p>
      </div>
    );
  }

  const onSubmit = (values: ContactMessage) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitContactMessage(values);
      if (result.ok) {
        track("contact_submitted");
        setDone(true);
        return;
      }
      if (result.fieldErrors) {
        for (const [k, msgs] of Object.entries(result.fieldErrors)) {
          setError(k as keyof ContactMessage, { message: msgs[0] });
        }
      }
      setServerError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Name" htmlFor="c-name" error={errors.name?.message}>
        <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field label="Email" htmlFor="c-email" error={errors.email?.message}>
        <Input id="c-email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field label="Company" htmlFor="c-company" optional className="sm:col-span-2">
        <Input id="c-company" autoComplete="organization" {...register("company")} />
      </Field>
      <Field label="Message" htmlFor="c-message" error={errors.message?.message} className="sm:col-span-2">
        <Textarea id="c-message" aria-invalid={!!errors.message} {...register("message")} />
      </Field>
      {/* Honeypot */}
      <div className="hidden" aria-hidden>
        <label htmlFor="c-website">Website</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      {serverError ? (
        <p role="alert" className="text-sm text-status-danger sm:col-span-2">
          {serverError}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" variant="obsidian" size="lg" disabled={pending} arrow>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
