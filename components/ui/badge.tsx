import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/12 text-primary",
        outline: "text-foreground",
        muted: "border-muted-foreground/20 bg-muted/60 text-muted-foreground",
        success: "border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
        destructive: "border-transparent bg-danger/12 text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
