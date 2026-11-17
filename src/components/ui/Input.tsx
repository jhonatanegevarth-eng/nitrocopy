import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-[13.5px] text-fg placeholder:text-fg-dim outline-none focus:border-accent transition-colors",
          className
        )}
        {...props}
      />
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[11px] font-mono uppercase tracking-widest text-fg-muted">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-[13.5px] text-fg placeholder:text-fg-dim outline-none focus:border-accent transition-colors resize-none",
          className
        )}
        {...props}
      />
    </div>
  );
}
