// src/App.jsx
// Root component — defines client-side routes.

import { Routes, Route } from "react-router-dom";
import SnapshotListPage from "./pages/SnapshotListPage";
import CreateSnapshotPage from "./pages/CreateSnapshotPage";
import SnapshotDetailPage from "./pages/SnapshotDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <SnapshotListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/new"
            element={
              <RequireAuth>
                <CreateSnapshotPage />
              </RequireAuth>
            }
          />
          <Route
            path="/snapshots/:id"
            element={
              <RequireAuth>
                <SnapshotDetailPage />
              </RequireAuth>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
