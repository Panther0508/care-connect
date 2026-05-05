import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium ring-offset-background transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-[1.02] text-base font-normal",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 text-base font-normal",
        outline: "border border-border bg-secondary/40 hover:bg-secondary hover:text-foreground text-base font-semibold",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 text-base font-normal",
        ghost: "hover:bg-secondary hover:text-foreground text-base font-normal",
        link: "text-primary-glow underline-offset-4 hover:underline text-base font-normal",
        hero: "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.03] hover:brightness-110 text-lg font-bold",
        amber: "bg-gradient-accent text-accent-foreground shadow-amber hover:scale-[1.03] hover:brightness-105 text-lg font-bold",
        glass: "glass text-foreground hover:bg-secondary/60 hover:scale-[1.02] text-base font-normal",
      },
      size: {
        default: "h-11 px-5 py-3 text-base",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-xl px-8 text-lg",
        xl: "h-16 rounded-2xl px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
