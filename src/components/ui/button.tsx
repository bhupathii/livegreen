import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-[#1B5E20] text-white shadow-[0_20px_25px_-5px_rgba(27,94,32,0.1),0_8px_10px_-6px_rgba(27,94,32,0.1)] hover:bg-[#144a18]",
      secondary: "bg-[#FCFCFC] text-[#1B5E20] border border-[#CDDBCE] hover:bg-[#f0f0f0]",
      outline: "bg-transparent border border-[#1B5E20] text-[#1B5E20] hover:bg-[#1B5E20]/10",
      ghost: "bg-transparent text-[#1B5E20] hover:bg-[#1B5E20]/10 shadow-none",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-8 text-base",
      lg: "h-14 px-10 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
