import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors select-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15",
        success:
          "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300",
        warning:
          "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300",
        destructive:
          "border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300",
        gold:
          "border-amber-300/80 bg-amber-100/80 text-amber-900 dark:border-amber-700/80 dark:bg-amber-950/60 dark:text-amber-200",
        outline:
          "border-outline-variant bg-surface text-on-surface-variant",
        secondary:
          "border-outline-variant/60 bg-surface-container-high text-on-surface-variant",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.25 text-[11px] gap-1 [&_svg]:size-3",
        lg: "px-3 py-1 text-xs gap-1.5 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
