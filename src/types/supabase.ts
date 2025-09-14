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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      recurring_logs: {
        Row: {
          date: string
          logged_at: string | null
          recurring_id: string
          user_id: string
        }
        Insert: {
          date: string
          logged_at?: string | null
          recurring_id: string
          user_id: string
        }
        Update: {
          date?: string
          logged_at?: string | null
          recurring_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_logs_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "active_recurring_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_logs_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_tasks: {
        Row: {
          active: boolean | null
          created_at: string | null
          duration_min: number | null
          end_date: string | null
          frequency: string
          id: string
          importance: number | null
          interval_n: number | null
          memo: string | null
          month_day: number | null
          start_date: string
          title: string
          updated_at: string | null
          urls: string[] | null
          user_id: string
          weekdays: number[] | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          duration_min?: number | null
          end_date?: string | null
          frequency: string
          id?: string
          importance?: number | null
          interval_n?: number | null
          memo?: string | null
          month_day?: number | null
          start_date?: string
          title: string
          updated_at?: string | null
          urls?: string[] | null
          user_id: string
          weekdays?: number[] | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          duration_min?: number | null
          end_date?: string | null
          frequency?: string
          id?: string
          importance?: number | null
          interval_n?: number | null
          memo?: string | null
          month_day?: number | null
          start_date?: string
          title?: string
          updated_at?: string | null
          urls?: string[] | null
          user_id?: string
          weekdays?: number[] | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived: boolean | null
          category: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          duration_min: number | null
          id: string
          importance: number | null
          memo: string | null
          snoozed_until: string | null
          title: string
          updated_at: string | null
          urls: string[] | null
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          duration_min?: number | null
          id?: string
          importance?: number | null
          memo?: string | null
          snoozed_until?: string | null
          title: string
          updated_at?: string | null
          urls?: string[] | null
          user_id: string
        }
        Update: {
          archived?: boolean | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          duration_min?: number | null
          id?: string
          importance?: number | null
          memo?: string | null
          snoozed_until?: string | null
          title?: string
          updated_at?: string | null
          urls?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_recurring_tasks: {
        Row: {
          active: boolean | null
          created_at: string | null
          duration_min: number | null
          end_date: string | null
          frequency: string | null
          id: string | null
          importance: number | null
          interval_n: number | null
          memo: string | null
          month_day: number | null
          start_date: string | null
          title: string | null
          updated_at: string | null
          urls: string[] | null
          user_id: string | null
          weekdays: number[] | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          duration_min?: number | null
          end_date?: string | null
          frequency?: string | null
          id?: string | null
          importance?: number | null
          interval_n?: number | null
          memo?: string | null
          month_day?: number | null
          start_date?: string | null
          title?: string | null
          updated_at?: string | null
          urls?: string[] | null
          user_id?: string | null
          weekdays?: number[] | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          duration_min?: number | null
          end_date?: string | null
          frequency?: string | null
          id?: string | null
          importance?: number | null
          interval_n?: number | null
          memo?: string | null
          month_day?: number | null
          start_date?: string | null
          title?: string | null
          updated_at?: string | null
          urls?: string[] | null
          user_id?: string | null
          weekdays?: number[] | null
        }
        Relationships: []
      }
      tasks_with_urgency: {
        Row: {
          archived: boolean | null
          category: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          days_from_today: number | null
          due_date: string | null
          duration_min: number | null
          id: string | null
          importance: number | null
          memo: string | null
          snoozed_until: string | null
          title: string | null
          updated_at: string | null
          urgency: string | null
          urls: string[] | null
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          days_from_today?: never
          due_date?: string | null
          duration_min?: number | null
          id?: string | null
          importance?: number | null
          memo?: string | null
          snoozed_until?: string | null
          title?: string | null
          updated_at?: string | null
          urgency?: never
          urls?: string[] | null
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          days_from_today?: never
          due_date?: string | null
          duration_min?: number | null
          id?: string | null
          importance?: number | null
          memo?: string | null
          snoozed_until?: string | null
          title?: string | null
          updated_at?: string | null
          urgency?: never
          urls?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      today_tasks: {
        Row: {
          archived: boolean | null
          category: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          days_from_today: number | null
          due_date: string | null
          duration_min: number | null
          id: string | null
          importance: number | null
          memo: string | null
          snoozed_until: string | null
          title: string | null
          updated_at: string | null
          urgency: string | null
          urls: string[] | null
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          days_from_today?: never
          due_date?: string | null
          duration_min?: number | null
          id?: string | null
          importance?: number | null
          memo?: string | null
          snoozed_until?: string | null
          title?: string | null
          updated_at?: string | null
          urgency?: never
          urls?: string[] | null
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          days_from_today?: never
          due_date?: string | null
          duration_min?: number | null
          id?: string | null
          importance?: number | null
          memo?: string | null
          snoozed_until?: string | null
          title?: string | null
          updated_at?: string | null
          urgency?: never
          urls?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_task_stats: {
        Row: {
          avg_duration_min: number | null
          completed_tasks: number | null
          overdue_tasks: number | null
          today_tasks: number | null
          total_tasks: number | null
          user_id: string | null
        }
        Relationships: []
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
