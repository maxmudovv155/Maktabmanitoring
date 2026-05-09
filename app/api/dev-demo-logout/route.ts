import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { allowLocalOfflineDemo, DEMO_DEV_COOKIE_NAME } from "@/lib/demo-dev-auth";

export async function POST() {
  if (!allowLocalOfflineDemo()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEMO_DEV_COOKIE_NAME);

  return NextResponse.json({ ok: true });
}
