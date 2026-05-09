export function utcStartOfTodayIso(): string {
  const now = new Date();
  const d = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(d).toISOString();
}

export function formatLocalDate(raw: string | null | undefined, locale = "uz-UZ"): string {
  if (!raw) return "—";
  const d = new Date(raw.includes("T") ? raw : `${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function calculateAgeYears(birthIso: string | null | undefined): number | null {
  if (!birthIso) return null;
  const d = new Date(birthIso.includes("T") ? birthIso : `${birthIso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age -= 1;
  return age;
}
