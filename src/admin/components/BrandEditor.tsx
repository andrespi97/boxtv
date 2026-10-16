import type { BrandConfig, BrandBackground } from '@/shared/types/signage';
import { ADS_PCT_RANGE, HEADER_PCT_RANGE, adsHeightPct, headerHeightPct } from '@/shared/defaults';
import {
  ColorInput,
  Field,
  ImageUrlInput,
  RangeInput,
  Section,
  Select,
  TextInput,
  Toggle,
} from './ui';

type BrandEditorProps = {
  value: BrandConfig;
  onChange: (value: BrandConfig) => void;
};

const BACKGROUNDS: { value: BrandBackground; label: string }[] = [
  { value: 'black', label: 'Negro' },
  { value: 'brand', label: 'Color de marca' },
  { value: 'image', label: 'Imagen de fondo' },
];

export function BrandEditor({ value, onChange }: BrandEditorProps) {
  const headerPct = headerHeightPct(value);
  const adsPct = adsHeightPct(value);
  const mainPct = Math.max(0, 100 - headerPct - adsPct);

  return (
    <div className="space-y-7">
      <Section title="Marca" description="Logo y colores que se ven en la tele.">
        <Field
          label="Logo del box"
          hint="PNG o SVG con transparencia (HTTPS). Si no pones logo, se muestra una barra de color."
        >
          <ImageUrlInput
            value={value.logoUrl}
            placeholder="https://…/logo.png"
            onChange={(logoUrl) => onChange({ ...value, logoUrl })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Color primario">
            <ColorInput
              value={value.primaryColor}
              onChange={(primaryColor) => onChange({ ...value, primaryColor })}
            />
          </Field>
          <Field label="Color secundario">
            <ColorInput
              value={value.secondaryColor}
              onChange={(secondaryColor) => onChange({ ...value, secondaryColor })}
            />
          </Field>
        </div>

        <Field label="Fondo de la zona principal">
          <Select
            value={value.background}
            onChange={(e) => onChange({ ...value, background: e.target.value as BrandBackground })}
          >
            {BACKGROUNDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        {value.background === 'image' && (
          <Field label="URL de la imagen de fondo">
            <ImageUrlInput
              value={value.backgroundUrl ?? ''}
              onChange={(backgroundUrl) => onChange({ ...value, backgroundUrl })}
            />
          </Field>
        )}
      </Section>

      <Section title="Cabecera" description="Lo que se ve en la franja superior.">
        <Field label="Título" hint="Si lo dejas vacío se usa el nombre de la pantalla.">
          <TextInput
            value={value.headerTitle ?? ''}
            placeholder="CROSSFIT BOXTIME"
            onChange={(e) => onChange({ ...value, headerTitle: e.target.value })}
          />
        </Field>

        <Field label="Subtítulo (opcional)">
          <TextInput
            value={value.headerSubtitle ?? ''}
            placeholder="Wod del día"
            onChange={(e) => onChange({ ...value, headerSubtitle: e.target.value })}
          />
        </Field>

        <Toggle
          label="Mostrar reloj y fecha"
          checked={value.showClock}
          onChange={(showClock) => onChange({ ...value, showClock })}
        />
      </Section>

      <Section title="Proporciones" description="Cuánto ocupa cada franja de la pantalla.">
        <Field label="Cabecera">
          <RangeInput
            value={headerPct}
            min={HEADER_PCT_RANGE.min}
            max={HEADER_PCT_RANGE.max}
            onChange={(v) => onChange({ ...value, headerHeightPct: v })}
          />
        </Field>

        <Field label="Publicidad">
          <RangeInput
            value={adsPct}
            min={ADS_PCT_RANGE.min}
            max={ADS_PCT_RANGE.max}
            onChange={(v) => onChange({ ...value, adsHeightPct: v })}
          />
        </Field>

        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
          <span>Zona principal (el resto)</span>
          <span className="font-semibold tabular-nums text-slate-200">{mainPct}%</span>
        </div>
      </Section>
    </div>
  );
}
