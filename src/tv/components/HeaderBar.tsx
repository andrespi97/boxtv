import type { BrandConfig } from '@/shared/types/signage';
import { isSafeImageUrl, withAlpha } from '@/shared/color';
import { useClock } from '@/shared/hooks/useClock';

type HeaderBarProps = {
  brand: BrandConfig;
  screenName: string;
};

const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function HeaderBar({ brand, screenName }: HeaderBarProps) {
  const now = useClock();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const date = DATE_FORMAT.format(now);

  return (
    <header
      className="flex h-[10cqh] min-h-[64px] items-center justify-between px-[3cqw]"
      style={{
        borderBottom: `2px solid ${withAlpha(brand.primaryColor, 0.5)}`,
        background: `linear-gradient(180deg, ${withAlpha(brand.primaryColor, 0.12)}, transparent)`,
      }}
    >
      <div className="flex min-w-0 items-center gap-[2cqw]">
        {brand.logoUrl && isSafeImageUrl(brand.logoUrl) ? (
          <img
            src={brand.logoUrl}
            alt="Logo"
            className="h-[6cqh] max-h-[80px] w-auto object-contain"
          />
        ) : (
          <div
            className="grid h-[6cqh] max-h-[80px] min-w-[6cqh] place-items-center rounded-xl px-4 text-[2cqh] font-black uppercase tracking-wider"
            style={{ background: withAlpha(brand.primaryColor, 0.9), color: '#000' }}
          >
            {screenName.split(' ')[0] || 'BOX'}
          </div>
        )}
        <span className="truncate text-[2.4cqh] font-semibold uppercase tracking-[0.2em] text-white/70">
          {screenName}
        </span>
      </div>

      {brand.showClock && (
        <div className="flex items-baseline gap-[1.5cqw] text-right tabular-nums">
          <span className="text-[5cqh] font-black leading-none text-white">{time}</span>
          <span className="hidden text-[2cqh] font-medium capitalize text-white/60 sm:inline">
            {date}
          </span>
        </div>
      )}
    </header>
  );
}
