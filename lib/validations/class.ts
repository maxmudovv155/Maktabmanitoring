import { z } from "zod";

export const classFormSchema = z.object({
  name: z.string().min(1, "Sinf nomi majburiy."),
});

export type ClassFormValues = z.infer<typeof classFormSchema>;
