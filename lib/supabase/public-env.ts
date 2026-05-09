/**
 * Faqat NEXT_PUBLIC_* — klient paketlarida import qilish mumkin.
 * Build vaqtida mavjud bo‘lmagan env uchun placeholder ishlatilganda ham aniqlaymiz.
 */

function isPlaceholderUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.length === 0 ||
    u.includes("your_project_ref") ||
    u.includes("placeholder.supabase.co") ||
    u.endsWith(".example") ||
    u.includes("xxxxxxxx")
  );
}

function isPlaceholderKey(key: string): boolean {
  const k = key.trim();
  return (
    k.length === 0 ||
    k === "public-anon-key" ||
    k.toLowerCase().includes("your_public_anon_key") ||
    k.toLowerCase().includes("replace_me")
  );
}

/** Brauzerda haqiqiy Supabase ulanishi uchun env to‘liq va placeholder emasligi */
export function isSupabasePublicConfigured(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return !isPlaceholderUrl(url) && !isPlaceholderKey(key);
}

export const SUPABASE_ENV_SETUP_UZ =
  "`.env.local` yarating (.env.local.example dan nusxa): `NEXT_PUBLIC_SUPABASE_URL` va `NEXT_PUBLIC_SUPABASE_ANON_KEY` ning haqiqiy qiymatlarini Supabase boshqaruv paneli > Sozlamalar > API dan qo‘ying. Keyin `npm run dev` ni qayta ishga tushiring.";

export const SUPABASE_CREATE_USER_UZ =
  "Supabase boshqaruv paneli > Autentifikatsiya > Users: `admin1@demo.uz`, parol `admin1234` bilan foydalanuvchi yarating (Invite yoki Add user — avtomatik confirm).";
