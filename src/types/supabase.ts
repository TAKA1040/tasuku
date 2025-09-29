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
      done: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          original_category: string | null
          original_display_number: string | null
          original_due_date: string | null
          original_importance: string | null
          original_memo: string | null
          original_recurring_pattern: string | null
          original_task_id: string
          original_title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          original_category?: string | null
          original_display_number?: string | null
          original_due_date?: string | null
          original_importance?: string | null
          original_memo?: string | null
          original_recurring_pattern?: string | null
          original_task_id: string
          original_title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          original_category?: string | null
          original_display_number?: string | null
          original_due_date?: string | null
          original_importance?: string | null
          original_memo?: string | null
          original_recurring_pattern?: string | null
          original_task_id?: string
          original_title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ideas: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_templates: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          day_of_month: number | null
          day_of_year: number | null
          id: string
          importance: number | null
          memo: string | null
          month_of_year: number | null
          pattern: string
          title: string
          updated_at: string | null
          urls: string[]
          user_id: string
          weekdays: number[] | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_year?: number | null
          id?: string
          importance?: number | null
          memo?: string | null
          month_of_year?: number | null
          pattern: string
          title: string
          updated_at?: string | null
          urls?: string[]
          user_id: string
          weekdays?: number[] | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_year?: number | null
          id?: string
          importance?: number | null
          memo?: string | null
          month_of_year?: number | null
          pattern?: string
          title?: string
          updated_at?: string | null
          urls?: string[]
          user_id?: string
          weekdays?: number[] | null
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          parent_task_id: string
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          parent_task_id: string
          sort_order?: number
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          parent_task_id?: string
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      unified_tasks: {
        Row: {
          active: boolean | null
          archived: boolean | null
          attachment: Json | null
          category: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          display_number: string
          due_date: string | null
          duration_min: number | null
          end_date: string | null
          end_time: string | null
          frequency: string | null
          id: string
          importance: number | null
          interval_n: number | null
          last_completed_date: string | null
          memo: string | null
          month_day: number | null
          recurring_day: number | null
          recurring_month: number | null
          recurring_pattern: string | null
          recurring_template_id: string | null
          recurring_weekdays: number[] | null
          snoozed_until: string | null
          start_date: string | null
          start_time: string | null
          task_type: string
          title: string
          updated_at: string | null
          urls: string[]
          user_id: string
          weekdays: number[] | null
        }
        Insert: {
          active?: boolean | null
          archived?: boolean | null
          attachment?: Json | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          display_number: string
          due_date?: string | null
          duration_min?: number | null
          end_date?: string | null
          end_time?: string | null
          frequency?: string | null
          id?: string
          importance?: number | null
          interval_n?: number | null
          last_completed_date?: string | null
          memo?: string | null
          month_day?: number | null
          recurring_day?: number | null
          recurring_month?: number | null
          recurring_pattern?: string | null
          recurring_template_id?: string | null
          recurring_weekdays?: number[] | null
          snoozed_until?: string | null
          start_date?: string | null
          start_time?: string | null
          task_type?: string
          title: string
          updated_at?: string | null
          urls?: string[]
          user_id: string
          weekdays?: number[] | null
        }
        Update: {
          active?: boolean | null
          archived?: boolean | null
          attachment?: Json | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          display_number?: string
          due_date?: string | null
          duration_min?: number | null
          end_date?: string | null
          end_time?: string | null
          frequency?: string | null
          id?: string
          importance?: number | null
          interval_n?: number | null
          last_completed_date?: string | null
          memo?: string | null
          month_day?: number | null
          recurring_day?: number | null
          recurring_month?: number | null
          recurring_pattern?: string | null
          recurring_template_id?: string | null
          recurring_weekdays?: number[] | null
          snoozed_until?: string | null
          start_date?: string | null
          start_time?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
          urls?: string[]
          user_id?: string
          weekdays?: number[] | null
        }
        Relationships: []
      }
      user_metadata: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          features: Json
          id: string
          timezone: string
          updated_at: string
          urgency_thresholds: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          timezone?: string
          updated_at?: string
          urgency_thresholds?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          timezone?: string
          updated_at?: string
          urgency_thresholds?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_duplicates: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          duplicate_key: string
          table_name: string
        }[]
      }
      check_task_duplicates: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          duplicate_key: string
        }[]
      }
      complete_migration_to_unified: {
        Args: Record<PropertyKey, never>
        Returns: {
          recurring_errors: number
          recurring_migrated: number
          tasks_errors: number
          tasks_migrated: number
          total_migrated: number
        }[]
      }
      generate_display_number: {
        Args: { p_date?: string; p_task_type: string; p_user_id: string }
        Returns: string
      }
      get_cleanup_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          record_count: number
          sample_titles: string[]
          table_name: string
        }[]
      }
      get_table_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          record_count: number
          table_name: string
        }[]
      }
      migrate_recurring_tasks_to_unified: {
        Args: Record<PropertyKey, never>
        Returns: {
          error_count: number
          migrated_count: number
        }[]
      }
      migrate_tasks_to_unified: {
        Args: Record<PropertyKey, never>
        Returns: {
          error_count: number
          migrated_count: number
        }[]
      }
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
