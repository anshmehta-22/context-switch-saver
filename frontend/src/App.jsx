// src/App.jsx
// Root component — defines client-side routes.

import { Routes, Route } from 'react-router-dom';
import SnapshotListPage   from './pages/SnapshotListPage';
import CreateSnapshotPage from './pages/CreateSnapshotPage';
import SnapshotDetailPage from './pages/SnapshotDetailPage';
import Layout             from './components/Layout';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"                 element={<SnapshotListPage />}   />
        <Route path="/new"              element={<CreateSnapshotPage />} />
        <Route path="/snapshots/:id"    element={<SnapshotDetailPage />} />
      </Routes>
    </Layout>
  );
}