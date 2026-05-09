import type { Database } from "./supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SchoolRow = Database["public"]["Tables"]["schools"]["Row"];
export type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
export type StudentRow = Database["public"]["Tables"]["students"]["Row"];
export type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export type SchoolWithCounts = SchoolRow & {
  class_count: number;
  student_total: number;
};

export type ClassWithSchool = ClassRow & {
  schools: Pick<SchoolRow, "id" | "name"> | null;
};

export type StudentWithClassSchool = StudentRow & {
  classes:
    | (ClassRow & {
        schools: Pick<SchoolRow, "id" | "name"> | null;
      })
    | null;
};
