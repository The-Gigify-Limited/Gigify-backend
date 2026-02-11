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
      activities: {
        Row: {
          created_at: string | null
          event_type: Database["public"]["Enums"]["activity_type"]
          id: string
          metadata: Json | null
          reference_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: Database["public"]["Enums"]["activity_type"]
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: Database["public"]["Enums"]["activity_type"]
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          resource_id: string
          resource_type: string
          result: Database["public"]["Enums"]["audit_result"]
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          resource_id: string
          resource_type: string
          result?: Database["public"]["Enums"]["audit_result"]
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string
          resource_type?: string
          result?: Database["public"]["Enums"]["audit_result"]
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_profiles: {
        Row: {
          company_website: string | null
          id: string
          industry: string | null
          organization_name: string | null
          total_gigs_posted: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_website?: string | null
          id?: string
          industry?: string | null
          organization_name?: string | null
          total_gigs_posted?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_website?: string | null
          id?: string
          industry?: string | null
          organization_name?: string | null
          total_gigs_posted?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          budget_amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          employer_id: string
          gig_date: string
          id: string
          is_remote: boolean | null
          location_name: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["gig_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget_amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employer_id: string
          gig_date: string
          id?: string
          is_remote?: boolean | null
          location_name?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["gig_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget_amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employer_id?: string
          gig_date?: string
          id?: string
          is_remote?: boolean | null
          location_name?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["gig_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gigs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      services_catalog: {
        Row: {
          category: string | null
          created_at: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      talent_portfolios: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          portfolio_url: string
          talent_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          portfolio_url: string
          talent_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          portfolio_url?: string
          talent_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "talent_portfolios_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          banner_url: string | null
          biography: string | null
          date_of_birth: string | null
          id: string
          max_rate: number | null
          min_rate: number
          primary_role: string | null
          rate_currency: string
          skills: Json[] | null
          stage_name: string | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          banner_url?: string | null
          biography?: string | null
          date_of_birth?: string | null
          id?: string
          max_rate?: number | null
          min_rate?: number
          primary_role?: string | null
          rate_currency?: string
          skills?: Json[] | null
          stage_name?: string | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          banner_url?: string | null
          biography?: string | null
          date_of_birth?: string | null
          id?: string
          max_rate?: number | null
          min_rate?: number
          primary_role?: string | null
          rate_currency?: string
          skills?: Json[] | null
          stage_name?: string | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          gig_id: string | null
          id: string
          rating: number
          reviewer_id: string | null
          talent_id: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          gig_id?: string | null
          id?: string
          rating: number
          reviewer_id?: string | null
          talent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          gig_id?: string | null
          id?: string
          rating?: number
          reviewer_id?: string | null
          talent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_reviews_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_services: {
        Row: {
          service_id: string
          talent_id: string
          years_experience: number | null
        }
        Insert: {
          service_id: string
          talent_id: string
          years_experience?: number | null
        }
        Update: {
          service_id?: string
          talent_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_services_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          full_address: string | null
          id: string
          is_verified: boolean | null
          last_name: string | null
          location_city: string | null
          location_country: string | null
          onboarding_step: number | null
          phone_number: string | null
          post_code: number | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_address?: string | null
          id: string
          is_verified?: boolean | null
          last_name?: string | null
          location_city?: string | null
          location_country?: string | null
          onboarding_step?: number | null
          phone_number?: string | null
          post_code?: number | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_address?: string | null
          id?: string
          is_verified?: boolean | null
          last_name?: string | null
          location_city?: string | null
          location_country?: string | null
          onboarding_step?: number | null
          phone_number?: string | null
          post_code?: number | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist_users: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: number
          last_name: string | null
          location: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          location?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          location?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_talent_avg_rating: { Args: { tid: string }; Returns: number }
      get_talent_rating_summary_full: {
        Args: { tid: string }
        Returns: {
          count: number
          rating: number
        }[]
      }
    }
    Enums: {
      activity_type:
        | "user_joined"
        | "gig_posted"
        | "gig_applied"
        | "gig_started"
        | "gig_completed"
        | "payment_received"
        | "payout_requested"
        | "review_posted"
      audit_result: "success" | "failure"
      gig_status: "draft" | "open" | "in_progress" | "completed" | "cancelled"
      user_role: "talent" | "employer" | "admin"
      user_status: "active" | "suspended"
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
      activity_type: [
        "user_joined",
        "gig_posted",
        "gig_applied",
        "gig_started",
        "gig_completed",
        "payment_received",
        "payout_requested",
        "review_posted",
      ],
      audit_result: ["success", "failure"],
      gig_status: ["draft", "open", "in_progress", "completed", "cancelled"],
      user_role: ["talent", "employer", "admin"],
      user_status: ["active", "suspended"],
    },
  },
} as const
