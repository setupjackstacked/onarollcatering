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
      catalogue_items: {
        Row: {
          id: string;
          organisation_id: string;
          name: string;
          category: string;
          description: string | null;
          unit: string;
          cost_price: string;
          sell_price: string;
          vat_rate_key: string;
          equipment_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          name: string;
          category?: string;
          description?: string | null;
          unit?: string;
          cost_price?: string;
          sell_price?: string;
          vat_rate_key?: string;
          equipment_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          unit?: string;
          cost_price?: string;
          sell_price?: string;
          vat_rate_key?: string;
          equipment_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalogue_items_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
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
      invoice_items: {
        Row: {
          id: string;
          organisation_id: string;
          invoice_id: string;
          position: number;
          description: string;
          category: string;
          quantity: string;
          unit: string;
          sell_price: string;
          discount_pct: string;
          vat_rate: string;
          line_net: string;
          line_vat: string;
          line_total: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          invoice_id: string;
          position?: number;
          description: string;
          category?: string;
          quantity?: string;
          unit?: string;
          sell_price?: string;
          discount_pct?: string;
          vat_rate?: string;
          line_net?: string;
          line_vat?: string;
          line_total?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          invoice_id?: string;
          position?: number;
          description?: string;
          category?: string;
          quantity?: string;
          unit?: string;
          sell_price?: string;
          discount_pct?: string;
          vat_rate?: string;
          line_net?: string;
          line_vat?: string;
          line_total?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          organisation_id: string;
          invoice_number: string;
          kind: Database["public"]["Enums"]["invoice_kind"];
          status: Database["public"]["Enums"]["invoice_status"];
          client_id: string;
          contact_id: string | null;
          project_id: string | null;
          quote_id: string | null;
          credit_for_invoice_id: string | null;
          title: string;
          reference: string | null;
          currency: string;
          issue_date: string | null;
          due_date: string | null;
          discount_pct: string;
          subtotal: string;
          discount_amount: string;
          vat_amount: string;
          total: string;
          amount_paid: string;
          notes: string | null;
          terms: string | null;
          internal_notes: string | null;
          public_token: string;
          issued_at: string | null;
          sent_at: string | null;
          paid_at: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          created_by: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          invoice_number: string;
          kind?: Database["public"]["Enums"]["invoice_kind"];
          status?: Database["public"]["Enums"]["invoice_status"];
          client_id: string;
          contact_id?: string | null;
          project_id?: string | null;
          quote_id?: string | null;
          credit_for_invoice_id?: string | null;
          title: string;
          reference?: string | null;
          currency?: string;
          issue_date?: string | null;
          due_date?: string | null;
          discount_pct?: string;
          subtotal?: string;
          discount_amount?: string;
          vat_amount?: string;
          total?: string;
          amount_paid?: string;
          notes?: string | null;
          terms?: string | null;
          internal_notes?: string | null;
          public_token?: string;
          issued_at?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          created_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          invoice_number?: string;
          kind?: Database["public"]["Enums"]["invoice_kind"];
          status?: Database["public"]["Enums"]["invoice_status"];
          client_id?: string;
          contact_id?: string | null;
          project_id?: string | null;
          quote_id?: string | null;
          credit_for_invoice_id?: string | null;
          title?: string;
          reference?: string | null;
          currency?: string;
          issue_date?: string | null;
          due_date?: string | null;
          discount_pct?: string;
          subtotal?: string;
          discount_amount?: string;
          vat_amount?: string;
          total?: string;
          amount_paid?: string;
          notes?: string | null;
          terms?: string | null;
          internal_notes?: string | null;
          public_token?: string;
          issued_at?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          created_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "client_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_credit_for_invoice_id_fkey";
            columns: ["credit_for_invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
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
      notes: {
        Row: {
          id: string;
          organisation_id: string;
          entity_type: string;
          entity_id: string;
          body: string;
          pinned: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          entity_type: string;
          entity_id: string;
          body: string;
          pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          entity_type?: string;
          entity_id?: string;
          body?: string;
          pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
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
          {
            foreignKeyName: "organisation_members_profile_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
      payments: {
        Row: {
          id: string;
          organisation_id: string;
          invoice_id: string;
          paid_on: string;
          amount: string;
          method: Database["public"]["Enums"]["payment_method"];
          reference: string | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          invoice_id: string;
          paid_on?: string;
          amount: string;
          method?: Database["public"]["Enums"]["payment_method"];
          reference?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          invoice_id?: string;
          paid_on?: string;
          amount?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          reference?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
      quote_items: {
        Row: {
          id: string;
          organisation_id: string;
          quote_id: string;
          position: number;
          catalogue_item_id: string | null;
          description: string;
          category: string;
          quantity: string;
          unit: string;
          cost_price: string;
          sell_price: string;
          discount_pct: string;
          vat_rate: string;
          line_net: string;
          line_vat: string;
          line_total: string;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          quote_id: string;
          position?: number;
          catalogue_item_id?: string | null;
          description: string;
          category?: string;
          quantity?: string;
          unit?: string;
          cost_price?: string;
          sell_price?: string;
          discount_pct?: string;
          vat_rate?: string;
          line_net?: string;
          line_vat?: string;
          line_total?: string;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          quote_id?: string;
          position?: number;
          catalogue_item_id?: string | null;
          description?: string;
          category?: string;
          quantity?: string;
          unit?: string;
          cost_price?: string;
          sell_price?: string;
          discount_pct?: string;
          vat_rate?: string;
          line_net?: string;
          line_vat?: string;
          line_total?: string;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_items_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_items_catalogue_item_id_fkey";
            columns: ["catalogue_item_id"];
            isOneToOne: false;
            referencedRelation: "catalogue_items";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          id: string;
          organisation_id: string;
          quote_number: string;
          revision: number;
          root_quote_id: string | null;
          supersedes_quote_id: string | null;
          status: Database["public"]["Enums"]["quote_status"];
          client_id: string;
          contact_id: string | null;
          project_id: string | null;
          lead_id: string | null;
          title: string;
          currency: string;
          issue_date: string;
          expiry_date: string;
          discount_pct: string;
          subtotal: string;
          discount_amount: string;
          vat_amount: string;
          total: string;
          cost_total: string;
          scope_notes: string | null;
          terms: string | null;
          internal_notes: string | null;
          public_token: string;
          sent_at: string | null;
          viewed_at: string | null;
          accepted_at: string | null;
          rejected_at: string | null;
          decision_name: string | null;
          decision_note: string | null;
          converted_project_id: string | null;
          converted_invoice_id: string | null;
          created_by: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          quote_number: string;
          revision?: number;
          root_quote_id?: string | null;
          supersedes_quote_id?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
          client_id: string;
          contact_id?: string | null;
          project_id?: string | null;
          lead_id?: string | null;
          title: string;
          currency?: string;
          issue_date?: string;
          expiry_date?: string;
          discount_pct?: string;
          subtotal?: string;
          discount_amount?: string;
          vat_amount?: string;
          total?: string;
          cost_total?: string;
          scope_notes?: string | null;
          terms?: string | null;
          internal_notes?: string | null;
          public_token?: string;
          sent_at?: string | null;
          viewed_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          decision_name?: string | null;
          decision_note?: string | null;
          converted_project_id?: string | null;
          converted_invoice_id?: string | null;
          created_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          quote_number?: string;
          revision?: number;
          root_quote_id?: string | null;
          supersedes_quote_id?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
          client_id?: string;
          contact_id?: string | null;
          project_id?: string | null;
          lead_id?: string | null;
          title?: string;
          currency?: string;
          issue_date?: string;
          expiry_date?: string;
          discount_pct?: string;
          subtotal?: string;
          discount_amount?: string;
          vat_amount?: string;
          total?: string;
          cost_total?: string;
          scope_notes?: string | null;
          terms?: string | null;
          internal_notes?: string | null;
          public_token?: string;
          sent_at?: string | null;
          viewed_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          decision_name?: string | null;
          decision_note?: string | null;
          converted_project_id?: string | null;
          converted_invoice_id?: string | null;
          created_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_root_quote_id_fkey";
            columns: ["root_quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_supersedes_quote_id_fkey";
            columns: ["supersedes_quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "client_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_converted_project_id_fkey";
            columns: ["converted_project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_converted_invoice_fk";
            columns: ["converted_invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
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
      tasks: {
        Row: {
          id: string;
          organisation_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          assignee_user_id: string | null;
          due_date: string | null;
          priority: Database["public"]["Enums"]["task_priority"];
          status: Database["public"]["Enums"]["task_status"];
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          assignee_user_id?: string | null;
          due_date?: string | null;
          priority?: Database["public"]["Enums"]["task_priority"];
          status?: Database["public"]["Enums"]["task_status"];
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          assignee_user_id?: string | null;
          due_date?: string | null;
          priority?: Database["public"]["Enums"]["task_priority"];
          status?: Database["public"]["Enums"]["task_status"];
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_user_id_fkey";
            columns: ["assignee_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      vat_rates: {
        Row: {
          id: string;
          organisation_id: string;
          key: string;
          label: string;
          rate: string;
          is_default: boolean;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          key: string;
          label: string;
          rate: string;
          is_default?: boolean;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          key?: string;
          label?: string;
          rate?: string;
          is_default?: boolean;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vat_rates_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      organisation_member_profiles: {
        Row: {
          organisation_id: string | null;
          user_id: string | null;
          role: Database["public"]["Enums"]["organisation_role"] | null;
          accepted_at: string | null;
          full_name: string | null;
          email: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
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
      convert_enquiry_to_lead: { Args: { p_enquiry_id: string; p_assignee?: unknown }; Returns: string };
      log_activity: {
        Args: { org: string; entity_type: string; entity_id: string; action: string; metadata?: Json };
        Returns: string;
      };
      can_write_project: { Args: { project_id: string }; Returns: boolean };
      role_in: { Args: { org: string; roles: string[] }; Returns: boolean };
      can_read_project: { Args: { project_id: string }; Returns: boolean };
      convert_lead_to_project: {
        Args: {
          p_lead_id: string;
          p_name?: unknown;
          p_site_id?: unknown;
          p_project_manager?: unknown;
          p_contract_value?: unknown;
          p_start_date?: unknown;
        };
        Returns: string;
      };
      recalculate_quote: { Args: { p_quote_id: string }; Returns: undefined };
      create_quote_revision: { Args: { p_quote_id: string }; Returns: string };
      quote_mark_viewed: { Args: { p_token: string }; Returns: undefined };
      convert_quote_to_project: {
        Args: { p_quote_id: string; p_project_manager?: unknown; p_site_id?: unknown };
        Returns: string;
      };
      quote_customer_decision: {
        Args: { p_token: string; p_decision: string; p_name: string; p_note?: unknown };
        Returns: boolean;
      };
      seed_org_finance_defaults: { Args: { org: string }; Returns: undefined };
      replace_quote_items: { Args: { p_quote_id: string; p_items: Json }; Returns: undefined };
      recalculate_invoice: { Args: { p_invoice_id: string }; Returns: undefined };
      refresh_overdue_invoices: { Args: { p_org: string }; Returns: number };
      cancel_invoice: { Args: { p_invoice_id: string; p_reason: string }; Returns: undefined };
      issue_invoice: { Args: { p_invoice_id: string; p_issue_date?: unknown; p_due_date?: unknown }; Returns: string };
      create_credit_note: { Args: { p_invoice_id: string }; Returns: string };
      replace_invoice_items: { Args: { p_invoice_id: string; p_items: Json }; Returns: undefined };
      create_invoice_from_quote: {
        Args: { p_quote_id: string; p_kind?: Database["public"]["Enums"]["invoice_kind"]; p_percent?: unknown };
        Returns: string;
      };
      invoice_mark_viewed: { Args: { p_token: string }; Returns: undefined };
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
      task_status: "todo" | "in_progress" | "blocked" | "complete";
      task_priority: "low" | "medium" | "high" | "urgent";
      quote_status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "superseded";
      invoice_status: "draft" | "issued" | "part_paid" | "paid" | "overdue" | "cancelled" | "credit";
      invoice_kind: "standard" | "deposit" | "milestone" | "final" | "credit_note";
      payment_method: "bank_transfer" | "card" | "cash" | "cheque" | "other";
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
export type QuoteStatus = Database["public"]["Enums"]["quote_status"];
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
export type InvoiceKind = Database["public"]["Enums"]["invoice_kind"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
