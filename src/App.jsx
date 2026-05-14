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
import Register from "./pages/Register.jsx";

// Простой внутренний роутер без react-router-dom
function ClientApp() {
  const [page, setPage] = useState("store"); // "store" | "checkout" | "profile" | "login" | "register"
  const [cart, setCart] = useState([]);
  const { user, profile, logout } = useAuth();

  const navigate = (to) => setPage(to);

  if (page === "login")    return <Login onSuccess={() => navigate("profile")} onRegister={() => navigate("register")} />;
  if (page === "register") return <Register onSuccess={() => navigate("profile")} onBack={() => navigate("login")} />;
  if (page === "checkout") return <Checkout cart={cart} onBack={() => navigate("store")} onSuccess={() => { setCart([]); navigate("profile"); }} />;
  if (page === "profile")  return <ClientProfile onBack={() => navigate("store")} onLogout={() => { logout(); navigate("store"); }} />;

  // store — default
  return (
    <PublicStore
      cart={cart}
      setCart={setCart}
      onCheckout={() => navigate("checkout")}
      onProfile={() => navigate(user ? "profile" : "login")}
    />
  );
}

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

  // Не авторизован — публичный магазин
  if (!user) return <ClientApp />;

  // Авторизован, но нет профиля
  if (!profile) return <NoProfile user={user} />;

  const role = profile.role;

  if (role === "superadmin")  return <SuperAdmin />;
  if (role === "director")    return <Director />;
  if (role === "dispatcher")  return <Admin />;
  if (role === "restaurant")  return <Restaurant />;
  if (role === "courier")     return <Courier />;
  if (role === "analytics")   return <AnalyticsPanel />;
  if (role === "client")      return <ClientApp />;

  // Неизвестная роль — магазин
  return <ClientApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
    }
  
