import type { AdItem, AdPlaylist, ImageFit } from '@/shared/types/signage';
import { Button, Field, FitPicker, ImageUrlInput, TextInput, Toggle } from './ui';

type AdsEditorProps = {
  value: AdPlaylist;
  onChange: (value: AdPlaylist) => void;
};

export function AdsEditor({ value, onChange }: AdsEditorProps) {
  const updateItem = (index: number, item: AdItem) => {
    onChange({ ...value, items: value.items.map((current, i) => (i === index ? item : current)) });
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

  const add = (type: AdItem['type']) => {
    const item: AdItem =
      type === 'image'
        ? { type: 'image', url: '', fit: 'contain' }
        : { type: 'text', title: '', subtitle: '' };
    onChange({ ...value, items: [...value.items, item] });
  };

  return (
    <div className="space-y-4">
      <Toggle
        label="Publicidad activada"
        checked={value.enabled}
        onChange={(enabled) => onChange({ ...value, enabled })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Segundos por anuncio">
          <TextInput
            type="number"
            min={3}
            max={120}
            value={value.secondsPerAd}
            onChange={(e) => onChange({ ...value, secondsPerAd: Number(e.target.value) || 10 })}
          />
        </Field>
      </div>

      <Toggle
        label="Ocultar/compactar durante el temporizador"
        checked={value.pauseDuringTimer}
        onChange={(pauseDuringTimer) => onChange({ ...value, pauseDuringTimer })}
      />

      <p className="text-xs text-slate-500">
        Recomendado: 3–5 anuncios, mensajes legibles en 3–5 segundos y sin mezclar con el
        temporizador activo.
      </p>

      <div className="space-y-3">
        {value.items.length === 0 && (
          <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
            Sin anuncios todavía.
          </p>
        )}
        {value.items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-white/10 bg-slate-800/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Anuncio {index + 1} · {item.type === 'image' ? 'Imagen' : 'Texto'}
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
                  placeholder="Título del anuncio"
                  onChange={(e) => updateItem(index, { ...item, title: e.target.value })}
                />
                <TextInput
                  value={item.subtitle ?? ''}
                  placeholder="Subtítulo (opcional)"
                  onChange={(e) => updateItem(index, { ...item, subtitle: e.target.value })}
                />
                <ImageUrlInput
                  value={item.imageUrl ?? ''}
                  placeholder="Logo del patrocinador (opcional)"
                  onChange={(imageUrl) => updateItem(index, { ...item, imageUrl })}
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
