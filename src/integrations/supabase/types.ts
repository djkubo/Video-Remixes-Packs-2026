export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          country_code: string | null
          created_at: string
          cta_id: string | null
          device_type: string | null
          event_data: Json | null
          event_name: string
          experiment_assignments: Json | null
          funnel_step: string | null
          id: string
          language: string | null
          page_path: string | null
          plan_id: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          cta_id?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_name: string
          experiment_assignments?: Json | null
          funnel_step?: string | null
          id?: string
          language?: string | null
          page_path?: string | null
          plan_id?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          cta_id?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_name?: string
          experiment_assignments?: Json | null
          funnel_step?: string | null
          id?: string
          language?: string | null
          page_path?: string | null
          plan_id?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      email_delivery_attempts: {
        Row: {
          attempt_no: number
          created_at: string
          error_message: string | null
          id: string
          provider: string | null
          queue_id: string
          response_payload: Json | null
          status: string
        }
        Insert: {
          attempt_no: number
          created_at?: string
          error_message?: string | null
          id?: string
          provider?: string | null
          queue_id: string
          response_payload?: Json | null
          status: string
        }
        Update: {
          attempt_no?: number
          created_at?: string
          error_message?: string | null
          id?: string
          provider?: string | null
          queue_id?: string
          response_payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_delivery_attempts_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "outbound_email_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_visible: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          consent_marketing: boolean | null
          consent_marketing_at: string | null
          consent_transactional: boolean | null
          consent_transactional_at: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          email: string
          experiment_assignments: Json | null
          funnel_step: string | null
          id: string
          intent_plan: string | null
          manychat_subscriber_id: string | null
          manychat_synced: boolean | null
          name: string
          paid_at: string | null
          payment_id: string | null
          payment_provider: string | null
          phone: string
          shipping_carrier: string | null
          shipping_label_url: string | null
          shipping_servicelevel: string | null
          shipping_status: string | null
          shipping_to: Json | null
          shipping_tracking_number: string | null
          source: string | null
          source_page: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          consent_marketing?: boolean | null
          consent_marketing_at?: string | null
          consent_transactional?: boolean | null
          consent_transactional_at?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          email: string
          experiment_assignments?: Json | null
          funnel_step?: string | null
          id?: string
          intent_plan?: string | null
          manychat_subscriber_id?: string | null
          manychat_synced?: boolean | null
          name: string
          paid_at?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          phone: string
          shipping_carrier?: string | null
          shipping_label_url?: string | null
          shipping_servicelevel?: string | null
          shipping_status?: string | null
          shipping_to?: Json | null
          shipping_tracking_number?: string | null
          source?: string | null
          source_page?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          consent_marketing?: boolean | null
          consent_marketing_at?: string | null
          consent_transactional?: boolean | null
          consent_transactional_at?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          email?: string
          experiment_assignments?: Json | null
          funnel_step?: string | null
          id?: string
          intent_plan?: string | null
          manychat_subscriber_id?: string | null
          manychat_synced?: boolean | null
          name?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          phone?: string
          shipping_carrier?: string | null
          shipping_label_url?: string | null
          shipping_servicelevel?: string | null
          shipping_status?: string | null
          shipping_to?: Json | null
          shipping_tracking_number?: string | null
          source?: string | null
          source_page?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          created_at: string
          event_key: string | null
          event_payload: Json
          event_source: string
          event_type: string
          id: string
          lead_id: string
        }
        Insert: {
          created_at?: string
          event_key?: string | null
          event_payload?: Json
          event_source?: string
          event_type: string
          id?: string
          lead_id: string
        }
        Update: {
          created_at?: string
          event_key?: string | null
          event_payload?: Json
          event_source?: string
          event_type?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_email_queue: {
        Row: {
          created_at: string
          dedupe_key: string
          email_to: string
          id: string
          last_error: string | null
          lead_id: string
          max_retries: number
          next_retry_at: string
          payload: Json
          provider: string | null
          provider_message_id: string | null
          retry_count: number
          sent_at: string | null
          status: string
          subject: string
          template_key: string
          template_lang: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          email_to: string
          id?: string
          last_error?: string | null
          lead_id: string
          max_retries?: number
          next_retry_at?: string
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject: string
          template_key: string
          template_lang?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          email_to?: string
          id?: string
          last_error?: string | null
          lead_id?: string
          max_retries?: number
          next_retry_at?: string
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string
          template_lang?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_email_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          artist: string
          bpm: number | null
          created_at: string
          duration_formatted: string | null
          duration_seconds: number | null
          file_format: string | null
          file_path: string
          file_size_bytes: number | null
          file_url: string
          folder_id: string | null
          genre: string | null
          id: string
          is_visible: boolean | null
          play_count: number | null
          search_vector: unknown
          sort_order: number | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          artist: string
          bpm?: number | null
          created_at?: string
          duration_formatted?: string | null
          duration_seconds?: number | null
          file_format?: string | null
          file_path: string
          file_size_bytes?: number | null
          file_url: string
          folder_id?: string | null
          genre?: string | null
          id?: string
          is_visible?: boolean | null
          play_count?: number | null
          search_vector?: unknown
          sort_order?: number | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          artist?: string
          bpm?: number | null
          created_at?: string
          duration_formatted?: string | null
          duration_seconds?: number | null
          file_format?: string | null
          file_path?: string
          file_size_bytes?: number | null
          file_url?: string
          folder_id?: string | null
          genre?: string | null
          id?: string
          is_visible?: boolean | null
          play_count?: number | null
          search_vector?: unknown
          sort_order?: number | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_daily_summary: {
        Row: {
          date: string | null
          event_count: number | null
          event_name: string | null
          page_path: string | null
          unique_sessions: number | null
          unique_visitors: number | null
        }
        Relationships: []
      }
      cro_daily_variant_summary: {
        Row: {
          checkout_redirects: number | null
          day: string | null
          experiment_id: string | null
          lead_submits: number | null
          paid_conversions: number | null
          plan_clicks: number | null
          sessions: number | null
          variant_id: string | null
        }
        Relationships: []
      }
      email_queue_daily_summary: {
        Row: {
          day: string | null
          status: string | null
          template_key: string | null
          total: number | null
        }
        Relationships: []
      }
      order_events_daily_summary: {
        Row: {
          day: string | null
          event_type: string | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_email_jobs: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          dedupe_key: string
          email_to: string
          id: string
          last_error: string | null
          lead_id: string
          max_retries: number
          next_retry_at: string
          payload: Json
          provider: string | null
          provider_message_id: string | null
          retry_count: number
          sent_at: string | null
          status: string
          subject: string
          template_key: string
          template_lang: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "outbound_email_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      count_folder_tracks: { Args: { folder_id: string }; Returns: number }
      get_analytics_summary: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_country_breakdown: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          name: string
          value: number
        }[]
      }
      get_daily_trends: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          date: string
          page_views: number
          visitors: number
        }[]
      }
      get_event_breakdown: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          name: string
          value: number
        }[]
      }
      get_folder_path: {
        Args: { folder_id: string }
        Returns: {
          depth: number
          id: string
          name: string
          slug: string
        }[]
      }
      get_source_breakdown: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_email_job_failed: {
        Args: {
          p_error: string
          p_job_id: string
          p_provider?: string
          p_response?: Json
          p_retry_delay_minutes?: number
        }
        Returns: undefined
      }
      mark_email_job_sent: {
        Args: {
          p_job_id: string
          p_provider: string
          p_provider_message_id?: string
          p_response?: Json
        }
        Returns: undefined
      }
      queue_email_for_lead: {
        Args: {
          p_dedupe_key?: string
          p_lang?: string
          p_lead_id: string
          p_payload?: Json
          p_subject: string
          p_template_key: string
        }
        Returns: string
      }
      search_tracks: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          artist: string
          bpm: number
          duration_formatted: string
          file_url: string
          genre: string
          id: string
          rank: number
          title: string
        }[]
      }
      update_sort_order: {
        Args: { p_items: Json; p_table: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
