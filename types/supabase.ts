/** Supabase uchun tip xaritasi (schema.sql bilan mos keladi). */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "viewer";

export type StudentGender = "male" | "female" | "other" | "unknown";
export type StudentStatus = "active" | "inactive" | "transferred";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          created_at: string;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      schools: {
        Row: {
          id: string;
          name: string;
          director: string;
          phone: string;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          director?: string;
          phone?: string;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          director?: string;
          phone?: string;
          address?: string | null;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          student_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          student_count?: number;
          created_at?: string;
        };
        Update: {
          school_id?: string;
          name?: string;
          student_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey";
            columns: ["school_id"];
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          class_id: string;
          full_name: string;
          jshshir: string;
          passport: string | null;
          birth_date: string | null;
          phone: string | null;
          parent_phone: string;
          address: string | null;
          gender: StudentGender;
          image: string | null;
          status: StudentStatus;
          jshshir_normalized?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          full_name: string;
          jshshir: string;
          passport?: string | null;
          birth_date?: string | null;
          phone?: string | null;
          parent_phone?: string;
          address?: string | null;
          gender?: StudentGender;
          image?: string | null;
          status?: StudentStatus;
          created_at?: string;
        };
        Update: {
          class_id?: string;
          full_name?: string;
          jshshir?: string;
          passport?: string | null;
          birth_date?: string | null;
          phone?: string | null;
          parent_phone?: string;
          address?: string | null;
          gender?: StudentGender;
          image?: string | null;
          status?: StudentStatus;
        };
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey";
            columns: ["class_id"];
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          actor_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
