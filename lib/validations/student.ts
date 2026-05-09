import { z } from "zod";
import { isValidJshshir } from "@/utils/jshshir";

export const studentFormSchema = z.object({
  full_name: z.string().min(3, "F.I.Sh yozing."),
  jshshir: z
    .string()
    .min(8, "JSHSHIR noto‘g‘ri.")
    .refine((v) => isValidJshshir(v), "JSHSHIR 14 raqam."),
  passport: z.string().optional(),
  birth_date: z.string().optional(),
  phone: z.string().optional(),
  parent_phone: z.string().min(8, "Ota-ona telefoni."),
  address: z.string().optional(),
  gender: z.enum(["male", "female", "other", "unknown"]),
  image: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length === 0 ? undefined : value))
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: "Rasm havolasi to‘liq URL bo‘lishi kerak.",
    }),
  status: z.enum(["active", "inactive", "transferred"]),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
