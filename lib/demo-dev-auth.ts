import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import type { Profile } from "@/types/domain";

/**
 * Offline demo: `npm run dev` yoki `.env.local` da
 * NEXT_PUBLIC_ENABLE_OFFLINE_DEMO=true (mahalliy `next start`).
 *
 * Davlat/bulut deployda har doim o‘chiq: Vercel (`VERCEL=1`) da hech qachon yoqilmaydi.
 * Mahalliy production build: faqat aniq `NEXT_PUBLIC_ENABLE_OFFLINE_DEMO=true` bo‘lsa.
 */
export function allowLocalOfflineDemo(): boolean {
  if (process.env.VERCEL === "1") {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_ENABLE_OFFLINE_DEMO === "true";
  }
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_OFFLINE_DEMO === "true"
  );
}

export const DEMO_DEV_LOGIN_HINT = "nsms";
export const DEMO_DEV_EMAIL = "nsms@demo.uz";
export const DEMO_DEV_PASSWORD = "Nsms2026!";
export const DEMO_DEV_COOKIE_NAME = "nsms_dev_demo_session";
export const DEMO_DEV_COOKIE_VALUE = "nsms-development-local-session-v2026";

export const DEMO_DEV_USER_ID = "00000000-0000-4000-a000-000000000099";

/** Cookie / middleware tekshiruvi */
export function isDevDemoAuthorizedRequest(request: NextRequest): boolean {
  if (!allowLocalOfflineDemo()) return false;
  return request.cookies.get(DEMO_DEV_COOKIE_NAME)?.value === DEMO_DEV_COOKIE_VALUE;
}

/** Server komponentlarida `cookies()` */
export function isDevDemoAuthorizedCookieStore(store: {
  get(name: string): { value: string } | undefined;
}): boolean {
  if (!allowLocalOfflineDemo()) return false;
  return store.get(DEMO_DEV_COOKIE_NAME)?.value === DEMO_DEV_COOKIE_VALUE;
}

export function isDevDemoCredentials(emailNormalized: string, password: string): boolean {
  return emailNormalized === DEMO_DEV_EMAIL && password === DEMO_DEV_PASSWORD;
}

export function mockDemoProfile(): Profile {
  return {
    id: DEMO_DEV_USER_ID,
    full_name: "Namangan demo administratori",
    role: "admin",
    created_at: new Date(0).toISOString(),
    avatar_url: null,
  };
}

export function mockDemoUser(): User {
  const now = new Date().toISOString();
  return {
    id: DEMO_DEV_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: DEMO_DEV_EMAIL,
    email_confirmed_at: now,
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
    last_sign_in_at: now,
  } as User;
}
