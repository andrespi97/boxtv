// ---------------------------------------------------------------------------
// Shared signage domain types (Fase 1)
// Used by the TV player, the mobile admin panel and the Worker/Durable Object.
// ---------------------------------------------------------------------------

export type ImageFit = 'contain' | 'cover' | 'blur-fill';

export type BrandBackground = 'black' | 'brand' | 'image';

export type BrandConfig = {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  background: BrandBackground;
  showClock: boolean;
  /** Optional background image used when `background === "image"`. */
  backgroundUrl?: string;
  /** Custom header title. Falls back to the screen name when empty. */
  headerTitle?: string;
  /** Optional line shown under the header title (e.g. the box name). */
  headerSubtitle?: string;
  /** Header height as a percentage of the screen height (default 10). */
  headerHeightPct?: number;
  /** Ad bar height as a percentage of the screen height (default 20). */
  adsHeightPct?: number;
};

export type CarouselItem =
  | { type: 'image'; url: string; fit: ImageFit }
  | { type: 'text'; title: string; body: string };

export type TimerMode = 'amrap' | 'intervals' | 'countdown';

export type TimerState = {
  status: 'idle' | 'running' | 'paused' | 'finished';
  mode: TimerMode;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  currentRound: number;
  startedAt: number | null;
  pausedAt: number | null;
};

export type TimerConfig = {
  mode: TimerMode;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
};

export type MainContent =
  | { type: 'text'; title: string; body: string }
  | { type: 'image'; url: string; fit: ImageFit }
  | { type: 'carousel'; items: CarouselItem[]; secondsPerItem: number }
  | { type: 'timer'; timer: TimerState };

export type AdItem =
  | { type: 'image'; url: string; fit: ImageFit }
  | { type: 'text'; title: string; subtitle?: string; imageUrl?: string };

export type AdPlaylist = {
  enabled: boolean;
  items: AdItem[];
  secondsPerAd: number;
  /** Hide/reduce the ad bar while a timer is running. */
  pauseDuringTimer: boolean;
};

export type Screen = {
  id: string;
  name: string;
  gymId: string;
  brand: BrandConfig;
  main: MainContent;
  ads: AdPlaylist;
  updatedAt: number;
};

// --------------------------- Realtime contract -----------------------------

export type AdminCommand =
  | { type: 'SET_BRAND'; brand: BrandConfig }
  | { type: 'SET_MAIN'; content: MainContent }
  | { type: 'SET_ADS'; ads: AdPlaylist }
  | { type: 'START_TIMER'; config: TimerConfig }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'SET_SCREEN_NAME'; name: string };

export type TvEvent =
  | { type: 'STATE_SYNC'; screen: Screen }
  | { type: 'CONTENT_CHANGED'; main: MainContent; updatedAt: number }
  | { type: 'ADS_CHANGED'; ads: AdPlaylist; updatedAt: number }
  | { type: 'BRAND_CHANGED'; brand: BrandConfig; updatedAt: number }
  | { type: 'TIMER_CHANGED'; timer: TimerState; updatedAt: number }
  | { type: 'SCREEN_NAME_CHANGED'; name: string; updatedAt: number }
  | { type: 'PONG'; ts: number };

// ------------------------------- Status ------------------------------------

export type ConnectionRole = 'tv' | 'admin';

export type ScreenRuntimeStatus = {
  screenId: string;
  connected: boolean;
  tvConnections: number;
  adminConnections: number;
  lastSeen: number | null;
};

/** List response for the admin dashboard (`GET /api/screens`). */
export type GymStatus = {
  gymId: string;
  updatedAt: number;
  screens: Screen[];
  statuses: ScreenRuntimeStatus[];
};
