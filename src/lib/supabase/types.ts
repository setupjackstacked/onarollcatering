/**
 * GENERATED — do not edit. Run `npm run db:types` after changing migrations.
 * Source: supabase/migrations applied to a local PostgreSQL via scripts/db-types.sh
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string;
          organisation_id: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          user_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          user_id?: string | null;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      client_contacts: {
        Row: {
          id: string;
          organisation_id: string;
          client_id: string;
          first_name: string;
          last_name: string;
          job_title: string | null;
          email: string | null;
          mobile: string | null;
          phone: string | null;
          is_primary: boolean;
          is_finance: boolean;
          is_project: boolean;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          client_id: string;
          first_name: string;
          last_name?: string;
          job_title?: string | null;
          email?: string | null;
          mobile?: string | null;
          phone?: string | null;
          is_primary?: boolean;
          is_finance?: boolean;
          is_project?: boolean;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          client_id?: string;
          first_name?: string;
          last_name?: string;
          job_title?: string | null;
          email?: string | null;
          mobile?: string | null;
          phone?: string | null;
          is_primary?: boolean;
          is_finance?: boolean;
          is_project?: boolean;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_contacts_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_contacts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          organisation_id: string;
          name: string;
          legal_name: string | null;
          company_number: string | null;
          vat_number: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          billing_address: Json;
          trading_address: Json;
          payment_terms_days: number;
          notes: string | null;
          owner_user_id: string | null;
          archived_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          name: string;
          legal_name?: string | null;
          company_number?: string | null;
          vat_number?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          billing_address?: Json;
          trading_address?: Json;
          payment_terms_days?: number;
          notes?: string | null;
          owner_user_id?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          name?: string;
          legal_name?: string | null;
          company_number?: string | null;
          vat_number?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          billing_address?: Json;
          trading_address?: Json;
          payment_terms_days?: number;
          notes?: string | null;
          owner_user_id?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      document_categories: {
        Row: {
          id: string;
          organisation_id: string;
          entity: Database["public"]["Enums"]["document_entity"];
          key: string;
          label: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          entity: Database["public"]["Enums"]["document_entity"];
          key: string;
          label: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          entity?: Database["public"]["Enums"]["document_entity"];
          key?: string;
          label?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_categories_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          organisation_id: string;
          entity_type: Database["public"]["Enums"]["document_entity"];
          entity_id: string;
          category_key: string;
          name: string;
          mime_type: string;
          size_bytes: number;
          bucket: string;
          storage_path: string;
          version: number;
          supersedes_id: string | null;
          expiry_date: string | null;
          uploaded_by: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          entity_type: Database["public"]["Enums"]["document_entity"];
          entity_id: string;
          category_key?: string;
          name: string;
          mime_type: string;
          size_bytes: number;
          bucket: string;
          storage_path: string;
          version?: number;
          supersedes_id?: string | null;
          expiry_date?: string | null;
          uploaded_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          entity_type?: Database["public"]["Enums"]["document_entity"];
          entity_id?: string;
          category_key?: string;
          name?: string;
          mime_type?: string;
          size_bytes?: number;
          bucket?: string;
          storage_path?: string;
          version?: number;
          supersedes_id?: string | null;
          expiry_date?: string | null;
          uploaded_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_supersedes_id_fkey";
            columns: ["supersedes_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      enquiries: {
        Row: {
          id: string;
          organisation_id: string;
          status: Database["public"]["Enums"]["enquiry_status"];
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          status?: Database["public"]["Enums"]["enquiry_status"];
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
          services?: string[];
          catering_details?: Json | null;
          kitchen_details?: Json | null;
          attachments?: Json;
          metadata?: Json;
          lead_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          status?: Database["public"]["Enums"]["enquiry_status"];
          source?: string;
          company_name?: string;
          contact_name?: string;
          job_title?: string | null;
          email?: string;
          phone?: string;
          project_name?: string;
          location?: string;
          required_start_date?: string | null;
          expected_duration?: string | null;
          description?: string;
          services?: string[];
          catering_details?: Json | null;
          kitchen_details?: Json | null;
          attachments?: Json;
          metadata?: Json;
          lead_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enquiries_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiries_lead_fk";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_sources: {
        Row: {
          id: string;
          organisation_id: string;
          key: string;
          label: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          key: string;
          label: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          key?: string;
          label?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_sources_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          organisation_id: string;
          title: string;
          status: Database["public"]["Enums"]["lead_status"];
          client_id: string | null;
          contact_id: string | null;
          company_name: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          source_key: string;
          service_keys: string[];
          estimated_value: string | null;
          currency: string;
          project_location: string | null;
          expected_start_date: string | null;
          assigned_user_id: string | null;
          notes: string | null;
          lost_reason: string | null;
          enquiry_id: string | null;
          converted_project_id: string | null;
          closed_at: string | null;
          archived_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          title: string;
          status?: Database["public"]["Enums"]["lead_status"];
          client_id?: string | null;
          contact_id?: string | null;
          company_name?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          source_key?: string;
          service_keys?: string[];
          estimated_value?: string | null;
          currency?: string;
          project_location?: string | null;
          expected_start_date?: string | null;
          assigned_user_id?: string | null;
          notes?: string | null;
          lost_reason?: string | null;
          enquiry_id?: string | null;
          converted_project_id?: string | null;
          closed_at?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          title?: string;
          status?: Database["public"]["Enums"]["lead_status"];
          client_id?: string | null;
          contact_id?: string | null;
          company_name?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          source_key?: string;
          service_keys?: string[];
          estimated_value?: string | null;
          currency?: string;
          project_location?: string | null;
          expected_start_date?: string | null;
          assigned_user_id?: string | null;
          notes?: string | null;
          lost_reason?: string | null;
          enquiry_id?: string | null;
          converted_project_id?: string | null;
          closed_at?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "client_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_enquiry_id_fkey";
            columns: ["enquiry_id"];
            isOneToOne: false;
            referencedRelation: "enquiries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_converted_project_fk";
            columns: ["converted_project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          organisation_id: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string | null;
          entity_type: string | null;
          entity_id: string | null;
          href: string | null;
          read_at: string | null;
          emailed_at: string | null;
          dedupe_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          href?: string | null;
          read_at?: string | null;
          emailed_at?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string;
          body?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          href?: string | null;
          read_at?: string | null;
          emailed_at?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      number_sequences: {
        Row: {
          organisation_id: string;
          kind: string;
          year: number;
          last_value: number;
        };
        Insert: {
          organisation_id: string;
          kind: string;
          year: number;
          last_value?: number;
        };
        Update: {
          organisation_id?: string;
          kind?: string;
          year?: number;
          last_value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "number_sequences_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      organisation_members: {
        Row: {
          id: string;
          organisation_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["organisation_role"];
          invited_by: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["organisation_role"];
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["organisation_role"];
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organisation_members_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organisation_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organisation_members_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      organisations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          organisation_id: string;
          project_number: string;
          name: string;
          description: string | null;
          status: Database["public"]["Enums"]["project_status"];
          client_id: string;
          site_id: string | null;
          lead_id: string | null;
          project_manager_id: string | null;
          start_date: string | null;
          end_date: string | null;
          contract_value: string;
          estimated_cost: string;
          currency: string;
          service_keys: string[];
          notes: string | null;
          archived_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          project_number: string;
          name: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          client_id: string;
          site_id?: string | null;
          lead_id?: string | null;
          project_manager_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          contract_value?: string;
          estimated_cost?: string;
          currency?: string;
          service_keys?: string[];
          notes?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          project_number?: string;
          name?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          client_id?: string;
          site_id?: string | null;
          lead_id?: string | null;
          project_manager_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          contract_value?: string;
          estimated_cost?: string;
          currency?: string;
          service_keys?: string[];
          notes?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_project_manager_id_fkey";
            columns: ["project_manager_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      service_types: {
        Row: {
          id: string;
          organisation_id: string;
          key: string;
          label: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          key: string;
          label: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          key?: string;
          label?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_types_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      sites: {
        Row: {
          id: string;
          organisation_id: string;
          client_id: string;
          name: string;
          address: Json;
          postcode: string | null;
          site_contact_id: string | null;
          access_details: string | null;
          notes: string | null;
          latitude: string | null;
          longitude: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          client_id: string;
          name: string;
          address?: Json;
          postcode?: string | null;
          site_contact_id?: string | null;
          access_details?: string | null;
          notes?: string | null;
          latitude?: string | null;
          longitude?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          client_id?: string;
          name?: string;
          address?: Json;
          postcode?: string | null;
          site_contact_id?: string | null;
          access_details?: string | null;
          notes?: string | null;
          latitude?: string | null;
          longitude?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sites_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sites_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sites_site_contact_id_fkey";
            columns: ["site_contact_id"];
            isOneToOne: false;
            referencedRelation: "client_contacts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      project_financials: {
        Row: {
          project_id: string | null;
          organisation_id: string | null;
          contract_value: string | null;
          estimated_cost: string | null;
          estimated_gross_profit: string | null;
          estimated_margin_pct: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      has_org_role: {
        Args: { org_id: string; roles: Database["public"]["Enums"]["organisation_role"][] };
        Returns: boolean;
      };
      is_org_member: { Args: { org_id: string }; Returns: boolean };
      org_role: { Args: { org_id: string }; Returns: Database["public"]["Enums"]["organisation_role"] };
      seed_org_defaults: { Args: { org: string }; Returns: undefined };
      next_document_number: { Args: { p_org: string; p_kind: string; p_prefix: string }; Returns: string };
      log_activity: {
        Args: { org: string; entity_type: string; entity_id: string; action: string; metadata?: Json };
        Returns: string;
      };
      can_write_project: { Args: { project_id: string }; Returns: boolean };
      role_in: { Args: { org: string; roles: string[] }; Returns: boolean };
      can_read_project: { Args: { project_id: string }; Returns: boolean };
    };
    Enums: {
      organisation_role: "owner" | "administrator" | "finance" | "project_manager" | "staff" | "read_only";
      enquiry_status: "new" | "reviewed" | "converted" | "spam" | "archived";
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "site_survey"
        | "quote_required"
        | "quote_sent"
        | "negotiation"
        | "won"
        | "lost";
      project_status:
        | "lead"
        | "quoted"
        | "approved"
        | "planning"
        | "mobilisation"
        | "procurement"
        | "installation"
        | "operational"
        | "on_hold"
        | "completed"
        | "cancelled";
      document_entity: "client" | "project" | "employee" | "quote" | "invoice" | "supplier" | "lead" | "site";
      notification_type:
        | "invoice_overdue"
        | "quote_expiring"
        | "timesheet_pending"
        | "document_expiring"
        | "staffing_conflict"
        | "task_overdue"
        | "project_deadline"
        | "enquiry_received"
        | "system";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"];

// ---- convenience aliases ----------------------------------------------------
export type OrganisationRole = Database["public"]["Enums"]["organisation_role"];
export type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type DocumentEntity = Database["public"]["Enums"]["document_entity"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
