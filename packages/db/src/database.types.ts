// Automatisch erzeugt von packages/db/scripts/gen-types.mjs. Nicht manuell bearbeiten.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          id: string;
          tenant_id: string;
          theory_class_id: string;
          student_id: string;
          student_license_id: string | null;
          status: string;
          check_in_method: string | null;
          checked_in_at: string | null;
          checked_in_by: string | null;
          device_fingerprint: string | null;
          geo_distance_m: number | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          theory_class_id: string;
          student_id: string;
          student_license_id?: string | null;
          status?: string;
          check_in_method?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          device_fingerprint?: string | null;
          geo_distance_m?: number | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          theory_class_id?: string;
          student_id?: string;
          student_license_id?: string | null;
          status?: string;
          check_in_method?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          device_fingerprint?: string | null;
          geo_distance_m?: number | null;
        };
        Relationships: [
          { foreignKeyName: "attendance_checked_in_by_fkey"; columns: ["checked_in_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "attendance_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "attendance_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "attendance_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "attendance_theory_class_id_fkey"; columns: ["theory_class_id"]; isOneToOne: false; referencedRelation: "theory_classes"; referencedColumns: ["id"] }
        ];
      };
      audit_logs: {
        Row: {
          id: number;
          tenant_id: string | null;
          actor_id: string | null;
          actor_role: string | null;
          action: string;
          entity_table: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          changed_columns: string[] | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          tenant_id?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          action: string;
          entity_table: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          changed_columns?: string[] | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: {
          tenant_id?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          action?: string;
          entity_table?: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          changed_columns?: string[] | null;
          request_id?: string | null;
          created_at?: string;
        };
        Relationships: [

        ];
      };
      badges: {
        Row: {
          code: string;
          name_i18n: Json;
          description_i18n: Json;
          icon: string;
          criteria: Json;
        };
        Insert: {
          code: string;
          name_i18n: Json;
          description_i18n: Json;
          icon: string;
          criteria: Json;
        };
        Update: {
          code?: string;
          name_i18n?: Json;
          description_i18n?: Json;
          icon?: string;
          criteria?: Json;
        };
        Relationships: [

        ];
      };
      cancellation_policies: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          free_cancellation_hours: number;
          late_fee_percent: number | null;
          late_fee_fixed_cents: number | null;
          no_show_fee_percent: number | null;
          contract_clause_reference: string | null;
          valid_from: string;
          valid_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          free_cancellation_hours?: number;
          late_fee_percent?: number | null;
          late_fee_fixed_cents?: number | null;
          no_show_fee_percent?: number | null;
          contract_clause_reference?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          free_cancellation_hours?: number;
          late_fee_percent?: number | null;
          late_fee_fixed_cents?: number | null;
          no_show_fee_percent?: number | null;
          contract_clause_reference?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "cancellation_policies_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      chapters: {
        Row: {
          id: string;
          tenant_id: string | null;
          topic_id: string;
          locale: string;
          title: string;
          body_markdown: string;
          estimated_minutes: number;
          license_codes: string[];
          version: number;
          valid_from: string;
          valid_until: string | null;
          review_status: Database["app"]["Enums"]["review_status"];
          reviewed_by: string | null;
          reviewed_at: string | null;
          source: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          topic_id: string;
          locale?: string;
          title: string;
          body_markdown: string;
          estimated_minutes?: number;
          license_codes?: string[];
          version?: number;
          valid_from?: string;
          valid_until?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          source?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          topic_id?: string;
          locale?: string;
          title?: string;
          body_markdown?: string;
          estimated_minutes?: number;
          license_codes?: string[];
          version?: number;
          valid_from?: string;
          valid_until?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          source?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "chapters_reviewed_by_fkey"; columns: ["reviewed_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "chapters_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "chapters_topic_id_fkey"; columns: ["topic_id"]; isOneToOne: false; referencedRelation: "topics"; referencedColumns: ["id"] }
        ];
      };
      coach_conversations: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          context_kind: string | null;
          context_ref: string | null;
          locale: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          context_kind?: string | null;
          context_ref?: string | null;
          locale?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          context_kind?: string | null;
          context_ref?: string | null;
          locale?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_conversations_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "coach_conversations_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      coach_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          style: string | null;
          sources: Json;
          confidence: string | null;
          model: string | null;
          input_tokens: number | null;
          output_tokens: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          style?: string | null;
          sources?: Json;
          confidence?: string | null;
          model?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          style?: string | null;
          sources?: Json;
          confidence?: string | null;
          model?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_messages_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "coach_conversations"; referencedColumns: ["id"] }
        ];
      };
      consents: {
        Row: {
          id: string;
          tenant_id: string | null;
          user_id: string | null;
          student_id: string | null;
          consent_type: string;
          text_version: string;
          granted: boolean;
          granted_at: string;
          revoked_at: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          evidence: Json | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          user_id?: string | null;
          student_id?: string | null;
          consent_type: string;
          text_version: string;
          granted: boolean;
          granted_at?: string;
          revoked_at?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          evidence?: Json | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          user_id?: string | null;
          student_id?: string | null;
          consent_type?: string;
          text_version?: string;
          granted?: boolean;
          granted_at?: string;
          revoked_at?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          evidence?: Json | null;
        };
        Relationships: [
          { foreignKeyName: "consents_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "consents_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "consents_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      content_reviews: {
        Row: {
          id: string;
          entity_table: string;
          entity_id: string;
          from_status: Database["app"]["Enums"]["review_status"] | null;
          to_status: Database["app"]["Enums"]["review_status"];
          reviewer_id: string | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_table: string;
          entity_id: string;
          from_status?: Database["app"]["Enums"]["review_status"] | null;
          to_status: Database["app"]["Enums"]["review_status"];
          reviewer_id?: string | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_table?: string;
          entity_id?: string;
          from_status?: Database["app"]["Enums"]["review_status"] | null;
          to_status?: Database["app"]["Enums"]["review_status"];
          reviewer_id?: string | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "content_reviews_reviewer_id_fkey"; columns: ["reviewer_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      contracts: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          student_license_id: string | null;
          price_list_id: string | null;
          cancellation_policy_id: string | null;
          contract_number: string | null;
          status: string;
          signed_at: string | null;
          signature_method: string | null;
          signature_evidence: Json | null;
          document_path: string | null;
          terms_version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          student_license_id?: string | null;
          price_list_id?: string | null;
          cancellation_policy_id?: string | null;
          contract_number?: string | null;
          status?: string;
          signed_at?: string | null;
          signature_method?: string | null;
          signature_evidence?: Json | null;
          document_path?: string | null;
          terms_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          student_license_id?: string | null;
          price_list_id?: string | null;
          cancellation_policy_id?: string | null;
          contract_number?: string | null;
          status?: string;
          signed_at?: string | null;
          signature_method?: string | null;
          signature_evidence?: Json | null;
          document_path?: string | null;
          terms_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "contracts_cancellation_policy_id_fkey"; columns: ["cancellation_policy_id"]; isOneToOne: false; referencedRelation: "cancellation_policies"; referencedColumns: ["id"] },
          { foreignKeyName: "contracts_price_list_id_fkey"; columns: ["price_list_id"]; isOneToOne: false; referencedRelation: "price_lists"; referencedColumns: ["id"] },
          { foreignKeyName: "contracts_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "contracts_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "contracts_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          last_read_at: string | null;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          last_read_at?: string | null;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          last_read_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "conversation_participants_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "conversations"; referencedColumns: ["id"] },
          { foreignKeyName: "conversation_participants_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      conversations: {
        Row: {
          id: string;
          tenant_id: string;
          kind: string;
          student_id: string | null;
          subject: string | null;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          kind: string;
          student_id?: string | null;
          subject?: string | null;
          last_message_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          kind?: string;
          student_id?: string | null;
          subject?: string | null;
          last_message_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "conversations_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "conversations_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      daily_goals: {
        Row: {
          tenant_id: string;
          student_id: string;
          goal_date: string;
          target_questions: number;
          answered: number;
          target_minutes: number;
          minutes: number;
          achieved: boolean;
        };
        Insert: {
          tenant_id: string;
          student_id: string;
          goal_date: string;
          target_questions?: number;
          answered?: number;
          target_minutes?: number;
          minutes?: number;
          achieved?: boolean;
        };
        Update: {
          tenant_id?: string;
          student_id?: string;
          goal_date?: string;
          target_questions?: number;
          answered?: number;
          target_minutes?: number;
          minutes?: number;
          achieved?: boolean;
        };
        Relationships: [
          { foreignKeyName: "daily_goals_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "daily_goals_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      data_requests: {
        Row: {
          id: string;
          tenant_id: string | null;
          user_id: string;
          student_id: string | null;
          kind: string;
          status: string;
          reason: string | null;
          export_path: string | null;
          handled_by: string | null;
          completed_at: string | null;
          legal_hold_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          user_id: string;
          student_id?: string | null;
          kind: string;
          status?: string;
          reason?: string | null;
          export_path?: string | null;
          handled_by?: string | null;
          completed_at?: string | null;
          legal_hold_until?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          user_id?: string;
          student_id?: string | null;
          kind?: string;
          status?: string;
          reason?: string | null;
          export_path?: string | null;
          handled_by?: string | null;
          completed_at?: string | null;
          legal_hold_until?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "data_requests_handled_by_fkey"; columns: ["handled_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "data_requests_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "data_requests_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "data_requests_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      document_requirements: {
        Row: {
          id: string;
          tenant_id: string | null;
          code: string;
          name_i18n: Json;
          description_i18n: Json;
          license_codes: string[];
          required: boolean;
          requires_upload: boolean;
          applies_when: Json;
          sort_order: number;
          active: boolean;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          code: string;
          name_i18n: Json;
          description_i18n?: Json;
          license_codes?: string[];
          required?: boolean;
          requires_upload?: boolean;
          applies_when?: Json;
          sort_order?: number;
          active?: boolean;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          code?: string;
          name_i18n?: Json;
          description_i18n?: Json;
          license_codes?: string[];
          required?: boolean;
          requires_upload?: boolean;
          applies_when?: Json;
          sort_order?: number;
          active?: boolean;
        };
        Relationships: [
          { foreignKeyName: "document_requirements_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      documents: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string | null;
          student_license_id: string | null;
          requirement_code: string | null;
          kind: string;
          title: string;
          storage_path: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          status: string;
          verified_by: string | null;
          verified_at: string | null;
          rejection_reason: string | null;
          expires_at: string | null;
          uploaded_by: string | null;
          retention_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id?: string | null;
          student_license_id?: string | null;
          requirement_code?: string | null;
          kind: string;
          title: string;
          storage_path?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          status?: string;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          expires_at?: string | null;
          uploaded_by?: string | null;
          retention_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string | null;
          student_license_id?: string | null;
          requirement_code?: string | null;
          kind?: string;
          title?: string;
          storage_path?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          status?: string;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          expires_at?: string | null;
          uploaded_by?: string | null;
          retention_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "documents_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_uploaded_by_fkey"; columns: ["uploaded_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_verified_by_fkey"; columns: ["verified_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      driving_schools: {
        Row: {
          id: string;
          name: string;
          slug: string;
          legal_name: string | null;
          tax_id: string | null;
          vat_id: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          address_line1: string | null;
          address_line2: string | null;
          postal_code: string | null;
          city: string | null;
          country_code: string;
          timezone: string;
          default_locale: string;
          supported_locales: string[];
          invoice_number_prefix: string;
          settings: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          legal_name?: string | null;
          tax_id?: string | null;
          vat_id?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country_code?: string;
          timezone?: string;
          default_locale?: string;
          supported_locales?: string[];
          invoice_number_prefix?: string;
          settings?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          legal_name?: string | null;
          tax_id?: string | null;
          vat_id?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country_code?: string;
          timezone?: string;
          default_locale?: string;
          supported_locales?: string[];
          invoice_number_prefix?: string;
          settings?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [

        ];
      };
      exam_results: {
        Row: {
          id: string;
          exam_simulation_id: string;
          question_id: string;
          question_version_id: string;
          position: number;
          selected_positions: number[];
          is_correct: boolean | null;
          points: number;
          marked_unsure: boolean;
          response_ms: number | null;
        };
        Insert: {
          id?: string;
          exam_simulation_id: string;
          question_id: string;
          question_version_id: string;
          position: number;
          selected_positions?: number[];
          is_correct?: boolean | null;
          points: number;
          marked_unsure?: boolean;
          response_ms?: number | null;
        };
        Update: {
          id?: string;
          exam_simulation_id?: string;
          question_id?: string;
          question_version_id?: string;
          position?: number;
          selected_positions?: number[];
          is_correct?: boolean | null;
          points?: number;
          marked_unsure?: boolean;
          response_ms?: number | null;
        };
        Relationships: [
          { foreignKeyName: "exam_results_exam_simulation_id_fkey"; columns: ["exam_simulation_id"]; isOneToOne: false; referencedRelation: "exam_simulations"; referencedColumns: ["id"] },
          { foreignKeyName: "exam_results_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "theory_questions"; referencedColumns: ["id"] },
          { foreignKeyName: "exam_results_question_version_id_fkey"; columns: ["question_version_id"]; isOneToOne: false; referencedRelation: "question_versions"; referencedColumns: ["id"] }
        ];
      };
      exam_simulations: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          student_license_id: string | null;
          license_code: string;
          rule_version_id: string;
          rule_snapshot: Json;
          client_session_id: string;
          started_at: string;
          submitted_at: string | null;
          time_limit_seconds: number | null;
          question_ids: string[];
          status: string;
          passed: boolean | null;
          error_points: number | null;
          correct_count: number | null;
          wrong_count: number | null;
          unsure_count: number | null;
          duration_seconds: number | null;
          fail_reasons: string[];
          analysis: Json | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          student_license_id?: string | null;
          license_code: string;
          rule_version_id: string;
          rule_snapshot: Json;
          client_session_id: string;
          started_at?: string;
          submitted_at?: string | null;
          time_limit_seconds?: number | null;
          question_ids: string[];
          status?: string;
          passed?: boolean | null;
          error_points?: number | null;
          correct_count?: number | null;
          wrong_count?: number | null;
          unsure_count?: number | null;
          duration_seconds?: number | null;
          fail_reasons?: string[];
          analysis?: Json | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          student_license_id?: string | null;
          license_code?: string;
          rule_version_id?: string;
          rule_snapshot?: Json;
          client_session_id?: string;
          started_at?: string;
          submitted_at?: string | null;
          time_limit_seconds?: number | null;
          question_ids?: string[];
          status?: string;
          passed?: boolean | null;
          error_points?: number | null;
          correct_count?: number | null;
          wrong_count?: number | null;
          unsure_count?: number | null;
          duration_seconds?: number | null;
          fail_reasons?: string[];
          analysis?: Json | null;
        };
        Relationships: [
          { foreignKeyName: "exam_simulations_license_code_fkey"; columns: ["license_code"]; isOneToOne: false; referencedRelation: "licenses"; referencedColumns: ["code"] },
          { foreignKeyName: "exam_simulations_rule_version_id_fkey"; columns: ["rule_version_id"]; isOneToOne: false; referencedRelation: "rule_versions"; referencedColumns: ["id"] },
          { foreignKeyName: "exam_simulations_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "exam_simulations_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "exam_simulations_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      instructor_absences: {
        Row: {
          id: string;
          tenant_id: string;
          instructor_id: string;
          period: string;
          reason: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          instructor_id: string;
          period: string;
          reason?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          instructor_id?: string;
          period?: string;
          reason?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "instructor_absences_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "instructor_absences_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      instructor_availability: {
        Row: {
          id: string;
          tenant_id: string;
          instructor_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          kind: string;
          location_id: string | null;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          instructor_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          kind?: string;
          location_id?: string | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          instructor_id?: string;
          weekday?: number;
          start_time?: string;
          end_time?: string;
          kind?: string;
          location_id?: string | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [
          { foreignKeyName: "instructor_availability_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "instructor_availability_location_id_fkey"; columns: ["location_id"]; isOneToOne: false; referencedRelation: "locations"; referencedColumns: ["id"] },
          { foreignKeyName: "instructor_availability_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      instructors: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          location_id: string | null;
          display_name: string;
          license_classes: string[];
          teaches_theory: boolean;
          teaches_automatic: boolean;
          teaches_manual: boolean;
          color: string | null;
          lesson_default_minutes: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          location_id?: string | null;
          display_name: string;
          license_classes?: string[];
          teaches_theory?: boolean;
          teaches_automatic?: boolean;
          teaches_manual?: boolean;
          color?: string | null;
          lesson_default_minutes?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          location_id?: string | null;
          display_name?: string;
          license_classes?: string[];
          teaches_theory?: boolean;
          teaches_automatic?: boolean;
          teaches_manual?: boolean;
          color?: string | null;
          lesson_default_minutes?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "instructors_location_id_fkey"; columns: ["location_id"]; isOneToOne: false; referencedRelation: "locations"; referencedColumns: ["id"] },
          { foreignKeyName: "instructors_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "instructors_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      invoice_counters: {
        Row: {
          tenant_id: string;
          year: number;
          last_number: number;
        };
        Insert: {
          tenant_id: string;
          year: number;
          last_number?: number;
        };
        Update: {
          tenant_id?: string;
          year?: number;
          last_number?: number;
        };
        Relationships: [
          { foreignKeyName: "invoice_counters_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          position: number;
          description: string;
          quantity: number;
          unit_net_cents: number;
          vat_rate: number;
          lesson_id: string | null;
          price_item_code: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          position: number;
          description: string;
          quantity?: number;
          unit_net_cents: number;
          vat_rate?: number;
          lesson_id?: string | null;
          price_item_code?: string | null;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          position?: number;
          description?: string;
          quantity?: number;
          unit_net_cents?: number;
          vat_rate?: number;
          lesson_id?: string | null;
          price_item_code?: string | null;
        };
        Relationships: [
          { foreignKeyName: "invoice_items_invoice_id_fkey"; columns: ["invoice_id"]; isOneToOne: false; referencedRelation: "invoices"; referencedColumns: ["id"] },
          { foreignKeyName: "invoice_items_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] }
        ];
      };
      invoices: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          contract_id: string | null;
          invoice_number: string | null;
          status: Database["app"]["Enums"]["invoice_status"];
          issued_at: string | null;
          due_at: string | null;
          currency: string;
          net_cents: number;
          vat_cents: number;
          gross_cents: number;
          paid_cents: number;
          vat_rate: number;
          dunning_level: number;
          dunning_last_at: string | null;
          pdf_path: string | null;
          e_invoice_path: string | null;
          credit_note_for: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          contract_id?: string | null;
          invoice_number?: string | null;
          status?: Database["app"]["Enums"]["invoice_status"];
          issued_at?: string | null;
          due_at?: string | null;
          currency?: string;
          net_cents?: number;
          vat_cents?: number;
          gross_cents?: number;
          paid_cents?: number;
          vat_rate?: number;
          dunning_level?: number;
          dunning_last_at?: string | null;
          pdf_path?: string | null;
          e_invoice_path?: string | null;
          credit_note_for?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          contract_id?: string | null;
          invoice_number?: string | null;
          status?: Database["app"]["Enums"]["invoice_status"];
          issued_at?: string | null;
          due_at?: string | null;
          currency?: string;
          net_cents?: number;
          vat_cents?: number;
          gross_cents?: number;
          paid_cents?: number;
          vat_rate?: number;
          dunning_level?: number;
          dunning_last_at?: string | null;
          pdf_path?: string | null;
          e_invoice_path?: string | null;
          credit_note_for?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "invoices_contract_id_fkey"; columns: ["contract_id"]; isOneToOne: false; referencedRelation: "contracts"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_credit_note_for_fkey"; columns: ["credit_note_for"]; isOneToOne: false; referencedRelation: "invoices"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      knowledge_entries: {
        Row: {
          id: string;
          tenant_id: string | null;
          slug: string;
          topic_id: string | null;
          title: string;
          locale: string;
          body_markdown: string;
          summary: string | null;
          legal_reference: string | null;
          legal_basis_date: string;
          license_codes: string[];
          version: number;
          valid_from: string;
          valid_until: string | null;
          review_status: Database["app"]["Enums"]["review_status"];
          reviewed_by: string | null;
          reviewed_at: string | null;
          source: string;
          search_vector: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          slug: string;
          topic_id?: string | null;
          title: string;
          locale?: string;
          body_markdown: string;
          summary?: string | null;
          legal_reference?: string | null;
          legal_basis_date: string;
          license_codes?: string[];
          version?: number;
          valid_from?: string;
          valid_until?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          source: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          slug?: string;
          topic_id?: string | null;
          title?: string;
          locale?: string;
          body_markdown?: string;
          summary?: string | null;
          legal_reference?: string | null;
          legal_basis_date?: string;
          license_codes?: string[];
          version?: number;
          valid_from?: string;
          valid_until?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          source?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "knowledge_entries_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "knowledge_entries_reviewed_by_fkey"; columns: ["reviewed_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "knowledge_entries_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "knowledge_entries_topic_id_fkey"; columns: ["topic_id"]; isOneToOne: false; referencedRelation: "topics"; referencedColumns: ["id"] }
        ];
      };
      learning_sessions: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          student_license_id: string | null;
          mode: Database["app"]["Enums"]["learning_mode"];
          topic_id: string | null;
          client_session_id: string;
          started_at: string;
          ended_at: string | null;
          question_count: number;
          correct_count: number;
          device: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          student_license_id?: string | null;
          mode: Database["app"]["Enums"]["learning_mode"];
          topic_id?: string | null;
          client_session_id: string;
          started_at?: string;
          ended_at?: string | null;
          question_count?: number;
          correct_count?: number;
          device?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          student_license_id?: string | null;
          mode?: Database["app"]["Enums"]["learning_mode"];
          topic_id?: string | null;
          client_session_id?: string;
          started_at?: string;
          ended_at?: string | null;
          question_count?: number;
          correct_count?: number;
          device?: string | null;
        };
        Relationships: [
          { foreignKeyName: "learning_sessions_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "learning_sessions_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "learning_sessions_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "learning_sessions_topic_id_fkey"; columns: ["topic_id"]; isOneToOne: false; referencedRelation: "topics"; referencedColumns: ["id"] }
        ];
      };
      lesson_bookings: {
        Row: {
          id: string;
          tenant_id: string;
          lesson_id: string;
          student_id: string;
          student_license_id: string | null;
          action: string;
          acted_by: string | null;
          acted_at: string;
          hours_before_start: number | null;
          policy_id: string | null;
          fee_cents: number | null;
          fee_reason: string | null;
          client_request_id: string | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          lesson_id: string;
          student_id: string;
          student_license_id?: string | null;
          action: string;
          acted_by?: string | null;
          acted_at?: string;
          hours_before_start?: number | null;
          policy_id?: string | null;
          fee_cents?: number | null;
          fee_reason?: string | null;
          client_request_id?: string | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          lesson_id?: string;
          student_id?: string;
          student_license_id?: string | null;
          action?: string;
          acted_by?: string | null;
          acted_at?: string;
          hours_before_start?: number | null;
          policy_id?: string | null;
          fee_cents?: number | null;
          fee_reason?: string | null;
          client_request_id?: string | null;
          note?: string | null;
        };
        Relationships: [
          { foreignKeyName: "lesson_bookings_acted_by_fkey"; columns: ["acted_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_bookings_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_bookings_policy_id_fkey"; columns: ["policy_id"]; isOneToOne: false; referencedRelation: "cancellation_policies"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_bookings_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_bookings_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_bookings_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      lesson_evaluations: {
        Row: {
          id: string;
          tenant_id: string;
          lesson_id: string;
          student_license_id: string;
          instructor_id: string;
          contents: string[];
          comment: string | null;
          next_goals: string[];
          overall_rating: number | null;
          ai_draft: Json | null;
          ai_transcript: string | null;
          ai_draft_model: string | null;
          ai_confirmed: boolean;
          confirmed_at: string | null;
          shared_with_student: boolean;
          row_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          lesson_id: string;
          student_license_id: string;
          instructor_id: string;
          contents?: string[];
          comment?: string | null;
          next_goals?: string[];
          overall_rating?: number | null;
          ai_draft?: Json | null;
          ai_transcript?: string | null;
          ai_draft_model?: string | null;
          ai_confirmed?: boolean;
          confirmed_at?: string | null;
          shared_with_student?: boolean;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          lesson_id?: string;
          student_license_id?: string;
          instructor_id?: string;
          contents?: string[];
          comment?: string | null;
          next_goals?: string[];
          overall_rating?: number | null;
          ai_draft?: Json | null;
          ai_transcript?: string | null;
          ai_draft_model?: string | null;
          ai_confirmed?: boolean;
          confirmed_at?: string | null;
          shared_with_student?: boolean;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "lesson_evaluations_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_evaluations_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: true; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_evaluations_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_evaluations_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      lessons: {
        Row: {
          id: string;
          tenant_id: string;
          location_id: string | null;
          instructor_id: string;
          vehicle_id: string | null;
          student_id: string | null;
          student_license_id: string | null;
          kind: Database["app"]["Enums"]["lesson_kind"];
          status: Database["app"]["Enums"]["lesson_status"];
          period: string;
          units: number;
          transmission: string | null;
          license_codes: string[];
          meeting_point: string | null;
          price_cents: number | null;
          notes_internal: string | null;
          completed_at: string | null;
          row_version: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          location_id?: string | null;
          instructor_id: string;
          vehicle_id?: string | null;
          student_id?: string | null;
          student_license_id?: string | null;
          kind?: Database["app"]["Enums"]["lesson_kind"];
          status?: Database["app"]["Enums"]["lesson_status"];
          period: string;
          units?: number;
          transmission?: string | null;
          license_codes?: string[];
          meeting_point?: string | null;
          price_cents?: number | null;
          notes_internal?: string | null;
          completed_at?: string | null;
          row_version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          location_id?: string | null;
          instructor_id?: string;
          vehicle_id?: string | null;
          student_id?: string | null;
          student_license_id?: string | null;
          kind?: Database["app"]["Enums"]["lesson_kind"];
          status?: Database["app"]["Enums"]["lesson_status"];
          period?: string;
          units?: number;
          transmission?: string | null;
          license_codes?: string[];
          meeting_point?: string | null;
          price_cents?: number | null;
          notes_internal?: string | null;
          completed_at?: string | null;
          row_version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "lessons_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "lessons_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "lessons_location_id_fkey"; columns: ["location_id"]; isOneToOne: false; referencedRelation: "locations"; referencedColumns: ["id"] },
          { foreignKeyName: "lessons_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "lessons_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "lessons_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "lessons_vehicle_id_fkey"; columns: ["vehicle_id"]; isOneToOne: false; referencedRelation: "vehicles"; referencedColumns: ["id"] }
        ];
      };
      licenses: {
        Row: {
          code: string;
          name: string;
          base_class: string | null;
          vehicle_category: string;
          min_age_years: number | null;
          requires_theory_exam: boolean;
          requires_practical_exam: boolean;
          sort_order: number;
          active: boolean;
        };
        Insert: {
          code: string;
          name: string;
          base_class?: string | null;
          vehicle_category: string;
          min_age_years?: number | null;
          requires_theory_exam?: boolean;
          requires_practical_exam?: boolean;
          sort_order?: number;
          active?: boolean;
        };
        Update: {
          code?: string;
          name?: string;
          base_class?: string | null;
          vehicle_category?: string;
          min_age_years?: number | null;
          requires_theory_exam?: boolean;
          requires_practical_exam?: boolean;
          sort_order?: number;
          active?: boolean;
        };
        Relationships: [
          { foreignKeyName: "licenses_base_class_fkey"; columns: ["base_class"]; isOneToOne: false; referencedRelation: "licenses"; referencedColumns: ["code"] }
        ];
      };
      locations: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          address_line1: string | null;
          postal_code: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          email: string | null;
          opening_hours: Json;
          is_primary: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          address_line1?: string | null;
          postal_code?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          opening_hours?: Json;
          is_primary?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          address_line1?: string | null;
          postal_code?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          opening_hours?: Json;
          is_primary?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "locations_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      messages: {
        Row: {
          id: string;
          tenant_id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          attachment_path: string | null;
          client_message_id: string | null;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          attachment_path?: string | null;
          client_message_id?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          attachment_path?: string | null;
          client_message_id?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "messages_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "conversations"; referencedColumns: ["id"] },
          { foreignKeyName: "messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "messages_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      mock_exam_events: {
        Row: {
          id: string;
          mock_exam_id: string;
          occurred_at: string;
          skill_code: string | null;
          polarity: string;
          severity: number;
          label: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          mock_exam_id: string;
          occurred_at?: string;
          skill_code?: string | null;
          polarity: string;
          severity?: number;
          label: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          mock_exam_id?: string;
          occurred_at?: string;
          skill_code?: string | null;
          polarity?: string;
          severity?: number;
          label?: string;
          note?: string | null;
        };
        Relationships: [
          { foreignKeyName: "mock_exam_events_mock_exam_id_fkey"; columns: ["mock_exam_id"]; isOneToOne: false; referencedRelation: "mock_exams"; referencedColumns: ["id"] },
          { foreignKeyName: "mock_exam_events_skill_code_fkey"; columns: ["skill_code"]; isOneToOne: false; referencedRelation: "skills"; referencedColumns: ["code"] }
        ];
      };
      mock_exams: {
        Row: {
          id: string;
          tenant_id: string;
          student_license_id: string;
          instructor_id: string;
          lesson_id: string | null;
          started_at: string;
          ended_at: string | null;
          overall_score: number | null;
          strengths: string[];
          improvements: string[];
          summary: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_license_id: string;
          instructor_id: string;
          lesson_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          overall_score?: number | null;
          strengths?: string[];
          improvements?: string[];
          summary?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_license_id?: string;
          instructor_id?: string;
          lesson_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          overall_score?: number | null;
          strengths?: string[];
          improvements?: string[];
          summary?: string | null;
          status?: string;
        };
        Relationships: [
          { foreignKeyName: "mock_exams_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "mock_exams_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "mock_exams_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "mock_exams_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          notification_type: string;
          push: boolean;
          email: boolean;
          in_app: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
        };
        Insert: {
          user_id: string;
          notification_type: string;
          push?: boolean;
          email?: boolean;
          in_app?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
        };
        Update: {
          user_id?: string;
          notification_type?: string;
          push?: boolean;
          email?: boolean;
          in_app?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
        };
        Relationships: [
          { foreignKeyName: "notification_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      notifications: {
        Row: {
          id: string;
          tenant_id: string | null;
          user_id: string;
          notification_type: string;
          title: string;
          body: string;
          data: Json;
          channels: string[];
          scheduled_for: string;
          sent_at: string | null;
          read_at: string | null;
          dedupe_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          user_id: string;
          notification_type: string;
          title: string;
          body: string;
          data?: Json;
          channels?: string[];
          scheduled_for?: string;
          sent_at?: string | null;
          read_at?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          user_id?: string;
          notification_type?: string;
          title?: string;
          body?: string;
          data?: Json;
          channels?: string[];
          scheduled_for?: string;
          sent_at?: string | null;
          read_at?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "notifications_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      payment_mandates: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          provider: string;
          provider_mandate_id: string | null;
          method: string;
          status: string;
          masked_iban: string | null;
          mandate_reference: string | null;
          signed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          provider: string;
          provider_mandate_id?: string | null;
          method: string;
          status?: string;
          masked_iban?: string | null;
          mandate_reference?: string | null;
          signed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          provider?: string;
          provider_mandate_id?: string | null;
          method?: string;
          status?: string;
          masked_iban?: string | null;
          mandate_reference?: string | null;
          signed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "payment_mandates_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "payment_mandates_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      payment_webhook_events: {
        Row: {
          provider: string;
          event_id: string;
          event_type: string;
          status: string;
          received_at: string;
          processed_at: string | null;
          error: string | null;
        };
        Insert: {
          provider: string;
          event_id: string;
          event_type: string;
          status?: string;
          received_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
        Update: {
          provider?: string;
          event_id?: string;
          event_type?: string;
          status?: string;
          received_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
        Relationships: [

        ];
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          invoice_id: string | null;
          mandate_id: string | null;
          provider: string;
          provider_payment_id: string | null;
          method: string;
          amount_cents: number;
          currency: string;
          status: string;
          paid_at: string | null;
          receipt_path: string | null;
          webhook_event_id: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          invoice_id?: string | null;
          mandate_id?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          method: string;
          amount_cents: number;
          currency?: string;
          status?: string;
          paid_at?: string | null;
          receipt_path?: string | null;
          webhook_event_id?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          invoice_id?: string | null;
          mandate_id?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          method?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          paid_at?: string | null;
          receipt_path?: string | null;
          webhook_event_id?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "payments_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_invoice_id_fkey"; columns: ["invoice_id"]; isOneToOne: false; referencedRelation: "invoices"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_mandate_id_fkey"; columns: ["mandate_id"]; isOneToOne: false; referencedRelation: "payment_mandates"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      practical_check_questions: {
        Row: {
          id: string;
          tenant_id: string | null;
          category: string;
          license_codes: string[];
          locale: string;
          question: string;
          expected_points: string[];
          explanation: string | null;
          source: string | null;
          review_status: Database["app"]["Enums"]["review_status"];
          legal_basis_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          category: string;
          license_codes?: string[];
          locale?: string;
          question: string;
          expected_points: string[];
          explanation?: string | null;
          source?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          legal_basis_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          category?: string;
          license_codes?: string[];
          locale?: string;
          question?: string;
          expected_points?: string[];
          explanation?: string | null;
          source?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          legal_basis_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "practical_check_questions_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      practical_exams: {
        Row: {
          id: string;
          tenant_id: string;
          student_license_id: string;
          status: Database["app"]["Enums"]["exam_status"];
          released_by: string | null;
          released_at: string | null;
          scheduled_at: string | null;
          instructor_id: string | null;
          vehicle_id: string | null;
          examining_body: string | null;
          meeting_point: string | null;
          attempt_no: number;
          result: string | null;
          result_at: string | null;
          examiner_feedback: string | null;
          rule_version_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_license_id: string;
          status?: Database["app"]["Enums"]["exam_status"];
          released_by?: string | null;
          released_at?: string | null;
          scheduled_at?: string | null;
          instructor_id?: string | null;
          vehicle_id?: string | null;
          examining_body?: string | null;
          meeting_point?: string | null;
          attempt_no?: number;
          result?: string | null;
          result_at?: string | null;
          examiner_feedback?: string | null;
          rule_version_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_license_id?: string;
          status?: Database["app"]["Enums"]["exam_status"];
          released_by?: string | null;
          released_at?: string | null;
          scheduled_at?: string | null;
          instructor_id?: string | null;
          vehicle_id?: string | null;
          examining_body?: string | null;
          meeting_point?: string | null;
          attempt_no?: number;
          result?: string | null;
          result_at?: string | null;
          examiner_feedback?: string | null;
          rule_version_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "practical_exams_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "practical_exams_released_by_fkey"; columns: ["released_by"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "practical_exams_rule_version_id_fkey"; columns: ["rule_version_id"]; isOneToOne: false; referencedRelation: "rule_versions"; referencedColumns: ["id"] },
          { foreignKeyName: "practical_exams_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "practical_exams_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "practical_exams_vehicle_id_fkey"; columns: ["vehicle_id"]; isOneToOne: false; referencedRelation: "vehicles"; referencedColumns: ["id"] }
        ];
      };
      price_items: {
        Row: {
          id: string;
          price_list_id: string;
          code: string;
          name: string;
          unit: string;
          amount_cents: number;
          lesson_kind: Database["app"]["Enums"]["lesson_kind"] | null;
        };
        Insert: {
          id?: string;
          price_list_id: string;
          code: string;
          name: string;
          unit?: string;
          amount_cents: number;
          lesson_kind?: Database["app"]["Enums"]["lesson_kind"] | null;
        };
        Update: {
          id?: string;
          price_list_id?: string;
          code?: string;
          name?: string;
          unit?: string;
          amount_cents?: number;
          lesson_kind?: Database["app"]["Enums"]["lesson_kind"] | null;
        };
        Relationships: [
          { foreignKeyName: "price_items_price_list_id_fkey"; columns: ["price_list_id"]; isOneToOne: false; referencedRelation: "price_lists"; referencedColumns: ["id"] }
        ];
      };
      price_lists: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          license_code: string | null;
          valid_from: string;
          valid_until: string | null;
          vat_rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          license_code?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          vat_rate?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          license_code?: string | null;
          valid_from?: string;
          valid_until?: string | null;
          vat_rate?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "price_lists_license_code_fkey"; columns: ["license_code"]; isOneToOne: false; referencedRelation: "licenses"; referencedColumns: ["code"] },
          { foreignKeyName: "price_lists_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          token: string;
          device_name: string | null;
          locale: string | null;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          token: string;
          device_name?: string | null;
          locale?: string | null;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          token?: string;
          device_name?: string | null;
          locale?: string | null;
          last_seen_at?: string;
        };
        Relationships: [
          { foreignKeyName: "push_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      question_answers: {
        Row: {
          id: string;
          question_version_id: string;
          position: number;
          text: string;
          is_correct: boolean;
          explanation: string | null;
        };
        Insert: {
          id?: string;
          question_version_id: string;
          position: number;
          text: string;
          is_correct: boolean;
          explanation?: string | null;
        };
        Update: {
          id?: string;
          question_version_id?: string;
          position?: number;
          text?: string;
          is_correct?: boolean;
          explanation?: string | null;
        };
        Relationships: [
          { foreignKeyName: "question_answers_question_version_id_fkey"; columns: ["question_version_id"]; isOneToOne: false; referencedRelation: "question_versions"; referencedColumns: ["id"] }
        ];
      };
      question_versions: {
        Row: {
          id: string;
          question_id: string;
          version: number;
          locale: string;
          text: string;
          media_path: string | null;
          media_kind: string | null;
          explanation: string | null;
          mnemonic: string | null;
          legal_reference: string | null;
          legal_basis_date: string | null;
          numeric_answer: number | null;
          numeric_tolerance: number | null;
          valid_from: string;
          valid_until: string | null;
          review_status: Database["app"]["Enums"]["review_status"];
          reviewed_by: string | null;
          reviewed_at: string | null;
          source_note: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          media_alt: string | null;
          media_credit: string | null;
        };
        Insert: {
          id?: string;
          question_id: string;
          version: number;
          locale?: string;
          text: string;
          media_path?: string | null;
          media_kind?: string | null;
          explanation?: string | null;
          mnemonic?: string | null;
          legal_reference?: string | null;
          legal_basis_date?: string | null;
          numeric_answer?: number | null;
          numeric_tolerance?: number | null;
          valid_from?: string;
          valid_until?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          source_note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          media_alt?: string | null;
          media_credit?: string | null;
        };
        Update: {
          id?: string;
          question_id?: string;
          version?: number;
          locale?: string;
          text?: string;
          media_path?: string | null;
          media_kind?: string | null;
          explanation?: string | null;
          mnemonic?: string | null;
          legal_reference?: string | null;
          legal_basis_date?: string | null;
          numeric_answer?: number | null;
          numeric_tolerance?: number | null;
          valid_from?: string;
          valid_until?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          source_note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          media_alt?: string | null;
          media_credit?: string | null;
        };
        Relationships: [
          { foreignKeyName: "question_versions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "question_versions_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "theory_questions"; referencedColumns: ["id"] },
          { foreignKeyName: "question_versions_reviewed_by_fkey"; columns: ["reviewed_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      readiness_snapshots: {
        Row: {
          id: string;
          tenant_id: string;
          student_license_id: string;
          computed_at: string;
          theory_score: number;
          practical_score: number | null;
          overall_score: number;
          factors: Json;
          engine_version: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_license_id: string;
          computed_at?: string;
          theory_score: number;
          practical_score?: number | null;
          overall_score: number;
          factors: Json;
          engine_version: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_license_id?: string;
          computed_at?: string;
          theory_score?: number;
          practical_score?: number | null;
          overall_score?: number;
          factors?: Json;
          engine_version?: string;
        };
        Relationships: [
          { foreignKeyName: "readiness_snapshots_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "readiness_snapshots_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      retention_policies: {
        Row: {
          id: string;
          tenant_id: string | null;
          data_category: string;
          retention_months: number;
          legal_basis: string | null;
          review_status: Database["app"]["Enums"]["review_status"];
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          data_category: string;
          retention_months: number;
          legal_basis?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          data_category?: string;
          retention_months?: number;
          legal_basis?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
        };
        Relationships: [
          { foreignKeyName: "retention_policies_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      rule_versions: {
        Row: {
          id: string;
          rule_type: Database["app"]["Enums"]["rule_type"];
          license_code: string | null;
          acquisition_kind: string;
          version: number;
          valid_from: string;
          valid_until: string | null;
          payload: Json;
          source: string;
          legal_basis_date: string | null;
          review_status: Database["app"]["Enums"]["review_status"];
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_type: Database["app"]["Enums"]["rule_type"];
          license_code?: string | null;
          acquisition_kind?: string;
          version: number;
          valid_from: string;
          valid_until?: string | null;
          payload: Json;
          source: string;
          legal_basis_date?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rule_type?: Database["app"]["Enums"]["rule_type"];
          license_code?: string | null;
          acquisition_kind?: string;
          version?: number;
          valid_from?: string;
          valid_until?: string | null;
          payload?: Json;
          source?: string;
          legal_basis_date?: string | null;
          review_status?: Database["app"]["Enums"]["review_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "rule_versions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "rule_versions_license_code_fkey"; columns: ["license_code"]; isOneToOne: false; referencedRelation: "licenses"; referencedColumns: ["code"] },
          { foreignKeyName: "rule_versions_reviewed_by_fkey"; columns: ["reviewed_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      skills: {
        Row: {
          code: string;
          name_i18n: Json;
          category: string;
          license_codes: string[];
          sort_order: number;
          active: boolean;
        };
        Insert: {
          code: string;
          name_i18n: Json;
          category: string;
          license_codes?: string[];
          sort_order?: number;
          active?: boolean;
        };
        Update: {
          code?: string;
          name_i18n?: Json;
          category?: string;
          license_codes?: string[];
          sort_order?: number;
          active?: boolean;
        };
        Relationships: [

        ];
      };
      student_badges: {
        Row: {
          tenant_id: string;
          student_id: string;
          badge_code: string;
          earned_at: string;
        };
        Insert: {
          tenant_id: string;
          student_id: string;
          badge_code: string;
          earned_at?: string;
        };
        Update: {
          tenant_id?: string;
          student_id?: string;
          badge_code?: string;
          earned_at?: string;
        };
        Relationships: [
          { foreignKeyName: "student_badges_badge_code_fkey"; columns: ["badge_code"]; isOneToOne: false; referencedRelation: "badges"; referencedColumns: ["code"] },
          { foreignKeyName: "student_badges_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "student_badges_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      student_licenses: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          license_code: string;
          acquisition_kind: string;
          transmission: string;
          accompanied_driving: boolean;
          existing_license_codes: string[];
          primary_instructor_id: string | null;
          contract_id: string | null;
          status: string;
          started_at: string;
          theory_exam_status: Database["app"]["Enums"]["exam_status"];
          practical_exam_status: Database["app"]["Enums"]["exam_status"];
          theory_exam_passed_at: string | null;
          practical_exam_passed_at: string | null;
          training_rule_version_id: string | null;
          theory_lessons_rule_version_id: string | null;
          row_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          license_code: string;
          acquisition_kind?: string;
          transmission?: string;
          accompanied_driving?: boolean;
          existing_license_codes?: string[];
          primary_instructor_id?: string | null;
          contract_id?: string | null;
          status?: string;
          started_at?: string;
          theory_exam_status?: Database["app"]["Enums"]["exam_status"];
          practical_exam_status?: Database["app"]["Enums"]["exam_status"];
          theory_exam_passed_at?: string | null;
          practical_exam_passed_at?: string | null;
          training_rule_version_id?: string | null;
          theory_lessons_rule_version_id?: string | null;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          license_code?: string;
          acquisition_kind?: string;
          transmission?: string;
          accompanied_driving?: boolean;
          existing_license_codes?: string[];
          primary_instructor_id?: string | null;
          contract_id?: string | null;
          status?: string;
          started_at?: string;
          theory_exam_status?: Database["app"]["Enums"]["exam_status"];
          practical_exam_status?: Database["app"]["Enums"]["exam_status"];
          theory_exam_passed_at?: string | null;
          practical_exam_passed_at?: string | null;
          training_rule_version_id?: string | null;
          theory_lessons_rule_version_id?: string | null;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "student_licenses_contract_fk"; columns: ["contract_id"]; isOneToOne: false; referencedRelation: "contracts"; referencedColumns: ["id"] },
          { foreignKeyName: "student_licenses_license_code_fkey"; columns: ["license_code"]; isOneToOne: false; referencedRelation: "licenses"; referencedColumns: ["code"] },
          { foreignKeyName: "student_licenses_primary_instructor_id_fkey"; columns: ["primary_instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "student_licenses_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "student_licenses_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "student_licenses_theory_lessons_rule_version_id_fkey"; columns: ["theory_lessons_rule_version_id"]; isOneToOne: false; referencedRelation: "rule_versions"; referencedColumns: ["id"] },
          { foreignKeyName: "student_licenses_training_rule_version_id_fkey"; columns: ["training_rule_version_id"]; isOneToOne: false; referencedRelation: "rule_versions"; referencedColumns: ["id"] }
        ];
      };
      student_question_attempts: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          question_id: string;
          question_version_id: string;
          session_id: string | null;
          exam_simulation_id: string | null;
          client_attempt_id: string;
          selected_positions: number[];
          numeric_answer: number | null;
          is_correct: boolean;
          points: number;
          confidence: number | null;
          response_ms: number | null;
          answered_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          question_id: string;
          question_version_id: string;
          session_id?: string | null;
          exam_simulation_id?: string | null;
          client_attempt_id: string;
          selected_positions?: number[];
          numeric_answer?: number | null;
          is_correct: boolean;
          points: number;
          confidence?: number | null;
          response_ms?: number | null;
          answered_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          question_id?: string;
          question_version_id?: string;
          session_id?: string | null;
          exam_simulation_id?: string | null;
          client_attempt_id?: string;
          selected_positions?: number[];
          numeric_answer?: number | null;
          is_correct?: boolean;
          points?: number;
          confidence?: number | null;
          response_ms?: number | null;
          answered_at?: string;
        };
        Relationships: [
          { foreignKeyName: "sqa_exam_fk"; columns: ["exam_simulation_id"]; isOneToOne: false; referencedRelation: "exam_simulations"; referencedColumns: ["id"] },
          { foreignKeyName: "student_question_attempts_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "theory_questions"; referencedColumns: ["id"] },
          { foreignKeyName: "student_question_attempts_question_version_id_fkey"; columns: ["question_version_id"]; isOneToOne: false; referencedRelation: "question_versions"; referencedColumns: ["id"] },
          { foreignKeyName: "student_question_attempts_session_id_fkey"; columns: ["session_id"]; isOneToOne: false; referencedRelation: "learning_sessions"; referencedColumns: ["id"] },
          { foreignKeyName: "student_question_attempts_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "student_question_attempts_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      student_question_state: {
        Row: {
          tenant_id: string;
          student_id: string;
          question_id: string;
          attempts: number;
          correct: number;
          consecutive_correct: number;
          last_correct: boolean | null;
          last_answered_at: string | null;
          last_confidence: number | null;
          avg_response_ms: number | null;
          ease: number;
          interval_days: number;
          due_at: string;
          mastery: number;
          bookmarked: boolean;
          row_version: number;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          student_id: string;
          question_id: string;
          attempts?: number;
          correct?: number;
          consecutive_correct?: number;
          last_correct?: boolean | null;
          last_answered_at?: string | null;
          last_confidence?: number | null;
          avg_response_ms?: number | null;
          ease?: number;
          interval_days?: number;
          due_at?: string;
          mastery?: number;
          bookmarked?: boolean;
          row_version?: number;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          student_id?: string;
          question_id?: string;
          attempts?: number;
          correct?: number;
          consecutive_correct?: number;
          last_correct?: boolean | null;
          last_answered_at?: string | null;
          last_confidence?: number | null;
          avg_response_ms?: number | null;
          ease?: number;
          interval_days?: number;
          due_at?: string;
          mastery?: number;
          bookmarked?: boolean;
          row_version?: number;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "student_question_state_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "theory_questions"; referencedColumns: ["id"] },
          { foreignKeyName: "student_question_state_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "student_question_state_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      student_skill_scores: {
        Row: {
          id: string;
          tenant_id: string;
          student_license_id: string;
          skill_code: string;
          lesson_id: string | null;
          instructor_id: string | null;
          rating: number;
          comment: string | null;
          rated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_license_id: string;
          skill_code: string;
          lesson_id?: string | null;
          instructor_id?: string | null;
          rating: number;
          comment?: string | null;
          rated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_license_id?: string;
          skill_code?: string;
          lesson_id?: string | null;
          instructor_id?: string | null;
          rating?: number;
          comment?: string | null;
          rated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "sss_lesson_fk"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "student_skill_scores_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "student_skill_scores_skill_code_fkey"; columns: ["skill_code"]; isOneToOne: false; referencedRelation: "skills"; referencedColumns: ["code"] },
          { foreignKeyName: "student_skill_scores_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "student_skill_scores_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      student_streaks: {
        Row: {
          tenant_id: string;
          student_id: string;
          current_days: number;
          longest_days: number;
          last_active_date: string | null;
          total_xp: number;
          level: number;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          student_id: string;
          current_days?: number;
          longest_days?: number;
          last_active_date?: string | null;
          total_xp?: number;
          level?: number;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          student_id?: string;
          current_days?: number;
          longest_days?: number;
          last_active_date?: string | null;
          total_xp?: number;
          level?: number;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "student_streaks_student_id_fkey"; columns: ["student_id"]; isOneToOne: true; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "student_streaks_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      student_topic_mastery: {
        Row: {
          tenant_id: string;
          student_id: string;
          topic_id: string;
          mastery: number;
          coverage: number;
          attempts: number;
          correct: number;
          recent_error_share: number | null;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          student_id: string;
          topic_id: string;
          mastery?: number;
          coverage?: number;
          attempts?: number;
          correct?: number;
          recent_error_share?: number | null;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          student_id?: string;
          topic_id?: string;
          mastery?: number;
          coverage?: number;
          attempts?: number;
          correct?: number;
          recent_error_share?: number | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "student_topic_mastery_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "student_topic_mastery_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "student_topic_mastery_topic_id_fkey"; columns: ["topic_id"]; isOneToOne: false; referencedRelation: "topics"; referencedColumns: ["id"] }
        ];
      };
      students: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          location_id: string | null;
          student_number: string | null;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          email: string | null;
          phone: string | null;
          address_line1: string | null;
          postal_code: string | null;
          city: string | null;
          preferred_locale: string;
          guardian_name: string | null;
          guardian_email: string | null;
          guardian_phone: string | null;
          status: string;
          onboarding_completed_at: string | null;
          notes_internal: string | null;
          row_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          location_id?: string | null;
          student_number?: string | null;
          first_name: string;
          last_name: string;
          date_of_birth?: string | null;
          email?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          postal_code?: string | null;
          city?: string | null;
          preferred_locale?: string;
          guardian_name?: string | null;
          guardian_email?: string | null;
          guardian_phone?: string | null;
          status?: string;
          onboarding_completed_at?: string | null;
          notes_internal?: string | null;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string | null;
          location_id?: string | null;
          student_number?: string | null;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string | null;
          email?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          postal_code?: string | null;
          city?: string | null;
          preferred_locale?: string;
          guardian_name?: string | null;
          guardian_email?: string | null;
          guardian_phone?: string | null;
          status?: string;
          onboarding_completed_at?: string | null;
          notes_internal?: string | null;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "students_location_id_fkey"; columns: ["location_id"]; isOneToOne: false; referencedRelation: "locations"; referencedColumns: ["id"] },
          { foreignKeyName: "students_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "students_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      tenant_memberships: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: Database["app"]["Enums"]["tenant_role"];
          status: string;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: Database["app"]["Enums"]["tenant_role"];
          status?: string;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: Database["app"]["Enums"]["tenant_role"];
          status?: string;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "tenant_memberships_invited_by_fkey"; columns: ["invited_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "tenant_memberships_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "tenant_memberships_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      theory_class_checkin_tokens: {
        Row: {
          id: string;
          tenant_id: string;
          theory_class_id: string;
          token_hash: string;
          valid_from: string;
          valid_until: string;
          max_uses: number | null;
          uses: number;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          theory_class_id: string;
          token_hash: string;
          valid_from?: string;
          valid_until: string;
          max_uses?: number | null;
          uses?: number;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          theory_class_id?: string;
          token_hash?: string;
          valid_from?: string;
          valid_until?: string;
          max_uses?: number | null;
          uses?: number;
          created_by?: string | null;
        };
        Relationships: [
          { foreignKeyName: "theory_class_checkin_tokens_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_class_checkin_tokens_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_class_checkin_tokens_theory_class_id_fkey"; columns: ["theory_class_id"]; isOneToOne: false; referencedRelation: "theory_classes"; referencedColumns: ["id"] }
        ];
      };
      theory_classes: {
        Row: {
          id: string;
          tenant_id: string;
          location_id: string | null;
          instructor_id: string | null;
          lesson_unit_code: string;
          material_kind: string;
          license_codes: string[];
          title: string;
          period: string;
          capacity: number | null;
          status: string;
          is_online: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          location_id?: string | null;
          instructor_id?: string | null;
          lesson_unit_code: string;
          material_kind: string;
          license_codes?: string[];
          title: string;
          period: string;
          capacity?: number | null;
          status?: string;
          is_online?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          location_id?: string | null;
          instructor_id?: string | null;
          lesson_unit_code?: string;
          material_kind?: string;
          license_codes?: string[];
          title?: string;
          period?: string;
          capacity?: number | null;
          status?: string;
          is_online?: boolean;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "theory_classes_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_classes_location_id_fkey"; columns: ["location_id"]; isOneToOne: false; referencedRelation: "locations"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_classes_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      theory_exams: {
        Row: {
          id: string;
          tenant_id: string;
          student_license_id: string;
          status: Database["app"]["Enums"]["exam_status"];
          released_by: string | null;
          released_at: string | null;
          scheduled_at: string | null;
          examining_body: string | null;
          location_text: string | null;
          language_code: string | null;
          attempt_no: number;
          result: string | null;
          error_points: number | null;
          result_at: string | null;
          rule_version_id: string | null;
          fee_invoice_item_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_license_id: string;
          status?: Database["app"]["Enums"]["exam_status"];
          released_by?: string | null;
          released_at?: string | null;
          scheduled_at?: string | null;
          examining_body?: string | null;
          location_text?: string | null;
          language_code?: string | null;
          attempt_no?: number;
          result?: string | null;
          error_points?: number | null;
          result_at?: string | null;
          rule_version_id?: string | null;
          fee_invoice_item_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_license_id?: string;
          status?: Database["app"]["Enums"]["exam_status"];
          released_by?: string | null;
          released_at?: string | null;
          scheduled_at?: string | null;
          examining_body?: string | null;
          location_text?: string | null;
          language_code?: string | null;
          attempt_no?: number;
          result?: string | null;
          error_points?: number | null;
          result_at?: string | null;
          rule_version_id?: string | null;
          fee_invoice_item_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "theory_exams_fee_item_fk"; columns: ["fee_invoice_item_id"]; isOneToOne: false; referencedRelation: "invoice_items"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_exams_released_by_fkey"; columns: ["released_by"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_exams_rule_version_id_fkey"; columns: ["rule_version_id"]; isOneToOne: false; referencedRelation: "rule_versions"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_exams_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_exams_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      theory_questions: {
        Row: {
          id: string;
          tenant_id: string | null;
          external_ref: string | null;
          source: Database["app"]["Enums"]["content_source"];
          license_id_for_source: string | null;
          topic_id: string;
          material_kind: string;
          license_codes: string[];
          points: number;
          difficulty: number;
          question_kind: string;
          status: Database["app"]["Enums"]["review_status"];
          current_version_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          tags: string[];
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          external_ref?: string | null;
          source?: Database["app"]["Enums"]["content_source"];
          license_id_for_source?: string | null;
          topic_id: string;
          material_kind?: string;
          license_codes?: string[];
          points: number;
          difficulty?: number;
          question_kind?: string;
          status?: Database["app"]["Enums"]["review_status"];
          current_version_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          tags?: string[];
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          external_ref?: string | null;
          source?: Database["app"]["Enums"]["content_source"];
          license_id_for_source?: string | null;
          topic_id?: string;
          material_kind?: string;
          license_codes?: string[];
          points?: number;
          difficulty?: number;
          question_kind?: string;
          status?: Database["app"]["Enums"]["review_status"];
          current_version_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          tags?: string[];
        };
        Relationships: [
          { foreignKeyName: "theory_questions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_questions_current_version_fk"; columns: ["current_version_id"]; isOneToOne: false; referencedRelation: "question_versions"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_questions_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "theory_questions_topic_id_fkey"; columns: ["topic_id"]; isOneToOne: false; referencedRelation: "topics"; referencedColumns: ["id"] }
        ];
      };
      topics: {
        Row: {
          id: string;
          tenant_id: string | null;
          code: string;
          parent_id: string | null;
          name_i18n: Json;
          description_i18n: Json;
          material_kind: string;
          license_codes: string[];
          practical_skill_code: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          code: string;
          parent_id?: string | null;
          name_i18n: Json;
          description_i18n?: Json;
          material_kind?: string;
          license_codes?: string[];
          practical_skill_code?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          code?: string;
          parent_id?: string | null;
          name_i18n?: Json;
          description_i18n?: Json;
          material_kind?: string;
          license_codes?: string[];
          practical_skill_code?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "topics_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "topics"; referencedColumns: ["id"] },
          { foreignKeyName: "topics_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          locale: string;
          avatar_path: string | null;
          is_platform_admin: boolean;
          accessibility: Json;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
          active_tenant_id: string | null;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          locale?: string;
          avatar_path?: string | null;
          is_platform_admin?: boolean;
          accessibility?: Json;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
          active_tenant_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          locale?: string;
          avatar_path?: string | null;
          is_platform_admin?: boolean;
          accessibility?: Json;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
          active_tenant_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "users_active_tenant_id_fkey"; columns: ["active_tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      vehicle_blocks: {
        Row: {
          id: string;
          tenant_id: string;
          vehicle_id: string;
          period: string;
          reason: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          vehicle_id: string;
          period: string;
          reason?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          vehicle_id?: string;
          period?: string;
          reason?: string;
          note?: string | null;
        };
        Relationships: [
          { foreignKeyName: "vehicle_blocks_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "vehicle_blocks_vehicle_id_fkey"; columns: ["vehicle_id"]; isOneToOne: false; referencedRelation: "vehicles"; referencedColumns: ["id"] }
        ];
      };
      vehicles: {
        Row: {
          id: string;
          tenant_id: string;
          location_id: string | null;
          license_plate: string;
          make: string | null;
          model: string | null;
          transmission: string;
          license_classes: string[];
          mileage_km: number | null;
          status: string;
          next_inspection_due: string | null;
          next_service_due: string | null;
          next_service_km: number | null;
          tire_set: string | null;
          tire_change_due: string | null;
          insurance_provider: string | null;
          insurance_policy_number: string | null;
          insurance_renewal_due: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          location_id?: string | null;
          license_plate: string;
          make?: string | null;
          model?: string | null;
          transmission: string;
          license_classes?: string[];
          mileage_km?: number | null;
          status?: string;
          next_inspection_due?: string | null;
          next_service_due?: string | null;
          next_service_km?: number | null;
          tire_set?: string | null;
          tire_change_due?: string | null;
          insurance_provider?: string | null;
          insurance_policy_number?: string | null;
          insurance_renewal_due?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          location_id?: string | null;
          license_plate?: string;
          make?: string | null;
          model?: string | null;
          transmission?: string;
          license_classes?: string[];
          mileage_km?: number | null;
          status?: string;
          next_inspection_due?: string | null;
          next_service_due?: string | null;
          next_service_km?: number | null;
          tire_set?: string | null;
          tire_change_due?: string | null;
          insurance_provider?: string | null;
          insurance_policy_number?: string | null;
          insurance_renewal_due?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "vehicles_location_id_fkey"; columns: ["location_id"]; isOneToOne: false; referencedRelation: "locations"; referencedColumns: ["id"] },
          { foreignKeyName: "vehicles_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      waitlist_entries: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          student_license_id: string | null;
          instructor_id: string | null;
          transmission: string | null;
          earliest: string;
          latest: string;
          weekdays: number[];
          time_from: string | null;
          time_to: string | null;
          strategy: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          student_license_id?: string | null;
          instructor_id?: string | null;
          transmission?: string | null;
          earliest: string;
          latest: string;
          weekdays?: number[];
          time_from?: string | null;
          time_to?: string | null;
          strategy?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          student_license_id?: string | null;
          instructor_id?: string | null;
          transmission?: string | null;
          earliest?: string;
          latest?: string;
          weekdays?: number[];
          time_from?: string | null;
          time_to?: string | null;
          strategy?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "waitlist_entries_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "waitlist_entries_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "waitlist_entries_student_license_id_fkey"; columns: ["student_license_id"]; isOneToOne: false; referencedRelation: "student_licenses"; referencedColumns: ["id"] },
          { foreignKeyName: "waitlist_entries_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
      waitlist_offers: {
        Row: {
          id: string;
          tenant_id: string;
          waitlist_entry_id: string;
          lesson_id: string;
          offered_at: string;
          expires_at: string;
          response: string | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          waitlist_entry_id: string;
          lesson_id: string;
          offered_at?: string;
          expires_at: string;
          response?: string | null;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          waitlist_entry_id?: string;
          lesson_id?: string;
          offered_at?: string;
          expires_at?: string;
          response?: string | null;
          responded_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "waitlist_offers_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "waitlist_offers_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] },
          { foreignKeyName: "waitlist_offers_waitlist_entry_id_fkey"; columns: ["waitlist_entry_id"]; isOneToOne: false; referencedRelation: "waitlist_entries"; referencedColumns: ["id"] }
        ];
      };
      xp_events: {
        Row: {
          id: string;
          tenant_id: string;
          student_id: string;
          kind: string;
          xp: number;
          ref_id: string | null;
          client_event_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          student_id: string;
          kind: string;
          xp: number;
          ref_id?: string | null;
          client_event_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          student_id?: string;
          kind?: string;
          xp?: number;
          ref_id?: string | null;
          client_event_id?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "xp_events_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "xp_events_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "driving_schools"; referencedColumns: ["id"] }
        ];
      };
    };
    Views: {
    };
    Functions: {
      book_lesson: { Args: { p_lesson_id: string; p_student_license_id: string; p_client_request_id?: string | null }; Returns: Database["public"]["Tables"]["lessons"]["Row"] };
      bump_learning_session: { Args: { p_session_id: string; p_correct: boolean }; Returns: unknown };
      cancel_lesson: { Args: { p_lesson_id: string; p_reason?: string | null; p_client_request_id?: string | null }; Returns: Database["public"]["Tables"]["lesson_bookings"]["Row"] };
      checkin_theory_class: { Args: { p_token: string; p_device_fingerprint?: string | null; p_geo_distance_m?: number | null }; Returns: Database["public"]["Tables"]["attendance"]["Row"] };
      confirm_lesson_booking: { Args: { p_lesson_id: string }; Returns: Database["public"]["Tables"]["lessons"]["Row"] };
      create_checkin_token: { Args: { p_theory_class_id: string; p_ttl_seconds?: number | null; p_max_uses?: number | null }; Returns: string };
      current_instructor_id: { Args: {  }; Returns: string };
      current_student_id: { Args: {  }; Returns: string };
      custom_access_token_hook: { Args: { event: Json }; Returns: unknown };
      handle_auth_user_signed_in: { Args: {  }; Returns: unknown };
      handle_new_auth_user: { Args: {  }; Returns: unknown };
      issue_invoice: { Args: { p_invoice_id: string; p_due_days?: number | null }; Returns: Database["public"]["Tables"]["invoices"]["Row"] };
      notify_conversation: { Args: { p_conversation_id: string; p_preview: string }; Returns: number };
      offer_lesson_to_waitlist: { Args: { p_lesson_id: string }; Returns: number };
      register_student: { Args: { p_tenant_slug: string; p_payload: Json }; Returns: string };
      release_exam: { Args: { p_student_license_id: string; p_kind: string }; Returns: unknown };
      rule_version_for: { Args: { p_rule_type: string; p_license_code: string; p_acquisition: string; p_on?: string | null }; Returns: Database["public"]["Tables"]["rule_versions"]["Row"][] };
      rule_version_for_any: { Args: { p_rule_type: string; p_license_code: string; p_acquisition: string; p_on?: string | null }; Returns: Database["public"]["Tables"]["rule_versions"]["Row"][] };
      set_question_bookmark: { Args: { p_question_id: string; p_bookmarked: boolean }; Returns: unknown };
      special_drive_progress: { Args: { p_student_license_id: string }; Returns: Record<string, unknown>[] };
      switch_active_tenant: { Args: { p_tenant_id: string }; Returns: unknown };
      update_student_notes: { Args: { p_student_id: string; p_notes: string }; Returns: unknown };
    };
    Enums: {
    };
    CompositeTypes: Record<string, never>;
  };
  app: {
    Tables: {
    };
    Views: {
    };
    Functions: {
    };
    Enums: {
      content_source: "own" | "official_licensed" | "tenant";
      exam_status: "not_ready" | "awaiting_instructor_release" | "ready" | "requested" | "scheduled" | "passed" | "failed" | "cancelled";
      invoice_status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled" | "credited";
      learning_mode: "topic" | "question_list" | "exam" | "random" | "hard" | "wrong" | "bookmarked" | "unseen" | "review" | "weakness" | "daily_goal" | "generated";
      lesson_kind: "practice" | "overland" | "motorway" | "night" | "special" | "exam_prep" | "practical_exam" | "manual_conversion" | "trailer";
      lesson_status: "open" | "booked" | "confirmed" | "completed" | "no_show" | "cancelled";
      review_status: "draft" | "in_review" | "approved" | "published" | "retired" | "needs_verification";
      rule_type: "exam_theory" | "exam_practical" | "training_requirements" | "theory_lessons";
      tenant_role: "student" | "instructor" | "office" | "admin" | "owner";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Enums<S extends "public" | "app", T extends keyof Database[S]["Enums"]> = Database[S]["Enums"][T];
