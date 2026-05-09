import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  allowLocalOfflineDemo,
  DEMO_DEV_COOKIE_NAME,
  DEMO_DEV_COOKIE_VALUE,
  isDevDemoCredentials,
} from "@/lib/demo-dev-auth";
import { normalizeLoginEmail } from "@/lib/validations/auth";

export async function POST(req: Request) {
  if (!allowLocalOfflineDemo()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const emailRaw = typeof body === "object" && body !== null && "email" in body ? String((body as { email: unknown }).email) : "";
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String((body as { password: unknown }).password)
      : "";

  const email = normalizeLoginEmail(emailRaw);
  if (!isDevDemoCredentials(email, password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_DEV_COOKIE_NAME, DEMO_DEV_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
