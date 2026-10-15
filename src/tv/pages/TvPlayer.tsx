import { useParams } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { useScreenSocket } from '@/shared/hooks/useScreenSocket';
import { useNightlyRefresh } from '@/shared/hooks/useNightlyRefresh';
import { useFullscreen } from '@/shared/hooks/useFullscreen';
import { useIdleCursor } from '@/shared/hooks/useIdleCursor';
import { useTimerActive } from '@/shared/hooks/useTimer';
import { HeaderBar } from '@/tv/components/HeaderBar';
import { MainStage } from '@/tv/components/MainStage';
import { AdBar } from '@/tv/components/AdBar';

export function TvPlayer() {
  const { screenId = '' } = useParams();
  const { screen, status } = useScreenSocket(screenId, 'tv', Boolean(screenId));
  const idle = useIdleCursor(3000);
  const { isFullscreen, toggle } = useFullscreen();
  useNightlyRefresh(3);

  const activeTimer = screen?.main.type === 'timer' ? screen.main.timer : null;
  const timerRunning = useTimerActive(activeTimer);

  // Brand background fallback if the screen has no background configured.
  const rootStyle: CSSProperties = {
    background: screen?.brand.background === 'black' ? '#000' : undefined,
  };

  return (
    <div
      className={`tv-root flex flex-col bg-black ${idle ? 'cursor-hidden' : ''}`}
      style={rootStyle}
      onDoubleClick={() => void toggle()}
    >
      {screen ? (
        <>
          <HeaderBar brand={screen.brand} screenName={screen.name} />
          <MainStage main={screen.main} brand={screen.brand} />
          <AdBar
            ads={screen.ads}
            brand={screen.brand}
            compact={Boolean(timerRunning && screen.ads.pauseDuringTimer)}
          />
        </>
      ) : (
        <ConnectingScreen />
      )}

      {/* Connection badge: discreet, never a blank screen. */}
      {status !== 'open' && (
        <div className="pointer-events-none absolute left-1/2 top-[2cqh] z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-amber-500/90 px-4 py-1.5 text-sm font-semibold text-black shadow-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-black" />
            {status === 'connecting' ? 'Conectando…' : 'Sin conexión · reintentando'}
          </div>
        </div>
      )}

      {/* Fullscreen control, hidden until the mouse moves. */}
      <button
        type="button"
        onClick={() => void toggle()}
        className={`absolute right-[1.5cqw] top-[1.5cqh] z-50 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 backdrop-blur transition-opacity hover:bg-white/20 ${
          idle ? 'opacity-0' : 'opacity-100'
        }`}
        aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {isFullscreen ? 'Salir' : 'Pantalla completa'}
      </button>
    </div>
  );
}

function ConnectingScreen() {
  return (
    <div className="grid h-full w-full place-items-center bg-black">
      <div className="flex flex-col items-center gap-4 text-white/60">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        <span className="text-lg font-medium">Sincronizando pantalla…</span>
      </div>
    </div>
  );
}
