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
          {
            foreignKeyName: "catalogue_items_equipment_fk";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
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
      conversation_participants: {
        Row: {
          id: string;
          organisation_id: string;
          conversation_id: string;
          user_id: string;
          last_read_at: string | null;
          muted: boolean;
          added_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          conversation_id: string;
          user_id: string;
          last_read_at?: string | null;
          muted?: boolean;
          added_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          conversation_id?: string;
          user_id?: string;
          last_read_at?: string | null;
          muted?: boolean;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          organisation_id: string;
          kind: Database["public"]["Enums"]["conversation_kind"];
          subject: string | null;
          site_id: string | null;
          created_by: string | null;
          last_message_at: string;
          last_message_preview: string | null;
          closed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          kind?: Database["public"]["Enums"]["conversation_kind"];
          subject?: string | null;
          site_id?: string | null;
          created_by?: string | null;
          last_message_at?: string;
          last_message_preview?: string | null;
          closed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          kind?: Database["public"]["Enums"]["conversation_kind"];
          subject?: string | null;
          site_id?: string | null;
          created_by?: string | null;
          last_message_at?: string;
          last_message_preview?: string | null;
          closed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_created_by_fkey";
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
          verification: Database["public"]["Enums"]["verification_status"];
          verified_by: string | null;
          verified_at: string | null;
          notes: string | null;
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
          verification?: Database["public"]["Enums"]["verification_status"];
          verified_by?: string | null;
          verified_at?: string | null;
          notes?: string | null;
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
          verification?: Database["public"]["Enums"]["verification_status"];
          verified_by?: string | null;
          verified_at?: string | null;
          notes?: string | null;
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
          {
            foreignKeyName: "documents_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      employee_roles: {
        Row: {
          id: string;
          organisation_id: string;
          key: string;
          label: string;
          sort_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          key: string;
          label: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          key?: string;
          label?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employee_roles_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          id: string;
          organisation_id: string;
          employee_number: string;
          user_id: string | null;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          address: Json;
          emergency_contact: Json;
          role_key: string;
          employment_type: Database["public"]["Enums"]["employment_type"];
          start_date: string | null;
          end_date: string | null;
          hourly_rate: string | null;
          salary: string | null;
          status: Database["public"]["Enums"]["employee_status"];
          notes: string | null;
          archived_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          primary_site_id: string | null;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          employee_number: string;
          user_id?: string | null;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          address?: Json;
          emergency_contact?: Json;
          role_key?: string;
          employment_type?: Database["public"]["Enums"]["employment_type"];
          start_date?: string | null;
          end_date?: string | null;
          hourly_rate?: string | null;
          salary?: string | null;
          status?: Database["public"]["Enums"]["employee_status"];
          notes?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          primary_site_id?: string | null;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          employee_number?: string;
          user_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          address?: Json;
          emergency_contact?: Json;
          role_key?: string;
          employment_type?: Database["public"]["Enums"]["employment_type"];
          start_date?: string | null;
          end_date?: string | null;
          hourly_rate?: string | null;
          salary?: string | null;
          status?: Database["public"]["Enums"]["employee_status"];
          notes?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          primary_site_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employees_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_primary_site_id_fkey";
            columns: ["primary_site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
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
      equipment: {
        Row: {
          id: string;
          organisation_id: string;
          name: string;
          category: string;
          supplier_id: string | null;
          supplier_sku: string | null;
          description: string | null;
          specification: string | null;
          cost_price: string;
          sell_price: string;
          vat_rate_key: string;
          image_document_id: string | null;
          datasheet_document_id: string | null;
          active: boolean;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          name: string;
          category?: string;
          supplier_id?: string | null;
          supplier_sku?: string | null;
          description?: string | null;
          specification?: string | null;
          cost_price?: string;
          sell_price?: string;
          vat_rate_key?: string;
          image_document_id?: string | null;
          datasheet_document_id?: string | null;
          active?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          name?: string;
          category?: string;
          supplier_id?: string | null;
          supplier_sku?: string | null;
          description?: string | null;
          specification?: string | null;
          cost_price?: string;
          sell_price?: string;
          vat_rate_key?: string;
          image_document_id?: string | null;
          datasheet_document_id?: string | null;
          active?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_image_document_id_fkey";
            columns: ["image_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_datasheet_document_id_fkey";
            columns: ["datasheet_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          organisation_id: string;
          project_id: string | null;
          supplier_id: string | null;
          supplier_name: string | null;
          category: Database["public"]["Enums"]["cost_category"];
          expense_date: string;
          description: string;
          net: string;
          vat: string;
          gross: string | null;
          reference: string | null;
          receipt_document_id: string | null;
          status: Database["public"]["Enums"]["expense_status"];
          employee_id: string | null;
          notes: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_by: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          project_id?: string | null;
          supplier_id?: string | null;
          supplier_name?: string | null;
          category?: Database["public"]["Enums"]["cost_category"];
          expense_date?: string;
          description: string;
          net?: string;
          vat?: string;
          gross?: string | null;
          reference?: string | null;
          receipt_document_id?: string | null;
          status?: Database["public"]["Enums"]["expense_status"];
          employee_id?: string | null;
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          project_id?: string | null;
          supplier_id?: string | null;
          supplier_name?: string | null;
          category?: Database["public"]["Enums"]["cost_category"];
          expense_date?: string;
          description?: string;
          net?: string;
          vat?: string;
          gross?: string | null;
          reference?: string | null;
          receipt_document_id?: string | null;
          status?: Database["public"]["Enums"]["expense_status"];
          employee_id?: string | null;
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_receipt_document_id_fkey";
            columns: ["receipt_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_supplier_fk";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
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
      leave_requests: {
        Row: {
          id: string;
          organisation_id: string;
          employee_id: string;
          leave_type: Database["public"]["Enums"]["leave_type"];
          start_date: string;
          end_date: string;
          days: string;
          reason: string | null;
          status: Database["public"]["Enums"]["leave_status"];
          decided_by: string | null;
          decided_at: string | null;
          decision_note: string | null;
          created_at: string;
          updated_at: string;
          document_id: string | null;
          document_required: boolean;
          document_received_at: string | null;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          employee_id: string;
          leave_type?: Database["public"]["Enums"]["leave_type"];
          start_date: string;
          end_date: string;
          days?: string;
          reason?: string | null;
          status?: Database["public"]["Enums"]["leave_status"];
          decided_by?: string | null;
          decided_at?: string | null;
          decision_note?: string | null;
          created_at?: string;
          updated_at?: string;
          document_id?: string | null;
          document_required?: boolean;
          document_received_at?: string | null;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          employee_id?: string;
          leave_type?: Database["public"]["Enums"]["leave_type"];
          start_date?: string;
          end_date?: string;
          days?: string;
          reason?: string | null;
          status?: Database["public"]["Enums"]["leave_status"];
          decided_by?: string | null;
          decided_at?: string | null;
          decision_note?: string | null;
          created_at?: string;
          updated_at?: string;
          document_id?: string | null;
          document_required?: boolean;
          document_received_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          organisation_id: string;
          conversation_id: string;
          sender_id: string | null;
          body: string;
          document_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          conversation_id: string;
          sender_id?: string | null;
          body: string;
          document_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          conversation_id?: string;
          sender_id?: string | null;
          body?: string;
          document_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
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
      pay_periods: {
        Row: {
          id: string;
          organisation_id: string;
          name: string;
          start_date: string;
          end_date: string;
          pay_date: string | null;
          status: Database["public"]["Enums"]["pay_period_status"];
          notes: string | null;
          finalised_at: string | null;
          finalised_by: string | null;
          exported_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          name: string;
          start_date: string;
          end_date: string;
          pay_date?: string | null;
          status?: Database["public"]["Enums"]["pay_period_status"];
          notes?: string | null;
          finalised_at?: string | null;
          finalised_by?: string | null;
          exported_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          pay_date?: string | null;
          status?: Database["public"]["Enums"]["pay_period_status"];
          notes?: string | null;
          finalised_at?: string | null;
          finalised_by?: string | null;
          exported_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pay_periods_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pay_periods_finalised_by_fkey";
            columns: ["finalised_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pay_periods_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
      payroll_adjustments: {
        Row: {
          id: string;
          organisation_id: string;
          payroll_entry_id: string;
          kind: Database["public"]["Enums"]["pay_adjustment_kind"];
          label: string;
          amount: string;
          expense_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          payroll_entry_id: string;
          kind?: Database["public"]["Enums"]["pay_adjustment_kind"];
          label: string;
          amount: string;
          expense_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          payroll_entry_id?: string;
          kind?: Database["public"]["Enums"]["pay_adjustment_kind"];
          label?: string;
          amount?: string;
          expense_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_adjustments_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_adjustments_payroll_entry_id_fkey";
            columns: ["payroll_entry_id"];
            isOneToOne: false;
            referencedRelation: "payroll_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_adjustments_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_adjustments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      payroll_entries: {
        Row: {
          id: string;
          organisation_id: string;
          pay_period_id: string;
          employee_id: string;
          standard_hours: string;
          overtime_hours: string;
          hourly_rate: string;
          overtime_rate: string;
          base_pay: string | null;
          overtime_pay: string | null;
          adjustments: string;
          expenses: string;
          gross_pay: string;
          timesheet_count: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          pay_period_id: string;
          employee_id: string;
          standard_hours?: string;
          overtime_hours?: string;
          hourly_rate?: string;
          overtime_rate?: string;
          base_pay?: string | null;
          overtime_pay?: string | null;
          adjustments?: string;
          expenses?: string;
          gross_pay?: string;
          timesheet_count?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          pay_period_id?: string;
          employee_id?: string;
          standard_hours?: string;
          overtime_hours?: string;
          hourly_rate?: string;
          overtime_rate?: string;
          base_pay?: string | null;
          overtime_pay?: string | null;
          adjustments?: string;
          expenses?: string;
          gross_pay?: string;
          timesheet_count?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_entries_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_entries_pay_period_id_fkey";
            columns: ["pay_period_id"];
            isOneToOne: false;
            referencedRelation: "pay_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_entries_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
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
      project_cost_estimates: {
        Row: {
          id: string;
          organisation_id: string;
          project_id: string;
          category: Database["public"]["Enums"]["cost_category"];
          amount: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          project_id: string;
          category: Database["public"]["Enums"]["cost_category"];
          amount?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          project_id?: string;
          category?: Database["public"]["Enums"]["cost_category"];
          amount?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_cost_estimates_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_cost_estimates_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
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
      shifts: {
        Row: {
          id: string;
          organisation_id: string;
          employee_id: string;
          project_id: string | null;
          site_id: string | null;
          shift_date: string;
          start_time: string;
          end_time: string;
          break_minutes: number;
          role_key: string | null;
          status: Database["public"]["Enums"]["shift_status"];
          notes: string | null;
          hours: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          employee_id: string;
          project_id?: string | null;
          site_id?: string | null;
          shift_date: string;
          start_time: string;
          end_time: string;
          break_minutes?: number;
          role_key?: string | null;
          status?: Database["public"]["Enums"]["shift_status"];
          notes?: string | null;
          hours?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          employee_id?: string;
          project_id?: string | null;
          site_id?: string | null;
          shift_date?: string;
          start_time?: string;
          end_time?: string;
          break_minutes?: number;
          role_key?: string | null;
          status?: Database["public"]["Enums"]["shift_status"];
          notes?: string | null;
          hours?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shifts_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      site_assignments: {
        Row: {
          id: string;
          organisation_id: string;
          site_id: string;
          user_id: string;
          employee_id: string | null;
          role: Database["public"]["Enums"]["site_role"];
          is_primary: boolean;
          starts_on: string | null;
          ends_on: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          site_id: string;
          user_id: string;
          employee_id?: string | null;
          role?: Database["public"]["Enums"]["site_role"];
          is_primary?: boolean;
          starts_on?: string | null;
          ends_on?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          site_id?: string;
          user_id?: string;
          employee_id?: string | null;
          role?: Database["public"]["Enums"]["site_role"];
          is_primary?: boolean;
          starts_on?: string | null;
          ends_on?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_assignments_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_assignments_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_assignments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_assignments_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_assignments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
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
          site_type: Database["public"]["Enums"]["site_type"];
          status: Database["public"]["Enums"]["site_status"];
          oar_manager_id: string | null;
          site_manager_name: string | null;
          site_manager_email: string | null;
          site_manager_phone: string | null;
          opened_on: string | null;
          closed_on: string | null;
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
          site_type?: Database["public"]["Enums"]["site_type"];
          status?: Database["public"]["Enums"]["site_status"];
          oar_manager_id?: string | null;
          site_manager_name?: string | null;
          site_manager_email?: string | null;
          site_manager_phone?: string | null;
          opened_on?: string | null;
          closed_on?: string | null;
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
          site_type?: Database["public"]["Enums"]["site_type"];
          status?: Database["public"]["Enums"]["site_status"];
          oar_manager_id?: string | null;
          site_manager_name?: string | null;
          site_manager_email?: string | null;
          site_manager_phone?: string | null;
          opened_on?: string | null;
          closed_on?: string | null;
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
          {
            foreignKeyName: "sites_oar_manager_id_fkey";
            columns: ["oar_manager_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      supplier_contacts: {
        Row: {
          id: string;
          organisation_id: string;
          supplier_id: string;
          first_name: string;
          last_name: string;
          job_title: string | null;
          email: string | null;
          phone: string | null;
          is_primary: boolean;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          supplier_id: string;
          first_name: string;
          last_name?: string;
          job_title?: string | null;
          email?: string | null;
          phone?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          supplier_id?: string;
          first_name?: string;
          last_name?: string;
          job_title?: string | null;
          email?: string | null;
          phone?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "supplier_contacts_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          id: string;
          organisation_id: string;
          name: string;
          category: Database["public"]["Enums"]["supplier_category"];
          email: string | null;
          phone: string | null;
          website: string | null;
          address: Json;
          vat_number: string | null;
          payment_terms_days: number;
          account_number: string | null;
          notes: string | null;
          archived_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          name: string;
          category?: Database["public"]["Enums"]["supplier_category"];
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: Json;
          vat_number?: string | null;
          payment_terms_days?: number;
          account_number?: string | null;
          notes?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          name?: string;
          category?: Database["public"]["Enums"]["supplier_category"];
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: Json;
          vat_number?: string | null;
          payment_terms_days?: number;
          account_number?: string | null;
          notes?: string | null;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "suppliers_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "suppliers_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
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
      timesheets: {
        Row: {
          id: string;
          organisation_id: string;
          employee_id: string;
          shift_id: string | null;
          project_id: string | null;
          site_id: string | null;
          work_date: string;
          start_time: string;
          end_time: string;
          break_minutes: number;
          hours: string | null;
          overtime_hours: string;
          hourly_rate: string | null;
          notes: string | null;
          status: Database["public"]["Enums"]["timesheet_status"];
          submitted_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejection_note: string | null;
          payroll_entry_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          amendment_reason: string | null;
          amended_by: string | null;
          amended_at: string | null;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          employee_id: string;
          shift_id?: string | null;
          project_id?: string | null;
          site_id?: string | null;
          work_date: string;
          start_time: string;
          end_time: string;
          break_minutes?: number;
          hours?: string | null;
          overtime_hours?: string;
          hourly_rate?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["timesheet_status"];
          submitted_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_note?: string | null;
          payroll_entry_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          amendment_reason?: string | null;
          amended_by?: string | null;
          amended_at?: string | null;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          employee_id?: string;
          shift_id?: string | null;
          project_id?: string | null;
          site_id?: string | null;
          work_date?: string;
          start_time?: string;
          end_time?: string;
          break_minutes?: number;
          hours?: string | null;
          overtime_hours?: string;
          hourly_rate?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["timesheet_status"];
          submitted_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_note?: string | null;
          payroll_entry_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          amendment_reason?: string | null;
          amended_by?: string | null;
          amended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "timesheets_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_payroll_entry_fk";
            columns: ["payroll_entry_id"];
            isOneToOne: false;
            referencedRelation: "payroll_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_amended_by_fkey";
            columns: ["amended_by"];
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
      voucher_categories: {
        Row: {
          id: string;
          organisation_id: string;
          key: string;
          label: string;
          description: string | null;
          is_chargeable: boolean;
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
          description?: string | null;
          is_chargeable?: boolean;
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
          description?: string | null;
          is_chargeable?: boolean;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voucher_categories_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      voucher_entries: {
        Row: {
          id: string;
          organisation_id: string;
          site_id: string;
          entry_date: string;
          notes: string | null;
          recorded_by: string | null;
          confirmed_by: string | null;
          confirmed_at: string | null;
          total_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          site_id: string;
          entry_date: string;
          notes?: string | null;
          recorded_by?: string | null;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          total_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          site_id?: string;
          entry_date?: string;
          notes?: string | null;
          recorded_by?: string | null;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          total_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voucher_entries_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "voucher_entries_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "voucher_entries_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "voucher_entries_confirmed_by_fkey";
            columns: ["confirmed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      voucher_entry_lines: {
        Row: {
          id: string;
          organisation_id: string;
          entry_id: string;
          category_id: string;
          quantity: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          entry_id: string;
          category_id: string;
          quantity?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          entry_id?: string;
          category_id?: string;
          quantity?: number;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "voucher_entry_lines_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "voucher_entry_lines_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "voucher_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "voucher_entry_lines_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "voucher_categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      employee_directory: {
        Row: {
          id: string | null;
          organisation_id: string | null;
          employee_number: string | null;
          user_id: string | null;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          role_key: string | null;
          employment_type: Database["public"]["Enums"]["employment_type"] | null;
          status: Database["public"]["Enums"]["employee_status"] | null;
          archived_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
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
          invoiced_net: string | null;
          received: string | null;
          estimated_cost: string | null;
          committed_cost: string | null;
          actual_cost: string | null;
          labour_cost: string | null;
          labour_hours: string | null;
          estimated_gross_profit: string | null;
          estimated_margin_pct: string | null;
          forecast_gross_profit: string | null;
          forecast_margin_pct: string | null;
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
      seed_estimates_from_quote: { Args: { p_project_id: string; p_quote_id: string }; Returns: undefined };
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
      my_employee_id: { Args: Record<string, never>; Returns: string };
      quote_mark_viewed: { Args: { p_token: string }; Returns: undefined };
      quote_customer_decision: {
        Args: { p_token: string; p_decision: string; p_name: string; p_note?: unknown };
        Returns: boolean;
      };
      convert_quote_to_project: {
        Args: { p_quote_id: string; p_project_manager?: unknown; p_site_id?: unknown };
        Returns: string;
      };
      seed_org_finance_defaults: { Args: { org: string }; Returns: undefined };
      replace_quote_items: { Args: { p_quote_id: string; p_items: Json }; Returns: undefined };
      recalculate_invoice: { Args: { p_invoice_id: string }; Returns: undefined };
      seed_org_site_defaults: { Args: { org: string }; Returns: undefined };
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
      project_cost_breakdown: { Args: { p_project_id: string }; Returns: unknown };
      map_quote_category: { Args: { p: string }; Returns: Database["public"]["Enums"]["cost_category"] };
      shift_conflicts: {
        Args: { p_employee_id: string; p_date: unknown; p_start: unknown; p_end: unknown; p_exclude_shift?: unknown };
        Returns: unknown;
      };
      timesheet_from_shift: { Args: { p_shift_id: string }; Returns: string };
      report_revenue_by_month: { Args: { p_org: string; p_months?: unknown }; Returns: unknown };
      report_quotes_by_status: { Args: { p_org: string; p_days?: unknown }; Returns: unknown };
      seed_org_workforce_defaults: { Args: { org: string }; Returns: undefined };
      can_view_directory: { Args: { org: string }; Returns: boolean };
      recalculate_payroll_entry: { Args: { p_entry_id: string }; Returns: undefined };
      build_payroll_period: { Args: { p_period_id: string; p_overtime_multiplier?: unknown }; Returns: number };
      generate_alerts_all: { Args: Record<string, never>; Returns: number };
      report_cost_breakdown: { Args: { p_org: string; p_days?: unknown }; Returns: unknown };
      notify_roles: {
        Args: {
          p_org: string;
          p_roles: string[];
          p_type: Database["public"]["Enums"]["notification_type"];
          p_title: string;
          p_body: string;
          p_entity_type: string;
          p_entity_id: string;
          p_href: string;
          p_dedupe: string;
        };
        Returns: number;
      };
      expire_documents: { Args: { p_org: string }; Returns: number };
      generate_alerts: { Args: { p_org: string }; Returns: number };
      finalise_payroll_period: { Args: { p_period_id: string }; Returns: undefined };
      supplier_spend: { Args: { p_supplier_id: string }; Returns: unknown };
      reopen_payroll_period: { Args: { p_period_id: string }; Returns: undefined };
      publish_equipment_to_catalogue: { Args: { p_equipment_id: string }; Returns: string };
      seed_org_supplier_defaults: { Args: { org: string }; Returns: undefined };
      report_quote_conversion: { Args: { p_org: string; p_months?: unknown }; Returns: unknown };
      report_project_profitability: { Args: { p_org: string }; Returns: unknown };
      report_outstanding_invoices: { Args: { p_org: string }; Returns: unknown };
      report_revenue_by_client: { Args: { p_org: string; p_months?: unknown }; Returns: unknown };
      report_labour_by_project: { Args: { p_org: string; p_days?: unknown }; Returns: unknown };
      report_employee_hours: { Args: { p_org: string; p_days?: unknown }; Returns: unknown };
      can_write_site: { Args: { p_site_id: string }; Returns: boolean };
      manages_employee: { Args: { p_employee_id: string }; Returns: boolean };
      my_site_ids: { Args: Record<string, never>; Returns: unknown };
      my_managed_site_ids: { Args: Record<string, never>; Returns: unknown };
      can_read_site: { Args: { p_site_id: string }; Returns: boolean };
      record_vouchers: {
        Args: { p_site_id: string; p_date: unknown; p_lines: Json; p_notes?: unknown };
        Returns: string;
      };
      sites_missing_vouchers: { Args: { p_org: string; p_date?: unknown }; Returns: unknown };
      confirm_vouchers: { Args: { p_entry_id: string }; Returns: undefined };
      report_vouchers: {
        Args: {
          p_org: string;
          p_from: unknown;
          p_to: unknown;
          p_grain?: string;
          p_site_id?: unknown;
          p_category_id?: unknown;
        };
        Returns: unknown;
      };
      seed_org_voucher_defaults: { Args: { org: string }; Returns: undefined };
      attach_leave_document: { Args: { p_leave_id: string; p_document_id: string }; Returns: undefined };
      leave_missing_documents: { Args: { p_org: string }; Returns: unknown };
      seed_org_sick_note_category: { Args: { org: string }; Returns: undefined };
      in_conversation: { Args: { p_conversation_id: string }; Returns: boolean };
      start_direct_conversation: { Args: { p_other_user: string }; Returns: string };
      start_broadcast: { Args: { p_subject: string; p_body: string; p_site_id?: unknown }; Returns: string };
      site_conversation: { Args: { p_site_id: string }; Returns: string };
      mark_conversation_read: { Args: { p_conversation_id: string }; Returns: undefined };
      my_conversations: { Args: Record<string, never>; Returns: unknown };
      my_unread_messages: { Args: Record<string, never>; Returns: unknown };
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
      cost_category:
        | "labour"
        | "food"
        | "equipment"
        | "materials"
        | "transport"
        | "accommodation"
        | "subcontractors"
        | "hire"
        | "utilities"
        | "other";
      expense_status: "pending" | "committed" | "actual" | "paid" | "rejected";
      employment_type: "full_time" | "part_time" | "casual" | "contractor" | "agency";
      employee_status: "active" | "inactive" | "on_leave" | "former";
      shift_status: "draft" | "published" | "completed" | "cancelled";
      timesheet_status: "draft" | "submitted" | "approved" | "rejected" | "paid";
      leave_type: "holiday" | "sick" | "unpaid" | "other";
      leave_status: "requested" | "approved" | "rejected" | "cancelled";
      verification_status: "unverified" | "verified" | "rejected" | "expired";
      pay_period_status: "draft" | "review" | "finalised" | "exported";
      pay_adjustment_kind: "bonus" | "expense_reimbursement" | "deduction" | "holiday_pay" | "other";
      supplier_category:
        | "food"
        | "equipment"
        | "fabrication"
        | "extraction"
        | "refrigeration"
        | "electrical"
        | "plumbing"
        | "transport"
        | "agency_staff"
        | "cleaning"
        | "other";
      site_type: "kitchen" | "project_site" | "office" | "other";
      site_status: "prospective" | "mobilising" | "operating" | "paused" | "closed";
      site_role: "manager" | "staff";
      conversation_kind: "direct" | "site" | "broadcast";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"];

// ---- convenience aliases (one per enum, generated) ---------------------------
export type OrganisationRole = Database["public"]["Enums"]["organisation_role"];
export type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type DocumentEntity = Database["public"]["Enums"]["document_entity"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type QuoteStatus = Database["public"]["Enums"]["quote_status"];
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
export type InvoiceKind = Database["public"]["Enums"]["invoice_kind"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type CostCategory = Database["public"]["Enums"]["cost_category"];
export type ExpenseStatus = Database["public"]["Enums"]["expense_status"];
export type EmploymentType = Database["public"]["Enums"]["employment_type"];
export type EmployeeStatus = Database["public"]["Enums"]["employee_status"];
export type ShiftStatus = Database["public"]["Enums"]["shift_status"];
export type TimesheetStatus = Database["public"]["Enums"]["timesheet_status"];
export type LeaveType = Database["public"]["Enums"]["leave_type"];
export type LeaveStatus = Database["public"]["Enums"]["leave_status"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type PayPeriodStatus = Database["public"]["Enums"]["pay_period_status"];
export type PayAdjustmentKind = Database["public"]["Enums"]["pay_adjustment_kind"];
export type SupplierCategory = Database["public"]["Enums"]["supplier_category"];
export type SiteType = Database["public"]["Enums"]["site_type"];
export type SiteStatus = Database["public"]["Enums"]["site_status"];
export type SiteRole = Database["public"]["Enums"]["site_role"];
export type ConversationKind = Database["public"]["Enums"]["conversation_kind"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
