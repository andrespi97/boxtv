import type { CarouselItem, ImageFit, MainContent } from '@/shared/types/signage';
import { emptyTimer } from '@/shared/defaults';
import { Button, Field, FitPicker, ImageUrlInput, Select, TextArea, TextInput } from './ui';

type MainEditorProps = {
  value: MainContent;
  onChange: (value: MainContent) => void;
};

const TYPE_LABELS: { value: MainContent['type']; label: string }[] = [
  { value: 'text', label: 'Texto / WOD' },
  { value: 'image', label: 'Imagen' },
  { value: 'carousel', label: 'Carrusel' },
  { value: 'timer', label: 'Temporizador' },
];

export function MainEditor({ value, onChange }: MainEditorProps) {
  const switchType = (type: MainContent['type']) => {
    if (type === value.type) return;
    onChange(defaultContent(type));
  };

  return (
    <div className="space-y-4">
      <Field label="Modo principal">
        <Select value={value.type} onChange={(e) => switchType(e.target.value as MainContent['type'])}>
          {TYPE_LABELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      {value.type === 'text' && (
        <>
          <Field label="Título">
            <TextInput
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="WOD DE HOY"
            />
          </Field>
          <Field label="Contenido" hint="Puedes usar varias líneas.">
            <TextArea
              rows={6}
              value={value.body}
              onChange={(e) => onChange({ ...value, body: e.target.value })}
              placeholder={'21-15-9\nThrusters\nPull-ups'}
            />
          </Field>
        </>
      )}

      {value.type === 'image' && (
        <>
          <Field label="URL de la imagen" hint="Se admiten JPG, PNG, WebP y GIF (HTTPS).">
            <ImageUrlInput value={value.url} onChange={(url) => onChange({ ...value, url })} />
          </Field>
          <Field label="Ajuste">
            <FitPicker value={value.fit} onChange={(fit) => onChange({ ...value, fit })} />
          </Field>
        </>
      )}

      {value.type === 'carousel' && (
        <CarouselEditor value={value} onChange={onChange} />
      )}

      {value.type === 'timer' && (
        <p className="rounded-lg border border-white/10 bg-slate-800/60 p-3 text-sm text-slate-300">
          El temporizador se controla desde la sección <strong>Temporizador</strong> de abajo.
        </p>
      )}
    </div>
  );
}

function CarouselEditor({
  value,
  onChange,
}: {
  value: Extract<MainContent, { type: 'carousel' }>;
  onChange: (value: MainContent) => void;
}) {
  const updateItem = (index: number, item: CarouselItem) => {
    const items = value.items.map((current, i) => (i === index ? item : current));
    onChange({ ...value, items });
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.items.length) return;
    const items = [...value.items];
    const [item] = items.splice(index, 1);
    items.splice(target, 0, item);
    onChange({ ...value, items });
  };

  const remove = (index: number) => {
    onChange({ ...value, items: value.items.filter((_, i) => i !== index) });
  };

  const add = (type: CarouselItem['type']) => {
    const item: CarouselItem =
      type === 'image' ? { type: 'image', url: '', fit: 'contain' } : { type: 'text', title: '', body: '' };
    onChange({ ...value, items: [...value.items, item] });
  };

  return (
    <div className="space-y-4">
      <Field label="Segundos por elemento">
        <TextInput
          type="number"
          min={2}
          max={120}
          value={value.secondsPerItem ?? 8}
          onChange={(e) => onChange({ ...value, secondsPerItem: Number(e.target.value) || 8 })}
        />
      </Field>

      <div className="space-y-3">
        {value.items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-white/10 bg-slate-800/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Elemento {index + 1} · {item.type === 'image' ? 'Imagen' : 'Texto'}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" className="!px-2 !py-1" onClick={() => move(index, -1)}>
                  ↑
                </Button>
                <Button variant="ghost" className="!px-2 !py-1" onClick={() => move(index, 1)}>
                  ↓
                </Button>
                <Button variant="danger" className="!px-2 !py-1" onClick={() => remove(index)}>
                  ✕
                </Button>
              </div>
            </div>

            {item.type === 'image' ? (
              <>
                <ImageUrlInput
                  value={item.url}
                  onChange={(url) => updateItem(index, { ...item, url })}
                />
                <FitPicker
                  value={item.fit}
                  onChange={(fit: ImageFit) => updateItem(index, { ...item, fit })}
                />
              </>
            ) : (
              <>
                <TextInput
                  value={item.title}
                  placeholder="Título"
                  onChange={(e) => updateItem(index, { ...item, title: e.target.value })}
                />
                <TextArea
                  rows={2}
                  value={item.body}
                  placeholder="Texto"
                  onChange={(e) => updateItem(index, { ...item, body: e.target.value })}
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => add('text')}>
          + Texto
        </Button>
        <Button variant="secondary" onClick={() => add('image')}>
          + Imagen
        </Button>
      </div>
    </div>
  );
}

function defaultContent(type: MainContent['type']): MainContent {
  switch (type) {
    case 'image':
      return { type: 'image', url: '', fit: 'contain' };
    case 'carousel':
      return {
        type: 'carousel',
        secondsPerItem: 8,
        items: [{ type: 'text', title: 'Novedades del box', body: 'Edita esta diapositiva.' }],
      };
    case 'timer':
      return { type: 'timer', timer: emptyTimer() };
    default:
      return { type: 'text', title: 'WOD DE HOY', body: '' };
  }
}
