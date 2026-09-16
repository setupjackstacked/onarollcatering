"use client";

import { Form, FormRow, TextField, TextArea, SelectField, SubmitButton } from "../form";
import { sendMessage, sendBroadcast } from "@/features/messages/actions";

type Opt = { value: string; label: string };

export function SendMessageForm({ conversationId }: { conversationId: string }) {
  return (
    <Form action={sendMessage.bind(null, conversationId)} className="space-y-3">
      <TextArea name="body" label="Message" rows={3} required placeholder="Write a message" />
      <SubmitButton variant="copper" className="w-full sm:w-auto">Send</SubmitButton>
    </Form>
  );
}

export function BroadcastForm({ sites }: { sites: Opt[] }) {
  return (
    <Form action={sendBroadcast}>
      <FormRow>
        <TextField name="subject" label="Subject" required autoFocus placeholder="e.g. Kitchens closed Monday" />
        <SelectField name="site_id" label="Who gets it" optional options={sites} placeholder="Everyone in the company"
          hint="Pick a site to tell only that team" />
      </FormRow>
      <TextArea name="body" label="Announcement" rows={5} required />
      <SubmitButton variant="copper">Send announcement</SubmitButton>
    </Form>
  );
}
