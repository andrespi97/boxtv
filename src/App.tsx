import { Navigate, Route, Routes } from 'react-router-dom';
import { TvPlayer } from '@/tv/pages/TvPlayer';
import { Dashboard } from '@/admin/pages/Dashboard';
import { ScreenEditor } from '@/admin/pages/ScreenEditor';
import { AdminGate } from '@/admin/components/AdminGate';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
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
