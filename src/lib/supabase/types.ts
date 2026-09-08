/**
 * Database types.
 *
 * Hand-maintained for Phase 0. Once the Supabase project exists, regenerate with:
 *   npx supabase gen types typescript --project-id <id> --schema public > src/lib/supabase/types.ts
 * and remove this header.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrganisationRole =
  | "owner"
  | "administrator"
  | "finance"
  | "project_manager"
  | "staff"
  | "read_only";

export type EnquiryStatus = "new" | "reviewed" | "converted" | "spam" | "archived";

type Timestamps = { created_at: string; updated_at: string };

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: Timestamps & {
          id: string;
          name: string;
          slug: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organisations"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: Timestamps & {
          id: string; // = auth.users.id
          full_name: string | null;
          email: string | null;
          avatar_path: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      organisation_members: {
        Row: Timestamps & {
          id: string;
          organisation_id: string;
          user_id: string;
          role: OrganisationRole;
          invited_by: string | null;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          user_id: string;
          role: OrganisationRole;
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organisation_members"]["Insert"]>;
        Relationships: [];
      };
      enquiries: {
        Row: Timestamps & {
          id: string;
          organisation_id: string;
          status: EnquiryStatus;
          source: string;
          company_name: string;
          contact_name: string;
          job_title: string | null;
          email: string;
          phone: string;
          project_name: string;
          location: string;
          required_start_date: string | null;
          expected_duration: string | null;
          description: string;
          services: string[];
          catering_details: Json | null;
          kitchen_details: Json | null;
          attachments: Json;
          metadata: Json;
          lead_id: string | null;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          status?: EnquiryStatus;
          source?: string;
          company_name: string;
          contact_name: string;
          job_title?: string | null;
          email: string;
          phone: string;
          project_name: string;
          location: string;
          required_start_date?: string | null;
          expected_duration?: string | null;
          description: string;
          services: string[];
          catering_details?: Json | null;
          kitchen_details?: Json | null;
          attachments?: Json;
          metadata?: Json;
          lead_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["enquiries"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_org_member: { Args: { org_id: string }; Returns: boolean };
      org_role: { Args: { org_id: string }; Returns: OrganisationRole | null };
    };
    Enums: {
      organisation_role: OrganisationRole;
      enquiry_status: EnquiryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
