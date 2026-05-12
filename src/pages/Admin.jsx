import React, { useState } from "react";
import { useOrders, updateOrder } from "../data/ordersStore";
import { STATUS_FLOW, statusLabel, statusColor } from "../data/statuses";

const ALL_STATUSES = ["all", "new", "cooking", "ready", "delivering", "delivered"];

export default function Admin() {
  const { orders, loading } = useOrders();
  const [filter, setFilter] = useState("all");

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="page">
      <header className="page-header">
        <h1>🎛️ Диспетчер</h1>
        <span className="badge">{orders.length} заказов</span>
      </header>

      <div className="filter-bar">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "Все" : statusLabel(s)}
          </button>
        ))}
      </div>

      {loading && <div className="loader">Загрузка...</div>}

      <div className="order-list">
        {visible.map((order) => {
          const flow = STATUS_FLOW[order.status];
          return (
            <div key={order.id} className="order-card">
              <div className="order-card-top">
                <div>
                  <p className="order-restaurant">{order.restaurantName}</p>
                  <p className="order-address">📍 {order.address}</p>
                  <p className="order-client">👤 {order.clientName}</p>
                </div>
                <div className="order-right">
                  <span
                    className="status-pill"
                    style={{ background: statusColor(order.status) + "33", color: statusColor(order.status) }}
                  >
                    {statusLabel(order.status)}
                  </span>
                  <p className="order-price">{order.price?.toLocaleString()} ₸</p>
                </div>
              </div>
              {flow?.next && (
                <div className="order-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => updateOrder(order.id, { status: flow.next })}
                  >
                    {flow.nextLabel}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!loading && visible.length === 0 && (
          <div className="empty">Заказов нет</div>
        )}
      </div>
    </div>
  );
}
