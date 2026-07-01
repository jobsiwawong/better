"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PinInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, "type" | "onChange"> & {
    onValueChange?: (value: string) => void;
  }
>(function PinInput({ className, onValueChange, value, ...props }, ref) {
  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
        onValueChange?.(digits);
      }}
      className={cn(
        "text-center text-2xl font-semibold tracking-[0.5em]",
        className
      )}
      {...props}
    />
  );
});
