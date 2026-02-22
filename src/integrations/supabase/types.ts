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
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          age: number | null
          city: string | null
          country: string | null
          created_at: string | null
          gender: string | null
          id: string
          mobile_number: string | null
          mobile_verified: boolean | null
          name: string
          state: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          mobile_number?: string | null
          mobile_verified?: boolean | null
          name: string
          state?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          mobile_number?: string | null
          mobile_verified?: boolean | null
          name?: string
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_partners: {
        Row: {
          created_at: string | null
          earnings: number | null
          id: string
          is_accepting_orders: boolean | null
          name: string
          phone: string | null
          status: string | null
          total_deliveries: number | null
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          earnings?: number | null
          id?: string
          is_accepting_orders?: boolean | null
          name: string
          phone?: string | null
          status?: string | null
          total_deliveries?: number | null
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          earnings?: number | null
          id?: string
          is_accepting_orders?: boolean | null
          name?: string
          phone?: string | null
          status?: string | null
          total_deliveries?: number | null
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_vegetarian: boolean | null
          name: string
          outlet_id: string
          price: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          outlet_id: string
          price: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          outlet_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          menu_item_id: string | null
          order_id: string
          outlet_id: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          menu_item_id?: string | null
          order_id: string
          outlet_id: string
          price: number
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          menu_item_id?: string | null
          order_id?: string
          outlet_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_partner_id: string | null
          id: string
          outlet_id: string | null
          status: string | null
          total_amount: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_partner_id?: string | null
          id?: string
          outlet_id?: string | null
          status?: string | null
          total_amount: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_partner_id?: string | null
          id?: string
          outlet_id?: string | null
          status?: string | null
          total_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_partner_id_fkey"
            columns: ["delivery_partner_id"]
            isOneToOne: false
            referencedRelation: "delivery_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      outlets: {
        Row: {
          created_at: string | null
          cuisine_type: string | null
          delivery_time: string | null
          description: string | null
          id: string
          image_url: string | null
          is_open: boolean | null
          name: string
          rating: number | null
        }
        Insert: {
          created_at?: string | null
          cuisine_type?: string | null
          delivery_time?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_open?: boolean | null
          name: string
          rating?: number | null
        }
        Update: {
          created_at?: string | null
          cuisine_type?: string | null
          delivery_time?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_open?: boolean | null
          name?: string
          rating?: number | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string | null
          order_id: string
          outlet_id: string
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          order_id: string
          outlet_id: string
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          order_id?: string
          outlet_id?: string
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_partners: {
        Row: {
          contact_phone: string | null
          created_at: string | null
          id: string
          outlet_id: string | null
          restaurant_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          outlet_id?: string | null
          restaurant_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          outlet_id?: string | null
          restaurant_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_partners_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "restaurant_partner" | "delivery_partner" | "customer"
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
      app_role: ["admin", "restaurant_partner", "delivery_partner", "customer"],
    },
  },
} as const
