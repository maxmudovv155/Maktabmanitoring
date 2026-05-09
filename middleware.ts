import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (cause) {
    console.error("[middleware]", cause);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Dev uchun muhim: `/_next/webpack-hmr`, `/_next/data` va static assetlar
     * middleware orqali o‘tmasin — aks holda style/HMR uzilishi mumkin.
     */
    "/((?!_next/static|_next/image|_next/webpack-hmr|_next/data|favicon.ico|manifest.json|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
