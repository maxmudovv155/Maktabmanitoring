import type { ClassRow, SchoolRow, StudentRow } from "@/types/domain";

const SCHOOLS_KEY = "nsms_demo_schools_v1";
const CLASSES_KEY = "nsms_demo_classes_v1";
const STUDENTS_KEY = "nsms_demo_students_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function sortByName(a: SchoolRow, b: SchoolRow) {
  return a.name.localeCompare(b.name, "uz");
}

export function demoListSchools(): SchoolRow[] {
  const parsed = safeParse<SchoolRow[]>(globalThis.localStorage?.getItem(SCHOOLS_KEY) ?? null);
  if (!parsed) return [];
  return parsed.slice().sort(sortByName);
}

export function demoGetSchoolById(id: string): SchoolRow | null {
  return demoListSchools().find((s) => s.id === id) ?? null;
}

export function demoUpsertSchool(input: {
  id?: string;
  name: string;
  director: string;
  phone: string;
  address: string | null;
}): SchoolRow {
  const now = new Date().toISOString();
  const next: SchoolRow = {
    id: input.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    name: input.name,
    director: input.director,
    phone: input.phone,
    address: input.address,
    created_at: now,
  };

  const existing = demoListSchools();
  const idx = existing.findIndex((s) => s.id === next.id);
  if (idx >= 0) existing[idx] = { ...existing[idx], ...next };
  else existing.push(next);

  globalThis.localStorage?.setItem(SCHOOLS_KEY, JSON.stringify(existing));
  return next;
}

export function demoDeleteSchool(id: string) {
  const existing = demoListSchools().filter((s) => s.id !== id);
  globalThis.localStorage?.setItem(SCHOOLS_KEY, JSON.stringify(existing));

  const classes = demoListClasses(id);
  for (const c of classes) {
    demoDeleteClass(c.id);
  }
}

function sortByClassName(a: ClassRow, b: ClassRow) {
  return a.name.localeCompare(b.name, "uz");
}

export function demoListClasses(schoolId: string): ClassRow[] {
  const parsed = safeParse<ClassRow[]>(globalThis.localStorage?.getItem(CLASSES_KEY) ?? null);
  if (!parsed) return [];
  return parsed.filter((c) => c.school_id === schoolId).slice().sort(sortByClassName);
}

export function demoGetClassById(id: string): ClassRow | null {
  const parsed = safeParse<ClassRow[]>(globalThis.localStorage?.getItem(CLASSES_KEY) ?? null);
  if (!parsed) return null;
  return parsed.find((c) => c.id === id) ?? null;
}

export function demoUpsertClass(input: { id?: string; school_id: string; name: string }): ClassRow {
  const now = new Date().toISOString();
  const next: ClassRow = {
    id: input.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    school_id: input.school_id,
    name: input.name,
    student_count: 0,
    created_at: now,
  };

  const parsed = safeParse<ClassRow[]>(globalThis.localStorage?.getItem(CLASSES_KEY) ?? null) ?? [];
  const idx = parsed.findIndex((c) => c.id === next.id);
  if (idx >= 0) {
    parsed[idx] = { ...parsed[idx], name: next.name };
  } else {
    parsed.push(next);
  }
  globalThis.localStorage?.setItem(CLASSES_KEY, JSON.stringify(parsed));
  syncClassStudentCount(next.id);
  return demoGetClassById(next.id) ?? next;
}

export function demoDeleteClass(id: string) {
  const parsed = safeParse<ClassRow[]>(globalThis.localStorage?.getItem(CLASSES_KEY) ?? null) ?? [];
  const next = parsed.filter((c) => c.id !== id);
  globalThis.localStorage?.setItem(CLASSES_KEY, JSON.stringify(next));

  const students = demoListStudents(id);
  for (const s of students) demoDeleteStudent(s.id);
}

function sortByStudentName(a: StudentRow, b: StudentRow) {
  return a.full_name.localeCompare(b.full_name, "uz");
}

export function demoListStudents(classId: string): StudentRow[] {
  const parsed = safeParse<StudentRow[]>(globalThis.localStorage?.getItem(STUDENTS_KEY) ?? null);
  if (!parsed) return [];
  return parsed.filter((s) => s.class_id === classId).slice().sort(sortByStudentName);
}

export function demoUpsertStudent(input: Omit<StudentRow, "id" | "created_at" | "jshshir_normalized"> & { id?: string }): StudentRow {
  const now = new Date().toISOString();
  const next: StudentRow = {
    id: input.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    class_id: input.class_id,
    full_name: input.full_name,
    jshshir: input.jshshir,
    passport: input.passport ?? null,
    birth_date: input.birth_date ?? null,
    phone: input.phone ?? null,
    parent_phone: input.parent_phone,
    address: input.address ?? null,
    gender: input.gender,
    image: input.image ?? null,
    status: input.status,
    created_at: now,
  };

  const parsed = safeParse<StudentRow[]>(globalThis.localStorage?.getItem(STUDENTS_KEY) ?? null) ?? [];
  const idx = parsed.findIndex((s) => s.id === next.id);
  if (idx >= 0) parsed[idx] = { ...parsed[idx], ...next };
  else parsed.push(next);
  globalThis.localStorage?.setItem(STUDENTS_KEY, JSON.stringify(parsed));
  syncClassStudentCount(next.class_id);
  return next;
}

export function demoDeleteStudent(id: string) {
  const parsed = safeParse<StudentRow[]>(globalThis.localStorage?.getItem(STUDENTS_KEY) ?? null) ?? [];
  const target = parsed.find((s) => s.id === id);
  const next = parsed.filter((s) => s.id !== id);
  globalThis.localStorage?.setItem(STUDENTS_KEY, JSON.stringify(next));
  if (target) syncClassStudentCount(target.class_id);
}

function syncClassStudentCount(classId: string) {
  const classes = safeParse<ClassRow[]>(globalThis.localStorage?.getItem(CLASSES_KEY) ?? null) ?? [];
  const idx = classes.findIndex((c) => c.id === classId);
  if (idx < 0) return;
  const count = demoListStudents(classId).length;
  classes[idx] = { ...classes[idx], student_count: count };
  globalThis.localStorage?.setItem(CLASSES_KEY, JSON.stringify(classes));
}

