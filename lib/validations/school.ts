import { z } from "zod";

export const schoolFormSchema = z.object({
  name: z.string().min(3, "Maktab nomi kamida 3 belgi."),
  director: z.string().min(2, "Direktor ismi majburiy."),
  phone: z.string().min(7, "Telefon raqamini kiriting."),
  address: z.string().optional(),
});

export type SchoolFormValues = z.infer<typeof schoolFormSchema>;
