// ---------------------------------------------------------------------------
// Runtime validation for `AdminCommand` payloads coming from the client.
//
// The Durable Object persists whatever it receives, so a malformed command
// (e.g. a `SET_BRAND` without `brand`) would corrupt the stored `Screen` and
// later crash the TV. These guards reject unknown/invalid shapes before they
// touch storage.
// ---------------------------------------------------------------------------

import type {
  AdItem,
  AdPlaylist,
  AdminCommand,
  BrandConfig,
  CarouselItem,
  ImageFit,
  MainContent,
  TimerConfig,
  TimerMode,
  TimerState,
} from '../src/shared/types/signage';

const IMAGE_FITS: readonly string[] = ['contain', 'cover', 'blur-fill'];
const BRAND_BACKGROUNDS: readonly string[] = ['black', 'brand', 'image'];
const TIMER_MODES: readonly string[] = ['amrap', 'intervals', 'countdown'];
const TIMER_STATUSES: readonly string[] = ['idle', 'running', 'paused', 'finished'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOneOf<T extends string>(value: unknown, allowed: readonly string[]): value is T {
  return isString(value) && allowed.includes(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || isFiniteNumber(value);
}

function isBrandConfig(value: unknown): value is BrandConfig {
  if (!isObject(value)) return false;
  return (
    isString(value.logoUrl) &&
    isString(value.primaryColor) &&
    isString(value.secondaryColor) &&
    isOneOf(value.background, BRAND_BACKGROUNDS) &&
    typeof value.showClock === 'boolean' &&
    isOptionalString(value.backgroundUrl) &&
    isOptionalString(value.headerTitle) &&
    isOptionalString(value.headerSubtitle) &&
    isOptionalNumber(value.headerHeightPct) &&
    isOptionalNumber(value.adsHeightPct)
  );
}

function isCarouselItem(value: unknown): value is CarouselItem {
  if (!isObject(value)) return false;
  if (value.type === 'image') return isString(value.url) && isOneOf<ImageFit>(value.fit, IMAGE_FITS);
  if (value.type === 'text') return isString(value.title) && isString(value.body);
  return false;
}

function isTimerState(value: unknown): value is TimerState {
  if (!isObject(value)) return false;
  return (
    isOneOf<TimerState['status']>(value.status, TIMER_STATUSES) &&
    isOneOf<TimerMode>(value.mode, TIMER_MODES) &&
    isFiniteNumber(value.workSeconds) &&
    isFiniteNumber(value.restSeconds) &&
    isFiniteNumber(value.rounds) &&
    isFiniteNumber(value.currentRound) &&
    (value.startedAt === null || isFiniteNumber(value.startedAt)) &&
    (value.pausedAt === null || isFiniteNumber(value.pausedAt))
  );
}

function isMainContent(value: unknown): value is MainContent {
  if (!isObject(value)) return false;
  switch (value.type) {
    case 'text':
      return isString(value.title) && isString(value.body);
    case 'image':
      return isString(value.url) && isOneOf<ImageFit>(value.fit, IMAGE_FITS);
    case 'carousel':
      return (
        Array.isArray(value.items) &&
        value.items.every(isCarouselItem) &&
        isFiniteNumber(value.secondsPerItem)
      );
    case 'timer':
      return isTimerState(value.timer);
    default:
      return false;
  }
}

function isAdItem(value: unknown): value is AdItem {
  if (!isObject(value)) return false;
  if (value.type === 'image') return isString(value.url) && isOneOf<ImageFit>(value.fit, IMAGE_FITS);
  if (value.type === 'text') {
    return (
      isString(value.title) &&
      isOptionalString(value.subtitle) &&
      isOptionalString(value.imageUrl)
    );
  }
  return false;
}

function isAdPlaylist(value: unknown): value is AdPlaylist {
  if (!isObject(value)) return false;
  return (
    typeof value.enabled === 'boolean' &&
    Array.isArray(value.items) &&
    value.items.every(isAdItem) &&
    isFiniteNumber(value.secondsPerAd) &&
    typeof value.pauseDuringTimer === 'boolean'
  );
}

function isTimerConfig(value: unknown): value is TimerConfig {
  if (!isObject(value)) return false;
  return (
    isOneOf<TimerMode>(value.mode, TIMER_MODES) &&
    isFiniteNumber(value.workSeconds) &&
    isFiniteNumber(value.restSeconds) &&
    isFiniteNumber(value.rounds)
  );
}

/** Returns the validated command, or `null` if the payload is not a valid one. */
export function parseAdminCommand(value: unknown): AdminCommand | null {
  if (!isObject(value) || !isString(value.type)) return null;

  switch (value.type) {
    case 'SET_BRAND':
      return isBrandConfig(value.brand) ? { type: 'SET_BRAND', brand: value.brand } : null;
    case 'SET_MAIN':
      return isMainContent(value.content) ? { type: 'SET_MAIN', content: value.content } : null;
    case 'SET_ADS':
      return isAdPlaylist(value.ads) ? { type: 'SET_ADS', ads: value.ads } : null;
    case 'START_TIMER':
      return isTimerConfig(value.config) ? { type: 'START_TIMER', config: value.config } : null;
    case 'PAUSE_TIMER':
      return { type: 'PAUSE_TIMER' };
    case 'RESUME_TIMER':
      return { type: 'RESUME_TIMER' };
    case 'STOP_TIMER':
      return { type: 'STOP_TIMER' };
    case 'RESET_TIMER':
      return { type: 'RESET_TIMER' };
    case 'SET_SCREEN_NAME':
      return isString(value.name) ? { type: 'SET_SCREEN_NAME', name: value.name } : null;
    default:
      return null;
  }
}
