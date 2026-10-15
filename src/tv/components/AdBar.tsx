import { useEffect, useMemo, useState } from 'react';
import type { AdItem, AdPlaylist, BrandConfig } from '@/shared/types/signage';
import { withAlpha } from '@/shared/color';

type AdBarProps = {
  ads: AdPlaylist;
  brand: BrandConfig;
  /** When true the bar collapses to give the timer full attention. */
  compact?: boolean;
};

export function AdBar({ ads, brand, compact = false }: AdBarProps) {
  const items = useMemo(() => ads.items.filter((item) => hasContent(item)), [ads.items]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [items.length, ads.secondsPerAd]);

  useEffect(() => {
    if (!ads.enabled || items.length <= 1 || compact) return;
    const duration = Math.max(3, ads.secondsPerAd || 10) * 1000;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, duration);
    return () => clearInterval(interval);
  }, [ads.enabled, items.length, ads.secondsPerAd, compact]);

  if (!ads.enabled || items.length === 0) return null;

  const item = items[Math.min(index, items.length - 1)];

  return (
    <footer
      className="relative overflow-hidden border-t"
      style={{
        height: compact ? '8cqh' : '20cqh',
        minHeight: compact ? 48 : 90,
        borderColor: withAlpha(brand.primaryColor, 0.35),
        background: `linear-gradient(180deg, ${withAlpha(brand.primaryColor, 0.08)}, #000 90%)`,
      }}
    >
      <div key={index} className="ad-enter h-full w-full">
        <AdContent item={item} brand={brand} compact={compact} />
      </div>

      {items.length > 1 && (
        <div className="absolute right-[2cqw] top-1/2 flex -translate-y-1/2 gap-1.5">
          {items.map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: i === index ? brand.primaryColor : 'rgba(255,255,255,0.3)' }}
            />
          ))}
        </div>
      )}
    </footer>
  );
}

function AdContent({
  item,
  brand,
  compact,
}: {
  item: AdItem;
  brand: BrandConfig;
  compact: boolean;
}) {
  if (item.type === 'image') {
    return (
      <div className="flex h-full w-full items-center justify-center px-[2cqw] py-[1.5cqh]">
        <img
          src={item.url}
          alt="Publicidad"
          className="h-full max-h-full w-auto max-w-[90%] object-contain"
          style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center gap-[2cqw] px-[3cqw]">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          className="h-[80%] w-auto max-w-[14cqw] object-contain"
          style={{ display: compact ? 'none' : undefined }}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span
          className="truncate font-black uppercase leading-tight"
          style={{
            fontSize: compact ? 'clamp(0.8rem, 3.2cqh, 2rem)' : 'clamp(1rem, 5cqh, 3.2rem)',
            color: brand.primaryColor,
          }}
        >
          {item.title}
        </span>
        {item.subtitle && !compact && (
          <span
            className="truncate text-white/80"
            style={{ fontSize: 'clamp(0.7rem, 3cqh, 2rem)' }}
          >
            {item.subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

function hasContent(item: AdItem): boolean {
  if (item.type === 'image') return Boolean(item.url);
  return Boolean(item.title);
}
