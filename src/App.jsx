import React, { useState } from "react";
import RoleSelect from "./pages/RoleSelect.jsx";
import Admin from "./pages/Admin.jsx";
import Client from "./pages/Client.jsx";
import Courier from "./pages/Courier.jsx";
import Restaurant from "./pages/Restaurant.jsx";
import AnalyticsPanel from "./pages/AnalyticsPanel.jsx";

const ROLE_LABELS = {
  admin: "🎛️ Диспетчер",
  restaurant: "🍳 Заведение",
  courier: "🛵 Курьер",
  client: "🛍️ Клиент",
  analytics: "📊 Аналитика",
};

export default function App() {
  const [role, setRole] = useState(null);

  if (!role) return <RoleSelect onSelect={setRole} />;

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <span className="nav-logo">⚡ Delivery OS</span>
        <span className="nav-role">{ROLE_LABELS[role]}</span>
        <button className="nav-exit" onClick={() => setRole(null)}>Выйти</button>
      </nav>

      <main className="main-content">
        {role === "admin" && <Admin />}
        {role === "restaurant" && <Restaurant />}
        {role === "courier" && <Courier />}
        {role === "client" && <Client />}
        {role === "analytics" && <AnalyticsPanel />}
      </main>
    </div>
  );
}
