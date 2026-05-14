import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NoProfile from "./pages/NoProfile.jsx";
import SuperAdmin from "./pages/SuperAdmin.jsx";
import Director from "./pages/Director.jsx";
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

  // Не авторизован — показываем магазин
  if (!user) return <Client />;

  // Авторизован но нет профиля
  if (!profile) return <NoProfile user={user} />;

  const role = profile.role;

  if (role === "superadmin")  return <SuperAdmin />;
  if (role === "director")    return <Director />;
  if (role === "dispatcher")  return <Admin />;
  if (role === "restaurant")  return <Restaurant />;
  if (role === "courier")     return <Courier />;
  if (role === "client")      return <Client />;
  if (role === "analytics")   return <AnalyticsPanel />;

  return <Client />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
