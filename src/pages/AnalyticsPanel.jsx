import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useOrders } from "../data/ordersStore";
import { statusLabel } from "../data/statuses";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#6b7280"];

export default function AnalyticsPanel() {
  const { orders, loading } = useOrders();

  const revenue = useMemo(
    () => orders.filter((o) => o.status === "delivered").reduce((s, o) => s + (o.price || 0), 0),
    [orders]
  );

  const statusData = useMemo(() => {
    const map = {};
    orders.forEach((o) => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([status, value]) => ({ name: statusLabel(status), value }));
  }, [orders]);

  const restaurantData = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (o.restaurantName) map[o.restaurantName] = (map[o.restaurantName] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, orders]) => ({ name, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6);
  }, [orders]);

  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const activeCount = orders.filter((o) => ["new", "cooking", "ready", "delivering"].includes(o.status)).length;

  return (
    <div className="page">
      <header className="page-header">
        <h1>📊 Аналитика</h1>
      </header>

      {loading && <div className="loader">Загрузка...</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Всего заказов</p>
          <p className="stat-value">{orders.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Активные</p>
          <p className="stat-value" style={{ color: "#f59e0b" }}>{activeCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Доставлено</p>
          <p className="stat-value" style={{ color: "#10b981" }}>{deliveredCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Выручка</p>
          <p className="stat-value" style={{ color: "#6366f1" }}>
            {revenue.toLocaleString()} ₸
          </p>
        </div>
      </div>

      {statusData.length > 0 && (
        <div className="chart-card">
          <h2 className="section-title">Распределение по статусам</h2>
          <PieChart width={320} height={220}>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {statusData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }} />
            <Legend />
          </PieChart>
        </div>
      )}

      {restaurantData.length > 0 && (
        <div className="chart-card">
          <h2 className="section-title">Топ заведений</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={restaurantData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }} />
              <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="empty">Нет данных — создайте несколько заказов</div>
      )}
    </div>
  );
}
