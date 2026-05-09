import { createServerClient } from "@supabase/ssr";

import { NextResponse, type NextRequest } from "next/server";



import { isDevDemoAuthorizedRequest } from "@/lib/demo-dev-auth";



type CookieToSet = {

  name: string;

  value: string;

  options?: Record<string, unknown>;

};



export async function updateSession(request: NextRequest) {

  const pathname = request.nextUrl.pathname;

  const devDemoAuthorized = isDevDemoAuthorizedRequest(request);



  if (pathname.startsWith("/dashboard") && devDemoAuthorized) {

    return NextResponse.next({ request });

  }



  if (pathname.startsWith("/login") && devDemoAuthorized) {

    const nextPath = request.nextUrl.searchParams.get("next") || "/dashboard";

    const url = request.nextUrl.clone();

    url.pathname = nextPath.startsWith("/") ? nextPath : "/dashboard";

    url.searchParams.delete("next");

    return NextResponse.redirect(url);

  }



  const hasSupabase =

    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&

    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());



  if (!hasSupabase) {

    if (pathname.startsWith("/dashboard")) {

      const url = request.nextUrl.clone();

      url.pathname = "/login";

      url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

      return NextResponse.redirect(url);

    }

    return NextResponse.next({ request });

  }



  let supabaseResponse = NextResponse.next({

    request,

  });



  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";



  const supabase = createServerClient(

    url.length > 0 ? url : "https://placeholder.supabase.co",

    key.length > 0 ? key : "public-anon-key",

    {

      cookies: {

        getAll() {

          return request.cookies.getAll();

        },

        setAll(cookiesToSet: CookieToSet[]) {

          cookiesToSet.forEach(({ name, value }) =>

            request.cookies.set(name, value),

          );

          supabaseResponse = NextResponse.next({

            request,

          });

          cookiesToSet.forEach(({ name, value, options }) =>

            supabaseResponse.cookies.set(name, value, options),

          );

        },

      },

    },

  );



  const {

    data: { user },

    error,

  } = await supabase.auth.getUser();



  if (pathname.startsWith("/dashboard")) {

    if (error || !user) {

      const loginUrl = request.nextUrl.clone();

      loginUrl.pathname = "/login";

      loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

      return NextResponse.redirect(loginUrl);

    }



    const { data: profile } = await supabase

      .from("profiles")

      .select("role")

      .eq("id", user.id)

      .maybeSingle();



    if (!profile) {

      const loginUrl = request.nextUrl.clone();

      loginUrl.pathname = "/login";

      loginUrl.searchParams.set("error", "profile-missing");

      return NextResponse.redirect(loginUrl);

    }



    void profile.role;

  }



  if (pathname.startsWith("/login") && user) {

    const nextPath = request.nextUrl.searchParams.get("next") || "/dashboard";

    const urlRedirect = request.nextUrl.clone();

    urlRedirect.pathname = nextPath.startsWith("/") ? nextPath : "/dashboard";

    urlRedirect.searchParams.delete("next");

    return NextResponse.redirect(urlRedirect);

  }



  return supabaseResponse;

}

