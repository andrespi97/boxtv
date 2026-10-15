import { useEffect, useState } from 'react';
import type { ImageFit } from '@/shared/types/signage';
import { isSafeImageUrl } from '@/shared/color';

type MediaFrameProps = {
  url: string;
  fit?: ImageFit;
  alt?: string;
  className?: string;
};

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Renders an image without ever stretching it.
 *
 * - `contain`   -> full image, letterboxed with black bars
 * - `cover`     -> fills the frame, cropping edges
 * - `blur-fill` -> blurred, zoomed copy behind a centered full image
 */
export function MediaFrame({
  url,
  fit = 'contain',
  alt = '',
  className = '',
}: MediaFrameProps) {
  const [state, setState] = useState<LoadState>(url && isSafeImageUrl(url) ? 'loading' : 'error');

  useEffect(() => {
    setState(url && isSafeImageUrl(url) ? 'loading' : 'error');
  }, [url]);

  const handleLoad = () => {
    setState('ready');
  };

  if (!url || !isSafeImageUrl(url)) {
    return <MediaPlaceholder className={className} message="Imagen no válida (usa HTTPS)" />;
  }

  if (fit === 'blur-fill') {
    return (
      <div className={`media-frame ${className}`}>
        <img
          src={url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
        />
        <div className="absolute inset-0 bg-black/40" />
        <img
          src={url}
          alt={alt}
          className="relative h-full w-full object-contain"
          onLoad={handleLoad}
          onError={() => setState('error')}
        />
        {state === 'loading' && <Spinner />}
        {state === 'error' && <ErrorOverlay />}
      </div>
    );
  }

  return (
    <div className={`media-frame ${className}`}>
      <img
        src={url}
        alt={alt}
        className="h-full w-full"
        style={{ objectFit: fit }}
        onLoad={handleLoad}
        onError={() => setState('error')}
      />
      {state === 'loading' && <Spinner />}
      {state === 'error' && <ErrorOverlay />}
    </div>
  );
}

export function MediaPlaceholder({
  className = '',
  message,
}: {
  className?: string;
  message: string;
}) {
  return (
    <div className={`media-frame ${className}`}>
      <div className="flex flex-col items-center gap-3 text-white/40">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    </div>
  );
}

function ErrorOverlay() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/60">
      <span className="text-sm text-white/60">No se pudo cargar la imagen</span>
    </div>
  );
}
