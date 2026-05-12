import React, { useState } from "react";
import { useOrders, createOrder } from "../data/ordersStore";
import { statusLabel, statusColor } from "../data/statuses";

const RESTAURANTS = ["Бургер House", "Sushi Time", "Pizza Lab", "Shawarma King", "Wok Express"];

export default function Client() {
  const { orders, loading } = useOrders();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [restaurant, setRestaurant] = useState(RESTAURANTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const myOrders = name.trim()
    ? orders.filter((o) => o.clientName === name.trim())
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    setSubmitting(true);
    await createOrder({
      clientName: name.trim(),
      address: address.trim(),
      restaurantName: restaurant,
      price: 2500 + Math.round(Math.random() * 3000),
    });
    setAddress("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setSubmitting(false);
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>🛍️ Клиент</h1>
      </header>

      <div className="card">
        <h2 className="section-title">Новый заказ</h2>
        <form onSubmit={handleSubmit} className="form">
          <label className="form-label">Ваше имя</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Айжан"
            required
          />
          <label className="form-label">Адрес доставки</label>
          <input
            className="form-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ул. Абая 10"
            required
          />
          <label className="form-label">Заведение</label>
          <select
            className="form-input"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
          >
            {RESTAURANTS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Оформляем..." : "Оформить заказ"}
          </button>
          {success && <p className="success-msg">✓ Заказ принят!</p>}
        </form>
      </div>

      {name.trim() && (
        <div style={{ marginTop: 32 }}>
          <h2 className="section-title">Мои заказы</h2>
          {loading && <div className="loader">Загрузка...</div>}
          <div className="order-list">
            {myOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">{order.restaurantName}</p>
                    <p className="order-address">📍 {order.address}</p>
                  </div>
                  <div className="order-right">
                    <span
                      className="status-pill"
                      style={{
                        background: statusColor(order.status) + "33",
                        color: statusColor(order.status),
                      }}
                    >
                      {statusLabel(order.status)}
                    </span>
                    <p className="order-price">{order.price?.toLocaleString()} ₸</p>
                  </div>
                </div>
                {/* Прогресс-бар */}
                <div className="progress-track">
                  {["new", "cooking", "ready", "delivering", "delivered"].map((s, i, arr) => {
                    const currentIdx = arr.indexOf(order.status);
                    const done = i <= currentIdx;
                    return (
                      <React.Fragment key={s}>
                        <div
                          className="progress-dot"
                          style={{ background: done ? statusColor(order.status) : "#374151" }}
                          title={statusLabel(s)}
                        />
                        {i < arr.length - 1 && (
                          <div
                            className="progress-line"
                            style={{ background: i < currentIdx ? statusColor(order.status) : "#374151" }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
            {!loading && myOrders.length === 0 && (
              <div className="empty">Заказов пока нет — создайте первый ☝️</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
