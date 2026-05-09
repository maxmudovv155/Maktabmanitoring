"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import {
  allowLocalOfflineDemo,
  DEMO_DEV_LOGIN_HINT,
  DEMO_DEV_PASSWORD,
  DEMO_DEV_EMAIL,
  isDevDemoCredentials,
} from "@/lib/demo-dev-auth";
import {
  isSupabasePublicConfigured,
  SUPABASE_CREATE_USER_UZ,
  SUPABASE_ENV_SETUP_UZ,
} from "@/lib/supabase/public-env";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  /** `npm run dev` dagi tayyor hisob (`nsms` → nsms@demo.uz); productionda Supabase bilan kirish kerak */
  const demoCredentials = useMemo(
    () => ({
      login: DEMO_DEV_LOGIN_HINT,
      password: DEMO_DEV_PASSWORD,
    }),
    [],
  );

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const busy = form.formState.isSubmitting;

  async function onSubmit(values: LoginFormValues) {
    if (allowLocalOfflineDemo() && isDevDemoCredentials(values.email, values.password)) {
      try {
        const res = await fetch("/api/dev-demo-login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email, password: values.password }),
        });
        if (!res.ok) {
          toast.error("Demo kirish ishlamadi", { description: "Server javobini tekshiring." });
          return;
        }
      } catch {
        toast.error("Demo kirish tarmoq xatosi.");
        return;
      }
      toast.success("Development demo sessiyasi boshlandi.", {
        description: `Hisob: ${DEMO_DEV_EMAIL}`,
      });
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (!isSupabasePublicConfigured()) {
      toast.error(
        allowLocalOfflineDemo()
          ? "Mahalliy demo paroli noto‘g‘ri yoki boshqa login."
          : "Supabase ulanmagan (.env.local)",
        {
          description: allowLocalOfflineDemo()
            ? `Offline demo uchun «Demo login…» tugmasidan foydalaning yoki aniq yozing: login ${DEMO_DEV_LOGIN_HINT}, parol ${DEMO_DEV_PASSWORD}. Yangi paket uchun \`NEXT_PUBLIC_ENABLE_OFFLINE_DEMO=true\` va serverni qayta ishga tushiring (\`npm run dev\` yoki \`npm run build\`).`
            : `${SUPABASE_ENV_SETUP_UZ} ${SUPABASE_CREATE_USER_UZ}`,
          duration: 14_000,
        },
      );
      return;
    }

    let errorMessage: string | undefined;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      errorMessage = error?.message;
    } catch (e) {
      errorMessage = e instanceof Error ? e.message : "Tarmoq xatosi";
    }

    if (errorMessage) {
      const low = errorMessage.toLowerCase();
      const isNetwork =
        low.includes("failed to fetch") ||
        low.includes("networkerror") ||
        low.includes("load failed");

      toast.error(isNetwork ? "Supabase ga ulanib bo‘lmadi" : "Kirish rad etildi", {
        description: isNetwork
          ? `Internet va .env.local dagi URL/kalitni tekshiring. Demo uchun \`npm run dev\`: login \`${demoCredentials.login}\`, parol so‘zlamada.`
          : `${errorMessage} ${SUPABASE_CREATE_USER_UZ}`,
        duration: isNetwork ? 14_000 : 8000,
      });
      return;
    }

    toast.success("Muvaffaqiyatli kirildi");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="page-gradient-bg relative flex min-h-screen items-center justify-center px-6 py-[48px]">
      <Card className="glass-card relative z-10 w-full max-w-md border-white/75 shadow-[0_54px_150px_-55px_rgb(148,237,254,0.8)] backdrop-blur-3xl dark:border-white/13">
        <CardHeader className="space-y-3 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">NSMS</p>
          <CardTitle className="text-[30px]">Administrator kabinetiga kirish</CardTitle>
          <CardDescription>
            Supabase Auth proteksiyasi bilan xavfsiz sessiya va admin rollari boshqaruvi.
            {allowLocalOfflineDemo() ? (
              <>
                {" "}
                Mahalliy dev: tayyor hisob{" "}
                <span className="font-mono text-foreground/90">{DEMO_DEV_LOGIN_HINT}</span> /{" "}
                <span className="font-mono text-foreground/90">{DEMO_DEV_PASSWORD}</span> (email {DEMO_DEV_EMAIL}).
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <Separator className="bg-primary/26" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-9">
            <CardContent className="space-y-8 pt-[22px]">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login yoki email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="text"
                        placeholder={demoCredentials.login}
                        autoComplete="username"
                      />
                    </FormControl>
                    <p className="text-[12px] text-muted-foreground">
                      Faqat login yozsangiz, avtomatik ravishda <span className="font-mono">@demo.uz</span> qo‘shiladi (
                      masalan: <span className="font-mono">admin1</span> →{" "}
                      <span className="font-mono">admin1@demo.uz</span>).
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maxfiy kalit</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="············"
                          className="pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex-col gap-[18px]">
              <Button type="submit" size="lg" className="w-full gap-[14px] text-base shadow-lg" disabled={busy}>
                {busy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
                Davom etish
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  form.setValue("email", demoCredentials.login, { shouldValidate: true });
                  form.setValue("password", demoCredentials.password, { shouldValidate: true });
                }}
              >
                Demo login ma’lumotini to‘ldirish
              </Button>
              <Link href="#" className="text-xs text-muted-foreground hover:text-primary" onClick={(e) => e.preventDefault()}>
                Qo‘shimcha yordam uchun tizim administratoriga murojaat qiling
              </Link>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <span className="pointer-events-none absolute inset-x-[10%] top-[12%] h-[320px] rounded-full bg-accent/42 blur-[150px]" />
    </div>
  );
}
