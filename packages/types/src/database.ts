// Auto-generated Supabase types. Do not edit manually.
// Regenerate by running the Supabase type generation after schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chapters: {
        Row: {
          active_languages: string[]
          brand_accent_color: string
          brand_font: string
          brand_logo_url: string | null
          brand_primary_color: string
          brand_secondary_color: string
          cloudflare_deploy_hook_url: string | null
          cloudflare_project_name: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          default_language: string
          github_folder_path: string | null
          id: string
          name: string
          slug: string
          status: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          subdomain: string
          updated_at: string
        }
        Insert: {
          active_languages?: string[]
          brand_accent_color?: string
          brand_font?: string
          brand_logo_url?: string | null
          brand_primary_color?: string
          brand_secondary_color?: string
          cloudflare_deploy_hook_url?: string | null
          cloudflare_project_name?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_language?: string
          github_folder_path?: string | null
          id?: string
          name: string
          slug: string
          status?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          subdomain: string
          updated_at?: string
        }
        Update: {
          active_languages?: string[]
          brand_accent_color?: string
          brand_font?: string
          brand_logo_url?: string | null
          brand_primary_color?: string
          brand_secondary_color?: string
          cloudflare_deploy_hook_url?: string | null
          cloudflare_project_name?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_language?: string
          github_folder_path?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          subdomain?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_organizations: {
        Row: {
          chapter_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_organizations_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          bio: string | null
          ce_credits_earned: number
          certification_approved: boolean
          certification_level: string
          chapter_id: string
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          full_name: string
          hours_logged: number
          id: string
          is_active: boolean
          languages: string[]
          photo_url: string | null
          recertification_due_date: string | null
          specializations: string[]
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          ce_credits_earned?: number
          certification_approved?: boolean
          certification_level: string
          chapter_id: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          full_name: string
          hours_logged?: number
          id?: string
          is_active?: boolean
          languages?: string[]
          photo_url?: string | null
          recertification_due_date?: string | null
          specializations?: string[]
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          ce_credits_earned?: number
          certification_approved?: boolean
          certification_level?: string
          chapter_id?: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          full_name?: string
          hours_logged?: number
          id?: string
          is_active?: boolean
          languages?: string[]
          photo_url?: string | null
          recertification_due_date?: string | null
          specializations?: string[]
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaches_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "global_coaches"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          block_key: string
          chapter_id: string
          content: string
          content_type: string
          created_at: string
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          block_key: string
          chapter_id: string
          content: string
          content_type?: string
          created_at?: string
          id?: string
          locale?: string
          updated_at?: string
        }
        Update: {
          block_key?: string
          chapter_id?: string
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_blocks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "global_coaches"
            referencedColumns: ["chapter_id"]
          },
        ]
      }
      deployments: {
        Row: {
          ai_prompt: string | null
          approval_status: string | null
          build_log: string | null
          chapter_id: string
          commit_reference: string | null
          completed_at: string | null
          created_at: string
          deploy_url: string | null
          error_message: string | null
          id: string
          preview_url: string | null
          status: string
          triggered_by: string
        }
        Insert: {
          ai_prompt?: string | null
          approval_status?: string | null
          build_log?: string | null
          chapter_id: string
          commit_reference?: string | null
          completed_at?: string | null
          created_at?: string
          deploy_url?: string | null
          error_message?: string | null
          id?: string
          preview_url?: string | null
          status?: string
          triggered_by: string
        }
        Update: {
          ai_prompt?: string | null
          approval_status?: string | null
          build_log?: string | null
          chapter_id?: string
          commit_reference?: string | null
          completed_at?: string | null
          created_at?: string
          deploy_url?: string | null
          error_message?: string | null
          id?: string
          preview_url?: string | null
          status?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "global_coaches"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "deployments_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          chapter_id: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          is_published: boolean
          is_virtual: boolean
          location: string | null
          max_attendees: number | null
          registration_link: string | null
          start_date: string
          title: string
          updated_at: string
          virtual_link: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_type: string
          id?: string
          is_published?: boolean
          is_virtual?: boolean
          location?: string | null
          max_attendees?: number | null
          registration_link?: string | null
          start_date: string
          title: string
          updated_at?: string
          virtual_link?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_published?: boolean
          is_virtual?: boolean
          location?: string | null
          max_attendees?: number | null
          registration_link?: string | null
          start_date?: string
          title?: string
          updated_at?: string
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          chapter_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: string
          status?: string
          token: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "global_coaches"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_filter: Json
          body: string
          chapter_id: string | null
          created_at: string
          created_by: string
          id: string
          recipient_count: number | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          body: string
          chapter_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          body?: string
          chapter_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          chapter_id: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          subscribed_at: string
        }
        Insert: {
          chapter_id: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
        }
        Update: {
          chapter_id?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          chapter_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          idempotency_key: string | null
          payer_email: string
          payer_id: string | null
          payment_provider: string
          payment_type: string
          provider_transaction_id: string | null
          receipt_sent: boolean
          status: string
          stripe_checkout_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          chapter_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          payer_email: string
          payer_id?: string | null
          payment_provider?: string
          payment_type: string
          provider_transaction_id?: string | null
          receipt_sent?: boolean
          status?: string
          stripe_checkout_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          chapter_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          payer_email?: string
          payer_id?: string | null
          payment_provider?: string
          payment_type?: string
          provider_transaction_id?: string | null
          receipt_sent?: boolean
          status?: string
          stripe_checkout_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_photo_url: string | null
          author_title: string | null
          chapter_id: string
          created_at: string
          id: string
          is_active: boolean
          is_featured: boolean
          quote: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_name: string
          author_photo_url?: string | null
          author_title?: string | null
          chapter_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          quote: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_photo_url?: string | null
          author_title?: string | null
          chapter_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          quote?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "global_coaches"
            referencedColumns: ["chapter_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          chapter_id: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "global_coaches"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      global_coaches: {
        Row: {
          bio: string | null
          ce_credits_earned: number | null
          certification_level: string | null
          chapter_id: string | null
          chapter_name: string | null
          chapter_slug: string | null
          city: string | null
          contact_email: string | null
          country: string | null
          full_name: string | null
          hours_logged: number | null
          id: string | null
          languages: string[] | null
          photo_url: string | null
          recertification_due_date: string | null
          specializations: string[] | null
          website: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_any_role_in_chapter: {
        Args: { _chapter_id: string }
        Returns: boolean
      }
      has_role_in_chapter: {
        Args: { _chapter_id: string; _role: string }
        Returns: boolean
      }
      is_advanced_coach_in_chapter: {
        Args: { _chapter_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      get_chapter_payment_metrics: {
        Args: { p_chapter_id: string }
        Returns: {
          total_collected: number
          outstanding: number
          this_month: number
          enrollment_total: number
          certification_total: number
          dues_total: number
          event_total: number
        }[]
      }
      get_chapter_business_metrics: {
        Args: { p_chapter_id: string }
        Returns: {
          active_coaches: number
          upcoming_events: number
          active_subscribers: number
        }[]
      }
      get_global_revenue_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          chapter_id: string
          chapter_name: string
          chapter_status: string
          total_collected: number
          this_month: number
          active_coaches: number
        }[]
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
