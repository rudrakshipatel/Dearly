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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          card_id: string | null
          cost_usd: number | null
          created_at: string
          generation_type: Database["public"]["Enums"]["ai_generation_type"]
          id: string
          input_metadata: Json
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          provider: string | null
          status: Database["public"]["Enums"]["ai_generation_status"]
          user_id: string
        }
        Insert: {
          card_id?: string | null
          cost_usd?: number | null
          created_at?: string
          generation_type: Database["public"]["Enums"]["ai_generation_type"]
          id?: string
          input_metadata?: Json
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          status: Database["public"]["Enums"]["ai_generation_status"]
          user_id: string
        }
        Update: {
          card_id?: string | null
          cost_usd?: number | null
          created_at?: string
          generation_type?: Database["public"]["Enums"]["ai_generation_type"]
          id?: string
          input_metadata?: Json
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          status?: Database["public"]["Enums"]["ai_generation_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_collaborators: {
        Row: {
          card_id: string
          id: string
          invited_at: string
          permission: Database["public"]["Enums"]["collaborator_permission"]
          user_id: string
        }
        Insert: {
          card_id: string
          id?: string
          invited_at?: string
          permission: Database["public"]["Enums"]["collaborator_permission"]
          user_id: string
        }
        Update: {
          card_id?: string
          id?: string
          invited_at?: string
          permission?: Database["public"]["Enums"]["collaborator_permission"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_collaborators_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_media: {
        Row: {
          card_id: string | null
          created_at: string
          duration: number | null
          file_size: number
          height: number | null
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          mime_type: string
          original_filename: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["media_status"]
          storage_path: string
          thumbnail_path: string | null
          width: number | null
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          duration?: number | null
          file_size: number
          height?: number | null
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          mime_type: string
          original_filename?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["media_status"]
          storage_path: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Update: {
          card_id?: string | null
          created_at?: string
          duration?: number | null
          file_size?: number
          height?: number | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          mime_type?: string
          original_filename?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["media_status"]
          storage_path?: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_media_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_media_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_reactions: {
        Row: {
          card_id: string
          created_at: string
          id: string
          message: string | null
          photo_path: string | null
          reaction_type: string
          seen_at: string | null
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          message?: string | null
          photo_path?: string | null
          reaction_type: string
          seen_at?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          message?: string | null
          photo_path?: string | null
          reaction_type?: string
          seen_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_reactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_reports: {
        Row: {
          card_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          card_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          card_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "card_reports_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_views: {
        Row: {
          card_id: string
          completed_at: string | null
          id: string
          interaction_summary: Json
          opened_at: string
          viewer_session_id: string
        }
        Insert: {
          card_id: string
          completed_at?: string | null
          id?: string
          interaction_summary?: Json
          opened_at?: string
          viewer_session_id: string
        }
        Update: {
          card_id?: string
          completed_at?: string | null
          id?: string
          interaction_summary?: Json
          opened_at?: string
          viewer_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_views_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          allow_reactions: boolean
          allow_response_photo: boolean
          card_data: Json
          contribution_deadline: string | null
          contribution_limit: number | null
          contribution_token: string | null
          contributions_require_approval: boolean
          created_at: string
          disabled_reason: string | null
          experience_type: Database["public"]["Enums"]["experience_type"]
          expires_at: string | null
          id: string
          is_disabled: boolean
          is_sample: boolean
          last_opened_at: string | null
          occasion_id: string | null
          owner_id: string | null
          password_hash: string | null
          published_at: string | null
          recipient_email: string | null
          recipient_name: string
          scheduled_at: string | null
          schema_version: number
          sender_name: string
          show_branding: boolean
          slug: string
          status: Database["public"]["Enums"]["card_status"]
          template_id: string | null
          timezone: string | null
          title: string
          updated_at: string
          version: number
          view_count: number
        }
        Insert: {
          allow_reactions?: boolean
          allow_response_photo?: boolean
          card_data: Json
          contribution_deadline?: string | null
          contribution_limit?: number | null
          contribution_token?: string | null
          contributions_require_approval?: boolean
          created_at?: string
          disabled_reason?: string | null
          experience_type: Database["public"]["Enums"]["experience_type"]
          expires_at?: string | null
          id?: string
          is_disabled?: boolean
          is_sample?: boolean
          last_opened_at?: string | null
          occasion_id?: string | null
          owner_id?: string | null
          password_hash?: string | null
          published_at?: string | null
          recipient_email?: string | null
          recipient_name?: string
          scheduled_at?: string | null
          schema_version?: number
          sender_name?: string
          show_branding?: boolean
          slug: string
          status?: Database["public"]["Enums"]["card_status"]
          template_id?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string
          version?: number
          view_count?: number
        }
        Update: {
          allow_reactions?: boolean
          allow_response_photo?: boolean
          card_data?: Json
          contribution_deadline?: string | null
          contribution_limit?: number | null
          contribution_token?: string | null
          contributions_require_approval?: boolean
          created_at?: string
          disabled_reason?: string | null
          experience_type?: Database["public"]["Enums"]["experience_type"]
          expires_at?: string | null
          id?: string
          is_disabled?: boolean
          is_sample?: boolean
          last_opened_at?: string | null
          occasion_id?: string | null
          owner_id?: string | null
          password_hash?: string | null
          published_at?: string | null
          recipient_email?: string | null
          recipient_name?: string
          scheduled_at?: string | null
          schema_version?: number
          sender_name?: string
          show_branding?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["card_status"]
          template_id?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string
          version?: number
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "cards_occasion_id_fkey"
            columns: ["occasion_id"]
            isOneToOne: false
            referencedRelation: "occasions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          id: string
          message: string
          name: string
          topic: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          id?: string
          message: string
          name: string
          topic: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          id?: string
          message?: string
          name?: string
          topic?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_jobs: {
        Row: {
          attempts: number
          card_id: string
          created_at: string
          delivery_email: string | null
          error_message: string | null
          id: string
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          card_id: string
          created_at?: string
          delivery_email?: string | null
          error_message?: string | null
          id?: string
          scheduled_at: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          card_id?: string
          created_at?: string
          delivery_email?: string | null
          error_message?: string | null
          id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_jobs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      group_contributions: {
        Row: {
          approved_at: string | null
          card_id: string
          color: string
          contributor_name: string
          contributor_session: string | null
          id: string
          media_references: Json
          message: string
          status: Database["public"]["Enums"]["contribution_status"]
          submitted_at: string
        }
        Insert: {
          approved_at?: string | null
          card_id: string
          color?: string
          contributor_name: string
          contributor_session?: string | null
          id?: string
          media_references?: Json
          message: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_at?: string
        }
        Update: {
          approved_at?: string | null
          card_id?: string
          color?: string
          contributor_name?: string
          contributor_session?: string | null
          id?: string
          media_references?: Json
          message?: string
          status?: Database["public"]["Enums"]["contribution_status"]
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_contributions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          consented_at: string
          email: string
          unsubscribed_at: string | null
        }
        Insert: {
          consented_at?: string
          email: string
          unsubscribed_at?: string | null
        }
        Update: {
          consented_at?: string
          email?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      occasions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          theme_config: Json
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          theme_config?: Json
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          theme_config?: Json
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
          provider: Database["public"]["Enums"]["payment_provider"]
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string
          provider: Database["public"]["Enums"]["payment_provider"]
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          ai_generations_per_month: number
          allow_premium_templates: boolean
          allow_remove_branding: boolean
          allow_scheduling: boolean
          allow_video_audio: boolean
          max_audio_bytes: number
          max_group_contributors: number
          max_image_bytes: number
          max_live_cards: number
          max_pages: number
          max_photos_per_card: number
          max_video_bytes: number
          max_video_seconds: number
          plan: Database["public"]["Enums"]["plan_tier"]
          storage_bytes: number
        }
        Insert: {
          ai_generations_per_month: number
          allow_premium_templates: boolean
          allow_remove_branding: boolean
          allow_scheduling: boolean
          allow_video_audio: boolean
          max_audio_bytes: number
          max_group_contributors: number
          max_image_bytes: number
          max_live_cards: number
          max_pages: number
          max_photos_per_card: number
          max_video_bytes: number
          max_video_seconds: number
          plan: Database["public"]["Enums"]["plan_tier"]
          storage_bytes: number
        }
        Update: {
          ai_generations_per_month?: number
          allow_premium_templates?: boolean
          allow_remove_branding?: boolean
          allow_scheduling?: boolean
          allow_video_audio?: boolean
          max_audio_bytes?: number
          max_group_contributors?: number
          max_image_bytes?: number
          max_live_cards?: number
          max_pages?: number
          max_photos_per_card?: number
          max_video_bytes?: number
          max_video_seconds?: number
          plan?: Database["public"]["Enums"]["plan_tier"]
          storage_bytes?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_currency: string | null
          preferred_language: string
          role: string
          suspended_at: string | null
          suspension_reason: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          preferred_currency?: string | null
          preferred_language?: string
          role?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_currency?: string | null
          preferred_language?: string
          role?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          card_id: string | null
          created_at: string
          currency: string
          id: string
          product_type: Database["public"]["Enums"]["purchase_product"]
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id: string
          status: Database["public"]["Enums"]["purchase_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id?: string | null
          created_at?: string
          currency: string
          id?: string
          product_type: Database["public"]["Enums"]["purchase_product"]
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id: string
          status?: Database["public"]["Enums"]["purchase_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          product_type?: Database["public"]["Enums"]["purchase_product"]
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id?: string
          status?: Database["public"]["Enums"]["purchase_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count: number
          key: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      received_cards: {
        Row: {
          card_id: string
          first_opened_at: string
          last_opened_at: string
          saved: boolean
          user_id: string
        }
        Insert: {
          card_id: string
          first_opened_at?: string
          last_opened_at?: string
          saved?: boolean
          user_id: string
        }
        Update: {
          card_id?: string
          first_opened_at?: string
          last_opened_at?: string
          saved?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "received_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "received_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_customer_id: string | null
          provider_subscription_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan: Database["public"]["Enums"]["plan_tier"]
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_customer_id?: string | null
          provider_subscription_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_customer_id?: string | null
          provider_subscription_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          default_card_data: Json
          description: string | null
          experience_type: Database["public"]["Enums"]["experience_type"]
          id: string
          is_premium: boolean
          is_published: boolean
          name: string
          occasion_id: string
          preview_data: Json
          slug: string
          style_category: string
          supported_interactions: Json
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_card_data?: Json
          description?: string | null
          experience_type: Database["public"]["Enums"]["experience_type"]
          id?: string
          is_premium?: boolean
          is_published?: boolean
          name: string
          occasion_id: string
          preview_data?: Json
          slug: string
          style_category: string
          supported_interactions?: Json
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_card_data?: Json
          description?: string | null
          experience_type?: Database["public"]["Enums"]["experience_type"]
          id?: string
          is_premium?: boolean
          is_published?: boolean
          name?: string
          occasion_id?: string
          preview_data?: Json
          slug?: string
          style_category?: string
          supported_interactions?: Json
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_occasion_id_fkey"
            columns: ["occasion_id"]
            isOneToOne: false
            referencedRelation: "occasions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abandoned_media: {
        Args: { p_limit?: number; p_older_than_hours?: number }
        Returns: {
          id: string
          storage_path: string
          thumbnail_path: string
        }[]
      }
      admin_list_users: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          card_count: number
          created_at: string
          display_name: string
          email: string
          id: string
          last_sign_in_at: string
          plan: Database["public"]["Enums"]["plan_tier"]
          role: string
          suspended_at: string
        }[]
      }
      admin_moderate_card: {
        Args: {
          p_card_id: string
          p_disable: boolean
          p_reason?: string
          p_report_id?: string
        }
        Returns: undefined
      }
      admin_reports: {
        Args: {
          p_limit?: number
          p_status?: Database["public"]["Enums"]["report_status"]
        }
        Returns: {
          card_disabled: boolean
          card_id: string
          created_at: string
          details: string
          id: string
          owner_email: string
          reason: string
          report_count: number
          slug: string
          status: Database["public"]["Enums"]["report_status"]
          title: string
        }[]
      }
      admin_set_suspension: {
        Args: { p_reason?: string; p_suspend: boolean; p_user: string }
        Returns: undefined
      }
      admin_stats: { Args: never; Returns: Json }
      can_edit_card: { Args: { p_card_id: string }; Returns: boolean }
      claim_due_deliveries: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          card_id: string
          delivery_email: string
          job_id: string
          recipient_name: string
          sender_name: string
          slug: string
          title: string
        }[]
      }
      collaborates_on: { Args: { p_card_id: string }; Returns: boolean }
      complete_card_view: {
        Args: { p_session: string; p_summary: Json; p_view_id: string }
        Returns: undefined
      }
      finish_delivery: {
        Args: { p_error?: string; p_job_id: string; p_ok: boolean }
        Returns: undefined
      }
      get_card_share_meta: { Args: { p_slug: string }; Returns: Json }
      get_contribution_invite: { Args: { p_token: string }; Returns: Json }
      get_public_card: {
        Args: { p_password?: string; p_slug: string }
        Returns: Json
      }
      get_public_media_paths: {
        Args: { p_ids: string[]; p_slug: string }
        Returns: {
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          storage_path: string
          thumbnail_path: string
        }[]
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      mark_card_received: {
        Args: { p_saved?: boolean; p_slug: string }
        Returns: undefined
      }
      my_plan: {
        Args: never
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
      my_received_cards: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          motif: string
          occasion: string
          opened_at: string
          palette: string
          received_at: string
          saved: boolean
          sender_name: string
          slug: string
          title: string
        }[]
      }
      my_unreferenced_media: { Args: { p_ids: string[] }; Returns: string[] }
      new_card_slug: { Args: never; Returns: string }
      owns_card: { Args: { p_card_id: string }; Returns: boolean }
      plan_for: {
        Args: { p_user: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
      prune_rate_limits: { Args: never; Returns: number }
      publish_card: {
        Args: {
          p_card_id: string
          p_delivery_email?: string
          p_scheduled_at?: string
          p_timezone?: string
        }
        Returns: Json
      }
      rate_limit_self: {
        Args: { p_bucket: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      record_card_view: {
        Args: { p_session: string; p_slug: string }
        Returns: string
      }
      regenerate_contribution_token: {
        Args: { p_card_id: string }
        Returns: string
      }
      report_card: {
        Args: { p_details?: string; p_reason: string; p_slug: string }
        Returns: undefined
      }
      set_card_password: {
        Args: { p_card_id: string; p_password: string }
        Returns: undefined
      }
      submit_contact: {
        Args: {
          p_email: string
          p_message: string
          p_name: string
          p_topic: string
        }
        Returns: undefined
      }
      submit_contribution: {
        Args: {
          p_color?: string
          p_media?: Json
          p_message: string
          p_name: string
          p_session: string
          p_token: string
        }
        Returns: Json
      }
      submit_reaction: {
        Args: {
          p_message?: string
          p_photo_path?: string
          p_session: string
          p_slug: string
          p_type: string
        }
        Returns: string
      }
      subscribe_newsletter: { Args: { p_email: string }; Returns: undefined }
      unpublish_card: {
        Args: { p_archive?: boolean; p_card_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ai_generation_status: "succeeded" | "failed" | "blocked"
      ai_generation_type: "message" | "poem" | "story" | "caption" | "design"
      card_status: "draft" | "published" | "scheduled" | "archived"
      collaborator_permission: "owner" | "editor" | "contributor"
      contribution_status: "pending" | "approved" | "rejected"
      delivery_status: "scheduled" | "sending" | "sent" | "failed" | "cancelled"
      experience_type:
        | "letter"
        | "surprise"
        | "memories"
        | "reveal"
        | "together"
        | "classic"
        | "video"
      media_status: "pending" | "ready"
      media_type: "image" | "video" | "audio"
      payment_provider: "stripe" | "razorpay"
      plan_tier: "free" | "premium" | "pro"
      purchase_product: "premium_card" | "group_card" | "special_experience"
      purchase_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      report_status: "open" | "actioned" | "dismissed"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "expired"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      ai_generation_status: ["succeeded", "failed", "blocked"],
      ai_generation_type: ["message", "poem", "story", "caption", "design"],
      card_status: ["draft", "published", "scheduled", "archived"],
      collaborator_permission: ["owner", "editor", "contributor"],
      contribution_status: ["pending", "approved", "rejected"],
      delivery_status: ["scheduled", "sending", "sent", "failed", "cancelled"],
      experience_type: [
        "letter",
        "surprise",
        "memories",
        "reveal",
        "together",
        "classic",
        "video",
      ],
      media_status: ["pending", "ready"],
      media_type: ["image", "video", "audio"],
      payment_provider: ["stripe", "razorpay"],
      plan_tier: ["free", "premium", "pro"],
      purchase_product: ["premium_card", "group_card", "special_experience"],
      purchase_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      report_status: ["open", "actioned", "dismissed"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "expired",
      ],
    },
  },
} as const
