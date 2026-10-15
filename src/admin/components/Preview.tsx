import type { CSSProperties } from 'react';
import type { Screen } from '@/shared/types/signage';
import { toRgbChannels } from '@/shared/color';
import { HeaderBar } from '@/tv/components/HeaderBar';
import { MainStage } from '@/tv/components/MainStage';
import { AdBar } from '@/tv/components/AdBar';

/** Renders the real TV layout inside a 16:9 box for live preview. */
export function Preview({ screen }: { screen: Screen }) {
  const style: CSSProperties = {
    '--brand-primary': toRgbChannels(screen.brand.primaryColor),
    '--brand-secondary': toRgbChannels(screen.brand.secondaryColor),
  } as CSSProperties;

  const timerRunning =
    screen.main.type === 'timer' &&
    (screen.main.timer.status === 'running' || screen.main.timer.status === 'paused');

  return (
    <div className="tv-preview shadow-2xl ring-1 ring-white/10" style={style}>
      <div className="flex h-full w-full flex-col bg-black">
        <HeaderBar brand={screen.brand} screenName={screen.name} />
        <MainStage main={screen.main} brand={screen.brand} />
        <AdBar
          ads={screen.ads}
          brand={screen.brand}
          compact={Boolean(timerRunning && screen.ads.pauseDuringTimer)}
        />
      </div>
    </div>
  );
}
