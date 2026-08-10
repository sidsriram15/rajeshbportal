"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded font-medium transition-all duration-150 ease-snap disabled:pointer-events-none disabled:opacity-40 active:translate-y-px [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-canvas shadow-card hover:bg-ink/90 dark:bg-ink dark:text-canvas",
        secondary:
          "border border-line bg-surface text-ink shadow-card hover:bg-canvas hover:border-line-strong",
        ghost: "text-muted hover:bg-ink/[0.06] hover:text-ink",
        accent: "bg-accent text-white shadow-card hover:bg-accent/90 dark:text-canvas",
        danger:
          "border border-danger/30 bg-danger/[0.06] text-danger hover:bg-danger/[0.12] hover:border-danger/50",
        solidDanger: "bg-danger text-white shadow-card hover:bg-danger/90",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-6 px-2 text-2xs [&_svg]:size-3",
        sm: "h-7 px-2.5 text-[13px] [&_svg]:size-3.5",
        md: "h-8 px-3 text-[13px] [&_svg]:size-4",
        lg: "h-9 px-4 text-sm [&_svg]:size-4",
        icon: "size-7 [&_svg]:size-4",
        iconSm: "size-6 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
