import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login.jsx";
import NoProfile from "./pages/NoProfile.jsx";
import SuperAdmin from "./pages/SuperAdmin.jsx";
import Admin from "./pages/Admin.jsx";
import Restaurant from "./pages/Restaurant.jsx";
import Courier from "./pages/Courier.jsx";
import Client from "./pages/Client.jsx";
import AnalyticsPanel from "./pages/AnalyticsPanel.jsx";

function AppRouter() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">⚡</div>
          <p style={{ color: "var(--muted)", textAlign: "center" }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Не авторизован
  if (!user) return <Login />;

  // Авторизован, но роль не назначена
  if (!profile) return <NoProfile user={user} />;

  // Маршрутизация по роли
  const role = profile.role;

  if (role === "superadmin") return <SuperAdmin />;
  if (role === "director")   return <Admin />;        // Временно Admin, потом отдельная страница
  if (role === "dispatcher") return <Admin />;
  if (role === "restaurant") return <Restaurant />;
  if (role === "courier")    return <Courier />;
  if (role === "analytics")  return <AnalyticsPanel />;

  return <NoProfile user={user} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
