
import React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      link: "text-translator-accent hover:underline focus-ring p-0",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-ring",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed",
          "relative flex items-center justify-center",
          className
        )}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
          </div>
        )}

        <span className={cn("flex items-center gap-2", isLoading && "invisible")}>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

CustomButton.displayName = "CustomButton";

export default CustomButton;
