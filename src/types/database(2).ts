export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type VisitStatus =
  | 'visitado_sem_foco'
  | 'visitado_com_achado'
  | 'fechado'
  | 'recusado'
  | 'nao_localizado'
  | 'pendente_revisao'

export type UserRole = 'agent' | 'coordinator' | 'manager' | 'admin'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: UserRole
          sector_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: UserRole
          sector_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: UserRole
          sector_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          id: string
          name: string
          code: string
          coordinator_id: string | null
          geometry: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          coordinator_id?: string | null
          geometry?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          coordinator_id?: string | null
          geometry?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          id: string
          address: string
          sector_id: string
          lat: number | null
          lng: number | null
          owner_name: string | null
          owner_phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          address: string
          sector_id: string
          lat?: number | null
          lng?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          address?: string
          sector_id?: string
          lat?: number | null
          lng?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          created_at?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          id: string
          property_id: string
          agent_id: string
          status: VisitStatus
          notes: string | null
          lat: number | null
          lng: number | null
          visited_at: string | null
          synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          agent_id: string
          status: VisitStatus
          notes?: string | null
          lat?: number | null
          lng?: number | null
          visited_at?: string | null
          synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          agent_id?: string
          status?: VisitStatus
          notes?: string | null
          lat?: number | null
          lng?: number | null
          visited_at?: string | null
          synced_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      evidences: {
        Row: {
          id: string
          visit_id: string
          type: 'photo' | 'video'
          url: string
          thumbnail_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          visit_id: string
          type?: 'photo' | 'video'
          url: string
          thumbnail_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          visit_id?: string
          type?: 'photo' | 'video'
          url?: string
          thumbnail_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity: string
          entity_id: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity: string
          entity_id: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity?: string
          entity_id?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_visit_summary: {
        Row: {
          id: string
          status: VisitStatus
          visited_at: string | null
          synced_at: string | null
          address: string
          sector_id: string
          sector_name: string
          sector_code: string
          agent_name: string
          agent_role: UserRole
          evidence_count: number
        }
      }
      vw_sector_stats: {
        Row: {
          sector_id: string
          sector_name: string
          sector_code: string
          day: string
          total_visits: number
          with_findings: number
          without_findings: number
          refused: number
          closed: number
          not_found: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: {
      visit_status: VisitStatus
    }
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Sector = Database['public']['Tables']['sectors']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type Visit = Database['public']['Tables']['visits']['Row']
export type Evidence = Database['public']['Tables']['evidences']['Row']
