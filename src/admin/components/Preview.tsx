import type { Screen } from '@/shared/types/signage';
import { adsHeightPct } from '@/shared/defaults';
import { useTimerActive } from '@/shared/hooks/useTimer';
import { HeaderBar } from '@/tv/components/HeaderBar';
import { MainStage } from '@/tv/components/MainStage';
import { AdBar } from '@/tv/components/AdBar';

/** Renders the real TV layout inside a 16:9 box for live preview. */
export function Preview({ screen }: { screen: Screen }) {
  const activeTimer = screen.main.type === 'timer' ? screen.main.timer : null;
  const timerRunning = useTimerActive(activeTimer);

  return (
    <div className="tv-preview shadow-2xl ring-1 ring-white/10">
      <div className="flex h-full w-full flex-col bg-black">
        <HeaderBar brand={screen.brand} screenName={screen.name} />
        <MainStage main={screen.main} brand={screen.brand} />
        <AdBar
          ads={screen.ads}
          brand={screen.brand}
          heightPct={adsHeightPct(screen.brand)}
          compact={Boolean(timerRunning && screen.ads.pauseDuringTimer)}
        />
      </div>
    </div>
  );
}
