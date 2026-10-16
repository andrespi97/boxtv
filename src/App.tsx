import { Navigate, Route, Routes } from 'react-router-dom';
import { TvPlayer } from '@/tv/pages/TvPlayer';
import { Dashboard } from '@/admin/pages/Dashboard';
import { ScreenEditor } from '@/admin/pages/ScreenEditor';
import { AdminGate } from '@/admin/components/AdminGate';
import { DEFAULT_SCREEN_IDS } from '@/shared/defaults';

/**
 * Single-tele box: the root and the short `/w` alias open the one TV, so on the
 * device you only need to type the bare domain (or `domain/w`). The panel lives
 * at `/admin`.
 */
const HOME_SCREEN = DEFAULT_SCREEN_IDS[0];
const tvHome = `/tv/${HOME_SCREEN}`;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={tvHome} replace />} />
      <Route path="/w" element={<Navigate to={tvHome} replace />} />
      <Route path="/tv" element={<Navigate to={tvHome} replace />} />
      <Route
        path="/admin"
        element={
          <AdminGate>
            <Dashboard />
          </AdminGate>
        }
      />
      <Route
        path="/admin/:screenId"
        element={
          <AdminGate>
            <ScreenEditor />
          </AdminGate>
        }
      />
      <Route path="/tv/:screenId" element={<TvPlayer />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
