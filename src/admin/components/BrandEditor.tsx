import type { BrandConfig, BrandBackground } from '@/shared/types/signage';
import { ColorInput, Field, ImageUrlInput, Select, Toggle } from './ui';

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
  return (
    <div className="space-y-4">
      <Field label="Logo del box" hint="PNG o SVG con transparencia, versión clara (HTTPS).">
        <ImageUrlInput
          value={value.logoUrl}
          placeholder="https://…/logo.png"
          onChange={(logoUrl) => onChange({ ...value, logoUrl })}
        />
      </Field>

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

      <Toggle
        label="Mostrar reloj y fecha"
        checked={value.showClock}
        onChange={(showClock) => onChange({ ...value, showClock })}
      />
    </div>
  );
}
