"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

interface TextFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "password" | "number";
  disabled?: boolean;
}

export function TextField({ label, value, onChange, placeholder, type = "text", required, error, hint, disabled, className }: TextFieldProps) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center gap-1 text-xs font-bold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(
          "w-full min-h-11 sm:min-h-12 rounded-xl border bg-white px-3.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 transition-colors",
          error ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-300" : "border-gray-200 focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]",
          disabled && "cursor-not-allowed bg-gray-50 text-gray-400"
        )}
      />
      {error ? <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span> : hint ? <span className="mt-1 block text-[11px] text-gray-400">{hint}</span> : null}
    </label>
  );
}

interface TextAreaProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextAreaField({ label, value, onChange, placeholder, required, error, hint, rows = 3, className }: TextAreaProps) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center gap-1 text-xs font-bold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <textarea
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={!!error}
        className={cn(
          "w-full resize-none rounded-xl border bg-white p-3.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 transition-colors",
          error ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-300" : "border-gray-200 focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
        )}
      />
      {error ? <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span> : hint ? <span className="mt-1 block text-[11px] text-gray-400">{hint}</span> : null}
    </label>
  );
}

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  loading?: boolean;
  loadError?: string;
  onRetry?: () => void;
  disabled?: boolean;
}

export function SelectField({ label, value, onChange, options, placeholder = "Select...", required, error, hint, loading, loadError, onRetry, disabled, className }: SelectFieldProps) {
  if (loading) {
    return (
      <div className={cn("block", className)}>
        <span className="mb-1 flex items-center gap-1 text-xs font-bold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</span>
        <div className="flex min-h-11 sm:min-h-12 w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-400">Loading {label.toLowerCase()}...</div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className={cn("block", className)}>
        <span className="mb-1 flex items-center gap-1 text-xs font-bold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</span>
        <div className="flex min-h-11 sm:min-h-12 w-full items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-600">
          <span>Unable to load {label.toLowerCase()}.</span>
          {onRetry && <button type="button" onClick={onRetry} className="font-bold underline">Retry</button>}
        </div>
      </div>
    );
  }
  return (
    <label className={cn("relative block", className)}>
      <span className="mb-1 flex items-center gap-1 text-xs font-bold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(
          "w-full min-h-11 sm:min-h-12 appearance-none rounded-xl border bg-white px-3.5 pr-9 text-sm text-gray-800 outline-none transition-colors",
          error ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-300" : "border-gray-200 focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]",
          disabled && "cursor-not-allowed bg-gray-50 text-gray-400"
        )}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-[34px] text-gray-400" />
      {error ? <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span> : hint ? <span className="mt-1 block text-[11px] text-gray-400">{hint}</span> : null}
    </label>
  );
}
