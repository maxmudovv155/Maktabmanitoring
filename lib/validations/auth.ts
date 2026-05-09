import { z } from "zod";

/** Login qisqa yozilsa (@ yo‘q bo‘lsa) Supabase uchun `login@DOMAIN` ga aylantiriladi. */
const DEMO_EMAIL_DOMAIN = "demo.uz";

export function normalizeLoginEmail(raw: string): string {
  const lower = raw.trim().toLowerCase();
  return lower.includes("@") ? lower : `${lower}@${DEMO_EMAIL_DOMAIN}`;
}

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Login kiriting.")
    .transform(normalizeLoginEmail)
    .pipe(z.string().email("Login / email formati noto‘g‘ri.")),
  password: z.string().min(6, "Parol kamida 6 belgi."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
