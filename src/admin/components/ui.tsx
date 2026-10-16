import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useRef, useState } from 'react';
import type { ImageFit } from '@/shared/types/signage';
import { isSafeImageUrl } from '@/shared/color';
import { signageClient } from '@/shared/api/signageClient';

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

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{title}</h3>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function RangeInput({
  value,
  min,
  max,
  step = 1,
  suffix = '%',
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700 accent-orange-500"
      />
      <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-200">
        {value}
        {suffix}
      </span>
    </div>
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const valid = !value || isSafeImageUrl(value);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { url } = await signageClient.uploadImage(file);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
          className="hidden"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          className="!px-3 !py-2"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Subiendo…' : 'Subir imagen'}
        </Button>
        {value && valid && (
          <img
            src={value}
            alt=""
            className="h-10 w-10 rounded-lg border border-white/10 bg-slate-800 object-cover"
          />
        )}
      </div>
      {!valid && <p className="text-xs text-amber-400">La URL debe ser HTTPS.</p>}
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
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
