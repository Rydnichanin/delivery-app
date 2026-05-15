import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NoProfile from "./pages/NoProfile.jsx";
import SuperAdmin from "./pages/SuperAdmin.jsx";
import Director from "./pages/Director.jsx";
import Admin from "./pages/Admin.jsx";
import Restaurant from "./pages/Restaurant.jsx";
import Courier from "./pages/Courier.jsx";
import AnalyticsPanel from "./pages/AnalyticsPanel.jsx";
import PublicStore from "./pages/PublicStore.jsx";
import Checkout from "./pages/Checkout.jsx";
import ClientProfile from "./pages/ClientProfile.jsx";
import Login from "./pages/Login.jsx";

// ── Клиентский флоу: магазин → логин → профиль → оформление ──
function ClientApp() {
  const [page, setPage] = useState("store"); // store | login | checkout | profile
  const [cart, setCart] = useState([]);
  const { user, logout } = useAuth();

  // Login.jsx не принимает onSuccess — следим за user через useEffect.
  // Когда Firebase обновит user после входа — переходим в profile.
  React.useEffect(() => {
    if (user && page === "login") {
      setPage("profile");
    }
  }, [user, page]);

  // ── Логин (Login управляет Register внутри себя) ──
  if (page === "login") {
    return (
      <div>
        <div style={{ padding: "12px 16px" }}>
          <button className="btn-link" onClick={() => setPage("store")}>
            ← Вернуться в магазин
          </button>
        </div>
        <Login />
      </div>
    );
  }

  // ── Оформление заказа ──
  if (page === "checkout") {
    return (
      <Checkout
        cart={cart}
        onBack={() => setPage("store")}
        onSuccess={() => { setCart([]); setPage("profile"); }}
      />
    );
  }

  // ── Профиль клиента ──
  if (page === "profile") {
    return (
      <ClientProfile
        onBack={() => setPage("store")}
        onLogout={() => { logout(); setPage("store"); }}
      />
    );
  }

  // ── Магазин (default) ──
  // PublicStore ожидает: user, cart, setCart, onLoginRequired
  // onLoginRequired вызывается когда гость нажимает "Оформить"
  return (
    <PublicStore
      user={user}
      cart={cart}
      setCart={setCart}
      onLoginRequired={() => setPage("login")}
    />
  );
}

// ── Главный роутер по роли ──
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

  // Не авторизован — публичный магазин с кнопкой "войти"
  if (!user) return <ClientApp />;

  // Авторизован, профиль ещё грузится
  if (!profile) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">⚡</div>
          <p style={{ color: "var(--muted)", textAlign: "center" }}>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  const role = profile.role;

  if (role === "superadmin")  return <SuperAdmin />;
  if (role === "director")    return <Director />;
  if (role === "dispatcher")  return <Admin />;
  if (role === "restaurant")  return <Restaurant />;
  if (role === "courier")     return <Courier />;
  if (role === "analytics")   return <AnalyticsPanel />;
  if (role === "client")      return <ClientApp />;

  // Профиль есть, но роль неизвестна
  return <NoProfile user={user} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
