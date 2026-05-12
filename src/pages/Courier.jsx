import React, { useState } from "react";
import { useOrders, updateOrder } from "../data/ordersStore";

const COURIER_ID = "courier-1";

export default function Courier() {
  const { orders, loading } = useOrders();
  const [myId] = useState(COURIER_ID);

  const available = orders.filter((o) => o.status === "ready" && !o.courierId);
  const mine = orders.filter((o) => o.courierId === myId);

  return (
    <div className="page">
      <header className="page-header">
        <h1>🛵 Курьер</h1>
        <span className="badge">{mine.filter((o) => o.status === "delivering").length} в пути</span>
      </header>

      {loading && <div className="loader">Загрузка...</div>}

      <section>
        <h2 className="section-title">Доступные заказы ({available.length})</h2>
        <div className="order-list">
          {available.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-top">
                <div>
                  <p className="order-restaurant">{order.restaurantName}</p>
                  <p className="order-address">📍 {order.address}</p>
                  <p className="order-client">👤 {order.clientName}</p>
                </div>
                <p className="order-price">{order.price?.toLocaleString()} ₸</p>
              </div>
              <div className="order-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => updateOrder(order.id, { courierId: myId, status: "delivering" })}
                >
                  🛵 Взять заказ
                </button>
              </div>
            </div>
          ))}
          {!loading && available.length === 0 && <div className="empty">Нет доступных заказов</div>}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 className="section-title">Мои доставки ({mine.length})</h2>
        <div className="order-list">
          {mine.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-top">
                <div>
                  <p className="order-restaurant">{order.restaurantName}</p>
                  <p className="order-address">📍 {order.address}</p>
                </div>
                <span
                  className="status-pill"
                  style={
                    order.status === "delivering"
                      ? { background: "#3b82f633", color: "#3b82f6" }
                      : { background: "#6b728033", color: "#9ca3af" }
                  }
                >
                  {order.status === "delivering" ? "В пути" : "Доставлено"}
                </span>
              </div>
              {order.status === "delivering" && (
                <div className="order-actions">
                  <button
                    className="btn btn-green"
                    onClick={() => updateOrder(order.id, { status: "delivered" })}
                  >
                    ✓ Доставлено
                  </button>
                </div>
              )}
            </div>
          ))}
          {!loading && mine.length === 0 && <div className="empty">Нет доставок</div>}
        </div>
      </section>
    </div>
  );
}
