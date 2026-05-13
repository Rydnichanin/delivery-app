import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import {
  collection, addDoc, onSnapshot, doc,
  updateDoc, deleteDoc, serverTimestamp, query, where
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { statusLabel, statusColor } from "../data/statuses";

const TABS = [
  { id: "orders", label: "📋 Заказы" },
  { id: "menu", label: "🍽️ Меню" },
];

export default function Restaurant() {
  const { profile } = useAuth();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [tariffs, setTariffs] = useState([]);

  // Форма меню
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const restaurantId = profile?.restaurantId || profile?.businessId;
  const businessId = profile?.businessId;

  useEffect(() => {
    if (!restaurantId) return;

    // Заказы этого заведения
    const o = onSnapshot(
      query(collection(db, "orders"),
        where("restaurantId", "==", restaurantId),
        where("status", "in", ["new", "cooking", "ready"])
      ),
      s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Меню
    const m = onSnapshot(
      query(collection(db, "menuItems"), where("restaurantId", "==", restaurantId)),
      s => setMenu(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Тарифы доставки
    if (businessId) {
      const e = onSnapshot(doc(db, "earningsSettings", businessId), snap => {
        if (snap.exists()) {
          setTariffs(snap.data().tariffs?.[restaurantId] || []);
        }
      });
      return () => { o(); m(); e(); };
    }

    return () => { o(); m(); };
  }, [restaurantId, businessId]);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 3000); };

  const addMenuItem = async () => {
    if (!newItemName.trim() || !newItemPrice) return;
    setSaving(true);
    await addDoc(collection(db, "menuItems"), {
      name: newItemName.trim(),
      price: +newItemPrice,
      description: newItemDesc.trim(),
      restaurantId,
      businessId,
      available: true,
      createdAt: serverTimestamp(),
    });
    setNewItemName(""); setNewItemPrice(""); setNewItemDesc("");
    flash("Блюдо добавлено ✓");
    setSaving(false);
  };

  const toggleAvailable = async (item) => {
    await updateDoc(doc(db, "menuItems", item.id), { available: !item.available });
  };

  const deleteMenuItem = async (id) => {
    await deleteDoc(doc(db, "menuItems", id));
  };

  const updateOrderStatus = async (orderId, status) => {
    await updateDoc(doc(db, "orders", orderId), {
      status, updatedAt: serverTimestamp()
    });
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>🍴 Заведение</h1>
        <button className="nav-exit" onClick={() => signOut(auth)}>Выйти</button>
      </header>

      {msg && <div className="success-banner">{msg}</div>}

      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Заказы ── */}
      {tab === "orders" && (
        <div>
          <h2 className="section-title">Активные заказы ({orders.length})</h2>
          <div className="order-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">📍 {order.address}</p>
                    {order.apartment && (
                      <p className="order-address">🏠 {order.deliveryType === "apartment" ? "До квартиры" : "До подъезда"}: {order.apartment}</p>
                    )}
                    <p className="order-address">👤 {order.clientName}</p>
                    {order.tariffName && (
                      <p className="order-address">💰 {order.tariffName} — {order.clientPrice} ₸</p>
                    )}
                    {order.items?.length > 0 && (
                      <p className="order-address">🍽️ {order.items.map(i => i.name).join(", ")}</p>
                    )}
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
                    <button className="btn btn-amber" onClick={() => updateOrderStatus(order.id, "cooking")}>
                      ▶ Начать готовку
                    </button>
                  )}
                  {order.status === "cooking" && (
                    <button className="btn btn-green" onClick={() => updateOrderStatus(order.id, "ready")}>
                      ✓ Готов к выдаче
                    </button>
                  )}
                  {order.status === "ready" && (
                    <div className="waiting-label">⏳ Ожидание курьера</div>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="empty">Нет активных заказов 🎉</div>}
          </div>
        </div>
      )}

      {/* ── Меню ── */}
      {tab === "menu" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title">Добавить блюдо</h2>
            <div className="form">
              <label className="form-label">Название</label>
              <input className="form-input" placeholder="Бургер классик" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
              <label className="form-label">Цена (₸)</label>
              <input className="form-input" type="number" placeholder="1500" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
              <label className="form-label">Описание (необязательно)</label>
              <input className="form-input" placeholder="Говядина, сыр, соус" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} />
              <button className="btn btn-primary" onClick={addMenuItem} disabled={saving}>+ Добавить</button>
            </div>
          </div>

          <h2 className="section-title">Меню ({menu.length})</h2>
          <div className="order-list">
            {menu.map(item => (
              <div key={item.id} className="order-card" style={{ opacity: item.available ? 1 : 0.5 }}>
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">{item.name}</p>
                    {item.description && <p className="order-address">{item.description}</p>}
                    <p className="order-price" style={{ fontSize: "0.95rem" }}>{item.price?.toLocaleString()} ₸</p>
                  </div>
                  <div className="order-right">
                    <button
                      className={`btn ${item.available ? "btn-amber" : "btn-green"}`}
                      style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                      onClick={() => toggleAvailable(item)}
                    >
                      {item.available ? "Скрыть" : "Показать"}
                    </button>
                    <button
                      className="btn btn-red"
                      style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                      onClick={() => deleteMenuItem(item.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {menu.length === 0 && <div className="empty">Меню пустое — добавьте блюда</div>}
          </div>
        </div>
      )}
    </div>
  );
}
