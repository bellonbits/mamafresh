"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  value: string;
  label: string;
}

interface Props {
  items: Item[];
  selected: string[];
  onToggle: (value: string) => void;
}

export default function ChipMultiSelect({ items, selected, onToggle }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {items.map((item) => {
        const isSelected = selected.includes(item.value);
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onToggle(item.value)}
            aria-pressed={isSelected}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold transition-all active:scale-[0.98]",
              isSelected ? "border-[#16A34A] bg-[#EAF7EE] text-[#073729]" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
          >
            <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", isSelected ? "border-[#16A34A] bg-[#16A34A] text-white" : "border-gray-300")}>
              {isSelected && <Check size={11} strokeWidth={3} />}
            </span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
