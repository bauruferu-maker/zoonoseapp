export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type VisitStatus =
  | 'visitado_sem_foco'
  | 'visitado_com_achado'
  | 'fechado'
  | 'recusado'
  | 'nao_localizado'
  | 'pendente_revisao'

export type UserRole = 'agent' | 'coordinator' | 'manager' | 'admin'

export interface VisitType {
  id: string
  name: 'rotina' | 'retorno' | 'denuncia'
  description: string | null
}

export interface FocusType {
  id: string
  name: string
  description: string | null
}

export interface ActionTaken {
  id: string
  name: string
  description: string | null
}

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
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['sectors']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['sectors']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['properties']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
      }
      visits: {
        Row: {
          id: string
          property_id: string
          agent_id: string
          status: VisitStatus
          visit_type_id: string | null
          focus_type_id: string | null
          action_taken_id: string | null
          notes: string | null
          lat: number | null
          lng: number | null
          visited_at: string | null
          synced_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['visits']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['visits']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['evidences']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['evidences']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Sector = Database['public']['Tables']['sectors']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type Visit = Database['public']['Tables']['visits']['Row']
export type Evidence = Database['public']['Tables']['evidences']['Row']
