"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDef {
  number: number;
  label: string;
}

interface Props {
  steps: StepDef[];
  currentStep: number;
  onJump?: (step: number) => void;
}

export default function OnboardingProgress({ steps, currentStep, onJump }: Props) {
  const current = steps.find((s) => s.number === currentStep);
  const pct = (currentStep / steps.length) * 100;

  return (
    <>
      {/* Mobile: "Step X of N" + progress bar */}
      <div className="sm:hidden">
        <p className="text-xs font-bold text-emerald-100/80">Step {currentStep} of {steps.length}</p>
        <p className="mt-0.5 text-lg font-black text-white">{current?.label}</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-[#84CC16] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Desktop: vertical stepper */}
      <nav className="hidden sm:block" aria-label="Onboarding progress">
        {steps.map((item, index) => {
          const completed = currentStep > item.number;
          const active = currentStep === item.number;
          const clickable = !!onJump && (completed || active);
          return (
            <div key={item.number} className="relative flex items-center gap-4 pb-7 last:pb-0">
              {index < steps.length - 1 && (
                <span className={cn("absolute left-[18px] top-9 h-7 w-px", completed ? "bg-white/70" : "bg-white/20")} />
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(item.number)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                  active || completed ? "border-white bg-white text-[#073729]" : "border-white/30 text-white/40",
                  clickable && "cursor-pointer hover:scale-105"
                )}
              >
                {completed ? <Check size={16} /> : item.number}
              </button>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(item.number)}
                className={cn("text-left text-sm font-semibold", active ? "text-white" : completed ? "text-white/70" : "text-white/35", clickable && "cursor-pointer")}
              >
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>
    </>
  );
}
