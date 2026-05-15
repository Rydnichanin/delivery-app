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

// ── Клиентский флоу (только для role=client или залогиненного клиента) ──
function ClientApp() {
  const [page, setPage] = useState("store"); // store | checkout | profile
  const [cart, setCart] = useState([]);
  const { logout } = useAuth();

  if (page === "checkout") {
    return (
      <Checkout
        cart={cart}
        onBack={() => setPage("store")}
        onSuccess={() => { setCart([]); setPage("profile"); }}
      />
    );
  }

  if (page === "profile") {
    return (
      <ClientProfile
        onBack={() => setPage("store")}
        onLogout={() => { logout(); }}
      />
    );
  }

  return (
    <PublicStore
      user={true}
      cart={cart}
      setCart={setCart}
      onLoginRequired={() => setPage("profile")}
    />
  );
}

// ── Публичный флоу (не авторизован) ──
function PublicApp() {
  const [page, setPage] = useState("store"); // store | login | checkout
  const [cart, setCart] = useState([]);

  // Когда гость нажимает корзину — идёт на логин
  // После входа Firebase обновит user → AppRouter автоматически
  // перерендерится и покажет нужный дашборд или ClientApp

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

  return (
    <PublicStore
      user={null}
      cart={cart}
      setCart={setCart}
      onLoginRequired={() => setPage("login")}
    />
  );
}

// ── Главный роутер ──
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

  // Не авторизован — публичный магазин + логин
  if (!user) return <PublicApp />;

  // Авторизован, профиль грузится
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

  return <NoProfile user={user} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
