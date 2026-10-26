import clsx from "clsx";
import { forwardRef } from "react";

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-gold-300/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-gold-300/10";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className={clsx("block", className)}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
        {label}
      </span>
      <input ref={ref} id={inputId} className={clsx(inputClass, error && "border-rose-400/60")} {...rest} />
      {error && <span className="mt-1 block text-xs text-rose-300">{error}</span>}
    </label>
  );
});
