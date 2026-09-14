"use client";

import { Form, FormRow, TextField, TextArea, SelectField, DateField, SubmitButton, FormActions, Hidden } from "../form";
import { saveTask } from "@/features/tasks/actions";
import { TASK_STATUS_VALUES, TASK_PRIORITY_VALUES, TASK_STATUS_LABEL, TASK_PRIORITY_LABEL } from "@/features/tasks/schema";
import type { Tables } from "@/lib/supabase/types";
import { ActionLink } from "../entity";

type Opt = { value: string; label: string };
export function TaskForm({ task, projects, members, defaults, returnTo }: { task?: Tables<"tasks"> | null; projects: Opt[]; members: Opt[]; defaults?: { project_id?: string }; returnTo: string }) {
  return (
    <Form action={saveTask.bind(null, task?.id ?? null)}>
      <Hidden name="return_to" value={returnTo} />
      <TextField name="title" label="Task" defaultValue={task?.title} required autoFocus />
      <TextArea name="description" label="Description" optional defaultValue={task?.description ?? ""} rows={3} />
      <FormRow>
        <SelectField name="project_id" label="Project" optional options={projects} placeholder="No project (general)" defaultValue={task?.project_id ?? defaults?.project_id ?? ""} />
        <SelectField name="assignee_user_id" label="Assignee" optional options={members} placeholder="Unassigned" defaultValue={task?.assignee_user_id ?? ""} />
        <DateField name="due_date" label="Due date" optional defaultValue={task?.due_date ?? ""} />
        <SelectField name="priority" label="Priority" options={TASK_PRIORITY_VALUES.map((v) => ({ value: v, label: TASK_PRIORITY_LABEL[v] }))} defaultValue={task?.priority ?? "medium"} />
        <SelectField name="status" label="Status" options={TASK_STATUS_VALUES.map((v) => ({ value: v, label: TASK_STATUS_LABEL[v] }))} defaultValue={task?.status ?? "todo"} />
      </FormRow>
      <FormActions>
        <SubmitButton>{task ? "Save task" : "Create task"}</SubmitButton>
        <ActionLink href={returnTo}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
