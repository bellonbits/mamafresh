"use client";

import { useState, useCallback } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  size?: "sm" | "md";
  className?: string;
}

export default function QuantityStepper({
  value,
  min = 1,
  max = 100,
  step = 1,
  unit,
  onChange,
  size = "md",
  className,
}: QuantityStepperProps) {
  const dec = useCallback(() => {
    const next = Math.round((value - step) * 10) / 10;
    if (next >= min) onChange(next);
  }, [value, step, min, onChange]);

  const inc = useCallback(() => {
    const next = Math.round((value + step) * 10) / 10;
    if (next <= max) onChange(next);
  }, [value, step, max, onChange]);

  const btnSize = size === "sm" ? "w-7 h-7 text-sm" : "w-8 h-8 text-base";
  const numSize = size === "sm" ? "w-8 text-sm" : "w-10 text-base";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        onClick={dec}
        className={cn(
          btnSize,
          "rounded-full border-2 border-brand-500 text-brand-600 flex items-center justify-center hover:bg-brand-50 active:scale-90 transition-all duration-150 font-bold"
        )}
        aria-label="Decrease quantity"
      >
        <Minus size={size === "sm" ? 12 : 14} strokeWidth={2.5} />
      </button>

      <span
        className={cn(
          numSize,
          "text-center font-bold text-gray-800"
        )}
      >
        {value}
        {unit && <span className="text-xs text-gray-500 ml-0.5">{unit}</span>}
      </span>

      <button
        onClick={inc}
        className={cn(
          btnSize,
          "rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 active:scale-90 transition-all duration-150 font-bold"
        )}
        aria-label="Increase quantity"
      >
        <Plus size={size === "sm" ? 12 : 14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
