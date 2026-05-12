import React from "react";

const ROLES = [
  { id: "admin", icon: "🎛️", label: "Диспетчер", desc: "Управление всеми заказами" },
  { id: "restaurant", icon: "🍳", label: "Заведение", desc: "Очередь на кухне" },
  { id: "courier", icon: "🛵", label: "Курьер", desc: "Взять и доставить" },
  { id: "client", icon: "🛍️", label: "Клиент", desc: "Создать заказ и отслеживать" },
  { id: "analytics", icon: "📊", label: "Аналитика", desc: "Графики и статистика" },
];

export default function RoleSelect({ onSelect }) {
  return (
    <div className="role-screen">
      <div className="role-hero">
        <span className="role-logo">⚡</span>
        <h1>Delivery OS</h1>
        <p>Выберите роль для входа</p>
      </div>
      <div className="role-grid">
        {ROLES.map((r) => (
          <button key={r.id} className="role-card" onClick={() => onSelect(r.id)}>
            <span className="role-icon">{r.icon}</span>
            <strong>{r.label}</strong>
            <span>{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
