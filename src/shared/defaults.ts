import type {
  AdPlaylist,
  BrandConfig,
  Screen,
  TimerConfig,
  TimerState,
} from './types/signage';

/** Stable screen ids created for every box from day one. */
export const DEFAULT_SCREEN_IDS = ['wod'] as const;

export const DEFAULT_BRAND: BrandConfig = {
  logoUrl: '',
  primaryColor: '#f97316',
  secondaryColor: '#0ea5e9',
  background: 'black',
  showClock: true,
};

export const DEFAULT_ADS: AdPlaylist = {
  enabled: false,
  items: [],
  secondsPerAd: 10,
  pauseDuringTimer: true,
};

export function screenNameFromId(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function emptyTimer(): TimerState {
  return {
    status: 'idle',
    mode: 'countdown',
    workSeconds: 0,
    restSeconds: 0,
    rounds: 1,
    currentRound: 1,
    startedAt: null,
    pausedAt: null,
  };
}

export function timerFromConfig(config: TimerConfig, now: number): TimerState {
  return {
    status: 'running',
    mode: config.mode,
    workSeconds: Math.max(0, Math.floor(config.workSeconds)),
    restSeconds: Math.max(0, Math.floor(config.restSeconds)),
    rounds: Math.max(1, Math.floor(config.rounds)),
    currentRound: 1,
    startedAt: now,
    pausedAt: null,
  };
}

export function createDefaultScreen(id: string, gymId: string): Screen {
  return {
    id,
    name: screenNameFromId(id),
    gymId,
    brand: { ...DEFAULT_BRAND },
    main: {
      type: 'text',
      title: 'WOD DE HOY',
      body: 'Añade el entrenamiento desde el panel de administración.',
    },
    ads: { ...DEFAULT_ADS },
    updatedAt: 0,
  };
}
