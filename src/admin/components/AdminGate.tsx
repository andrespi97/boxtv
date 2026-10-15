import { useEffect, useState, type ReactNode } from 'react';
import { getAdminKey, setAdminKey, signageClient } from '@/shared/api/signageClient';

type AuthState = 'checking' | 'authorized' | 'locked';

/**
 * Lightweight shared-secret gate for the admin panel.
 *
 * If the Worker has no `ADMIN_KEY` configured the API accepts any request and
 * the panel opens directly (handy for local development).
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('checking');
  const [error, setError] = useState<string | null>(null);

  const validate = async (key: string) => {
    if (key) setAdminKey(key);
    try {
      await signageClient.listScreens();
      setState('authorized');
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
      if (message.toLowerCase().includes('unauthorized')) {
        setError('Clave incorrecta');
      } else {
        setError(message);
      }
      setState('locked');
    }
  };

  useEffect(() => {
    void validate(getAdminKey());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'checking') {
    return (
      <div className="admin-scroll grid min-h-screen place-items-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  if (state === 'authorized') return <>{children}</>;

  return <KeyScreen error={error} onUnlock={validate} />;
}

function KeyScreen({
  error,
  onUnlock,
}: {
  error: string | null;
  onUnlock: (key: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <div className="admin-scroll flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUnlock(value.trim());
        }}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6"
      >
        <div>
          <h1 className="text-xl font-bold">Panel de administración</h1>
          <p className="text-sm text-slate-400">Introduce la clave del box para continuar.</p>
        </div>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Clave secreta"
          className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-orange-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-orange-500 px-4 py-3 font-semibold text-black hover:bg-orange-400"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
