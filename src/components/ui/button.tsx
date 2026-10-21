import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Adapted from the MIT-licensed shadcn/ui Button. asChild styles a Link without nesting interactive elements.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-4",
  {
    variants: {
      variant: {


        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary disabled:hover:bg-primary",


        outline: "border border-input bg-card text-foreground hover:bg-muted active:bg-muted disabled:hover:bg-card",


        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted disabled:hover:bg-transparent disabled:hover:text-muted-foreground",


      },
      size: { default: "min-h-12 px-4 py-2", sm: "min-h-11 px-3 py-2", icon: "size-12" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; };

export function Button({ asChild = false, variant, size, className, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
