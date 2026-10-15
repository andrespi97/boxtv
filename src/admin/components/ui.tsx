import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { ImageFit } from '@/shared/types/signage';
import { isSafeImageUrl } from '@/shared/color';

export function SectionCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500 ${props.className ?? ''}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500 ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 ${props.className ?? ''}`}
    />
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  const variants: Record<string, string> = {
    primary: 'bg-orange-500 text-black hover:bg-orange-400',
    secondary: 'bg-slate-700 text-white hover:bg-slate-600',
    ghost: 'border border-white/10 text-slate-200 hover:bg-white/5',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  };
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-left"
    >
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-orange-500' : 'bg-slate-600'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}

export function FitPicker({
  value,
  onChange,
}: {
  value: ImageFit;
  onChange: (fit: ImageFit) => void;
}) {
  const options: { value: ImageFit; label: string; hint: string }[] = [
    { value: 'contain', label: 'Contain', hint: 'Entera, bandas negras' },
    { value: 'cover', label: 'Cover', hint: 'Rellena, recorta' },
    { value: 'blur-fill', label: 'Blur fill', hint: 'Fondo difuminado' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg border px-2 py-2 text-center transition ${
            value === option.value
              ? 'border-orange-500 bg-orange-500/15 text-white'
              : 'border-white/10 bg-slate-800 text-slate-300 hover:border-white/20'
          }`}
        >
          <span className="block text-xs font-semibold">{option.label}</span>
          <span className="block text-[10px] text-slate-400">{option.hint}</span>
        </button>
      ))}
    </div>
  );
}

export function ImageUrlInput({
  value,
  onChange,
  placeholder = 'https://…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const valid = !value || isSafeImageUrl(value);
  return (
    <div className="space-y-1.5">
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {!valid && <p className="text-xs text-amber-400">La URL debe ser HTTPS.</p>}
    </div>
  );
}

export function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-slate-800"
      />
      <TextInput value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
    </div>
  );
}
