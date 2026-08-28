import type { ReactNode } from "react";

interface FormFieldProps {
  htmlFor: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({ htmlFor, label, error, className = "", children }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={`block ${className}`.trim()}>
      <span className="mb-2 block text-sm font-medium text-[#14263a]">{label}</span>
      {children}
      <p className={`mt-2 text-sm text-red-600 ${error ? "" : "hidden"}`} role="alert">
        {error || ""}
      </p>
    </label>
  );
}
