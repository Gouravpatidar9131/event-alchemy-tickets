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
      attendance: {
        Row: {
          attendee_id: string
          check_in_location: string | null
          checked_in_at: string
          checked_in_by: string | null
          created_at: string
          device_info: Json | null
          event_id: string
          id: string
          nft_metadata_uri: string | null
          nft_mint_address: string | null
          nft_minted_at: string | null
          nft_status: string | null
          qr_code_data: Json | null
          ticket_id: string
        }
        Insert: {
          attendee_id: string
          check_in_location?: string | null
          checked_in_at?: string
          checked_in_by?: string | null
          created_at?: string
          device_info?: Json | null
          event_id: string
          id?: string
          nft_metadata_uri?: string | null
          nft_mint_address?: string | null
          nft_minted_at?: string | null
          nft_status?: string | null
          qr_code_data?: Json | null
          ticket_id: string
        }
        Update: {
          attendee_id?: string
          check_in_location?: string | null
          checked_in_at?: string
          checked_in_by?: string | null
          created_at?: string
          device_info?: Json | null
          event_id?: string
          id?: string
          nft_metadata_uri?: string | null
          nft_mint_address?: string | null
          nft_minted_at?: string | null
          nft_status?: string | null
          qr_code_data?: Json | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          candy_machine_id: string | null
          created_at: string | null
          creator_id: string
          date: string
          description: string
          id: string
          image_url: string | null
          is_published: boolean | null
          location: string
          mint_address: string | null
          nft_artwork_url: string | null
          nft_collection_name: string | null
          nft_description_template: string | null
          nft_enabled: boolean | null
          price: number
          tickets_sold: number | null
          title: string
          total_tickets: number
          updated_at: string | null
        }
        Insert: {
          candy_machine_id?: string | null
          created_at?: string | null
          creator_id: string
          date: string
          description: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location: string
          mint_address?: string | null
          nft_artwork_url?: string | null
          nft_collection_name?: string | null
          nft_description_template?: string | null
          nft_enabled?: boolean | null
          price: number
          tickets_sold?: number | null
          title: string
          total_tickets: number
          updated_at?: string | null
        }
        Update: {
          candy_machine_id?: string | null
          created_at?: string | null
          creator_id?: string
          date?: string
          description?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string
          mint_address?: string | null
          nft_artwork_url?: string | null
          nft_collection_name?: string | null
          nft_description_template?: string | null
          nft_enabled?: boolean | null
          price?: number
          tickets_sold?: number | null
          title?: string
          total_tickets?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      nft_collections: {
        Row: {
          base_metadata_uri: string | null
          collection_description: string | null
          collection_name: string
          collection_symbol: string
          contract_address_base: string | null
          contract_address_ethereum: string | null
          contract_address_polygon: string | null
          created_at: string
          event_id: string
          id: string
          opensea_collection_slug: string | null
          updated_at: string
        }
        Insert: {
          base_metadata_uri?: string | null
          collection_description?: string | null
          collection_name: string
          collection_symbol: string
          contract_address_base?: string | null
          contract_address_ethereum?: string | null
          contract_address_polygon?: string | null
          created_at?: string
          event_id: string
          id?: string
          opensea_collection_slug?: string | null
          updated_at?: string
        }
        Update: {
          base_metadata_uri?: string | null
          collection_description?: string | null
          collection_name?: string
          collection_symbol?: string
          contract_address_base?: string | null
          contract_address_ethereum?: string | null
          contract_address_polygon?: string | null
          created_at?: string
          event_id?: string
          id?: string
          opensea_collection_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_collections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          event_id: string
          events_attended: number | null
          is_event_creator: boolean | null
          loyalty_points: number | null
          monad_wallet_address: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          event_id: string
          events_attended?: number | null
          is_event_creator?: boolean | null
          loyalty_points?: number | null
          monad_wallet_address?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          event_id?: string
          events_attended?: number | null
          is_event_creator?: boolean | null
          loyalty_points?: number | null
          monad_wallet_address?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          checked_in_at: string | null
          event_id: string
          id: string
          metadata: Json | null
          mint_address: string | null
          owner_id: string
          purchase_date: string | null
          purchase_price: number
          qr_code_data: Json | null
          qr_code_generated_at: string | null
          status: string
          token_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          event_id: string
          id?: string
          metadata?: Json | null
          mint_address?: string | null
          owner_id: string
          purchase_date?: string | null
          purchase_price: number
          qr_code_data?: Json | null
          qr_code_generated_at?: string | null
          status?: string
          token_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          event_id?: string
          id?: string
          metadata?: Json | null
          mint_address?: string | null
          owner_id?: string
          purchase_date?: string | null
          purchase_price?: number
          qr_code_data?: Json | null
          qr_code_generated_at?: string | null
          status?: string
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tickets_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tickets_owner_profiles"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
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
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
