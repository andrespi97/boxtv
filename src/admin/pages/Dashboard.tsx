import { Link } from 'react-router-dom';
import type { MainContent, Screen, ScreenRuntimeStatus } from '@/shared/types/signage';
import { useAdminScreens } from '@/admin/hooks/useAdminScreens';
import { tvPath } from '@/shared/api/signageClient';
import { Button } from '@/admin/components/ui';
import { Preview } from '@/admin/components/Preview';
import { formatRelative } from '@/admin/components/StatusPanel';

const MAIN_LABELS: Record<MainContent['type'], string> = {
  text: 'Texto / WOD',
  image: 'Imagen',
  carousel: 'Carrusel',
  timer: 'Temporizador',
};

export function Dashboard() {
  const { data, error, loading, refresh } = useAdminScreens();

  return (
    <div className="admin-scroll min-h-screen bg-slate-950 pb-16 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 px-[4vw] py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-base font-black text-black shadow-lg shadow-orange-500/20">
              B
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight">Box TV</h1>
              <p className="truncate text-xs text-slate-400">
                {data ? `Gimnasio: ${data.gymId}` : 'Cargando…'}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => void refresh()}>
            Actualizar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-[4vw] py-6">
        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading && <p className="text-sm text-slate-400">Cargando pantallas…</p>}

        {data?.screens.map((screen) => {
          const status = data.statuses.find((s) => s.screenId === screen.id);
          return <ScreenCard key={screen.id} screen={screen} status={status} />;
        })}
      </main>
    </div>
  );
}

function ScreenCard({
  screen,
  status,
}: {
  screen: Screen;
  status: ScreenRuntimeStatus | undefined;
}) {
  const connected = status?.connected ?? false;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-xl shadow-black/40">
      {/* Live mirror of what the TV is showing right now. */}
      <div className="p-3 pb-0">
        <Preview screen={screen} />
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/60 text-slate-300'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? 'animate-pulse bg-emerald-400' : 'bg-slate-400'}`}
          />
          {connected ? 'En vivo' : 'Desconectada'}
        </span>

        <span className="truncate text-xs text-slate-500">
          {MAIN_LABELS[screen.main.type]}
          {status?.lastSeen ? ` · ${formatRelative(status.lastSeen)}` : ''}
        </span>

        <div className="ml-auto flex shrink-0 gap-2">
          <a
            href={tvPath(screen.id)}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
          >
            Ver
          </a>
          <Link
            to={`/admin/${screen.id}`}
            className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-orange-400"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}
