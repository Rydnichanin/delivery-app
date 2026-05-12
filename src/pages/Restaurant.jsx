import React from "react";
import { useOrders, updateOrder } from "../data/ordersStore";
import { statusLabel, statusColor } from "../data/statuses";

export default function Restaurant() {
  const { orders, loading } = useOrders();
  const queue = orders.filter((o) => ["new", "cooking", "ready"].includes(o.status));

  return (
    <div className="page">
      <header className="page-header">
        <h1>🍳 Заведение</h1>
        <span className="badge">{queue.length} в очереди</span>
      </header>

      {loading && <div className="loader">Загрузка...</div>}

      <div className="order-list">
        {queue.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-card-top">
              <div>
                <p className="order-restaurant">{order.restaurantName}</p>
                <p className="order-address">📍 {order.address}</p>
                <p className="order-client">👤 {order.clientName}</p>
              </div>
              <span
                className="status-pill"
                style={{ background: statusColor(order.status) + "33", color: statusColor(order.status) }}
              >
                {statusLabel(order.status)}
              </span>
            </div>
            <div className="order-actions">
              {order.status === "new" && (
                <button className="btn btn-amber" onClick={() => updateOrder(order.id, { status: "cooking" })}>
                  ▶ Начать готовку
                </button>
              )}
              {order.status === "cooking" && (
                <button className="btn btn-green" onClick={() => updateOrder(order.id, { status: "ready" })}>
                  ✓ Готов к выдаче
                </button>
              )}
              {order.status === "ready" && (
                <div className="waiting-label">⏳ Ожидание курьера</div>
              )}
            </div>
          </div>
        ))}
        {!loading && queue.length === 0 && <div className="empty">Очередь пуста 🎉</div>}
      </div>
    </div>
  );
}
