/** Supabase `.ilike` uchun maxsus belgilarni chiqaradi. */
export function escapeIlike(term: string): string {
  return term.replace(/([%_\\])/g, "\\$1");
}
