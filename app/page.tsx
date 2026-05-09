import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isDevDemoAuthorizedCookieStore } from "@/lib/demo-dev-auth";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const cookieStore = await cookies();
  if (isDevDemoAuthorizedCookieStore(cookieStore)) {
    redirect("/dashboard");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
