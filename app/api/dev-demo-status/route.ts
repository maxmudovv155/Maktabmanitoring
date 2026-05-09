import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  allowLocalOfflineDemo,
  DEMO_DEV_COOKIE_NAME,
  DEMO_DEV_COOKIE_VALUE,
} from "@/lib/demo-dev-auth";

export async function GET() {
  if (!allowLocalOfflineDemo()) {
    return NextResponse.json({ demo: false });
  }

  const c = await cookies();
  const demo = c.get(DEMO_DEV_COOKIE_NAME)?.value === DEMO_DEV_COOKIE_VALUE;

  return NextResponse.json({ demo });
}
