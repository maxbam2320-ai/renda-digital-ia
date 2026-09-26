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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_history: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      first_sale_plans: {
        Row: {
          created_at: string
          duration: number
          id: string
          progress: number
          strategy: string | null
          tasks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          progress?: number
          strategy?: string | null
          tasks?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          progress?: number
          strategy?: string | null
          tasks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          platform: string
          result: Json
          topic: string | null
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id?: string
          platform: string
          result?: Json
          topic?: string | null
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          platform?: string
          result?: Json
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_offers: {
        Row: {
          audience: string | null
          benefit: string | null
          created_at: string
          id: string
          price: string | null
          problem: string | null
          product: string | null
          result: Json
          user_id: string
        }
        Insert: {
          audience?: string | null
          benefit?: string | null
          created_at?: string
          id?: string
          price?: string | null
          problem?: string | null
          product?: string | null
          result?: Json
          user_id: string
        }
        Update: {
          audience?: string | null
          benefit?: string | null
          created_at?: string
          id?: string
          price?: string | null
          problem?: string | null
          product?: string | null
          result?: Json
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current: number
          deadline: string | null
          goal_type: string
          id: string
          target: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current?: number
          deadline?: string | null
          goal_type: string
          id?: string
          target?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          target?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding: {
        Row: {
          available_time: string | null
          completed: boolean
          created_at: string
          experience_level: string | null
          id: string
          main_goal: string | null
          monthly_goal: number
          niche: string | null
          preferred_channels: string[]
          product_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_time?: string | null
          completed?: boolean
          created_at?: string
          experience_level?: string | null
          id?: string
          main_goal?: string | null
          monthly_goal?: number
          niche?: string | null
          preferred_channels?: string[]
          product_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_time?: string | null
          completed?: boolean
          created_at?: string
          experience_level?: string | null
          id?: string
          main_goal?: string | null
          monthly_goal?: number
          niche?: string | null
          preferred_channels?: string[]
          product_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          first_steps: Json
          id: string
          requirements: string | null
          strategy: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          first_steps?: Json
          id?: string
          requirements?: string | null
          strategy?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          first_steps?: Json
          id?: string
          requirements?: string | null
          strategy?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          current_stage: number
          description: string | null
          id: string
          progress: number
          strategy: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_stage?: number
          description?: string | null
          id?: string
          progress?: number
          strategy?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_stage?: number
          description?: string | null
          id?: string
          progress?: number
          strategy?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_seen_at: string
          provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string
          provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string
          provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_strategies: {
        Row: {
          channel: string | null
          context: string | null
          created_at: string
          id: string
          result: Json
          user_id: string
        }
        Insert: {
          channel?: string | null
          context?: string | null
          created_at?: string
          id?: string
          result?: Json
          user_id: string
        }
        Update: {
          channel?: string | null
          context?: string | null
          created_at?: string
          id?: string
          result?: Json
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_time: string | null
          id: string
          priority: string
          source: string
          stage: number | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_time?: string | null
          id?: string
          priority?: string
          source?: string
          stage?: number | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_time?: string | null
          id?: string
          priority?: string
          source?: string
          stage?: number | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
