import type { TimerView as TimerViewData } from '@/shared/timer';
import { formatTime } from '@/shared/timer';

type TimerViewProps = {
  view: TimerViewData;
  primaryColor: string;
  secondaryColor: string;
};

export function TimerView({ view, primaryColor, secondaryColor }: TimerViewProps) {
  const isRest = view.phase === 'rest';
  const isFinished = view.phase === 'finished';
  const isPaused = view.phase === 'paused';
  const danger = view.remaining <= 5 && view.remaining > 0 && view.phase !== 'idle';
  const accent = isRest ? secondaryColor : primaryColor;

  const timeText = isFinished ? 'FIN' : formatTime(view.remaining);
  const showProgress = view.phaseTotal > 0;
  const progressPct = Math.round(view.progress * 100);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-[3cqh] px-[4cqw]">
      {/* Round indicator */}
      <div className="flex items-center gap-[2cqw] text-[2.6cqh] font-bold uppercase tracking-[0.3em]">
        <span style={{ color: accent }}>{isPaused ? 'PAUSA' : view.label}</span>
        {view.mode === 'intervals' && (
          <span className="text-white/50">
            Ronda {view.round}/{view.rounds}
          </span>
        )}
        {view.mode === 'amrap' && (
          <span className="text-white/50">Objetivo {view.rounds} rondas</span>
        )}
      </div>

      {/* Giant digits */}
      <div
        className={`font-black leading-none tabular-nums ${danger ? 'timer-danger' : ''}`}
        style={{
          fontSize: 'clamp(3.5rem, 26cqh, 22rem)',
          color: isFinished ? accent : danger ? '#ef4444' : '#ffffff',
        }}
      >
        {timeText}
      </div>

      {/* Progress bar */}
      {showProgress && !isFinished && (
        <div className="h-[2cqh] w-[70cqw] max-w-[70cqw] overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-200 ease-linear"
            style={{ width: `${progressPct}%`, background: accent }}
          />
        </div>
      )}
    </div>
  );
}
