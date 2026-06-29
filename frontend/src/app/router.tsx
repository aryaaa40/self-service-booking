import { createBrowserRouter } from 'react-router-dom';
import KioskPage from '../features/kiosk/pages/KioskPage';
import AdminPage from '../features/admin/pages/AdminPage';

export const router = createBrowserRouter([
  { path: '/', element: <KioskPage /> },
  { path: '/admin', element: <AdminPage /> },
]);
