import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import {
  collection, addDoc, onSnapshot, doc,
  updateDoc, deleteDoc, serverTimestamp, query, where
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../data/ordersStore";

const TABS = [
  { id: "couriers", label: "🛵 Курьеры" },
  { id: "shifts", label: "📅 Смены" },
  { id: "earnings", label: "💰 Заработок" },
  { id: "stats", label: "📊 Статистика" },
];

export default function Director() {
  const { user, profile } = useAuth();
  const { orders } = useOrders();
  const [tab, setTab] = useState("couriers");
  const [couriers, setCouriers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [settings, setSettings] = useState({ ratePerOrder: 500, ratePerKm: 0 });

  // Forms
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const businessId = profile?.businessId;
  const cityId = profile?.cityId;

  useEffect(() => {
    if (!businessId) return;

    const c = onSnapshot(
      query(collection(db, "users"), where("businessId", "==", businessId), where("role", "==", "courier")),
      s => setCouriers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const today = new Date().toISOString().slice(0, 10);
    const sh = onSnapshot(
      query(collection(db, "shifts"), where("businessId", "==", businessId), where("date", "==", today)),
      s => setShifts(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const set = onSnapshot(doc(db, "businesses", businessId), snap => {
      if (snap.exists() && snap.data().settings) {
        setSettings(snap.data().settings);
      }
    });

    return () => { c(); sh(); set(); };
  }, [businessId]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  // Добавить курьера (создаём pending запись — он войдёт через email)
  const addCourier = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "pendingUsers"), {
      name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword.trim(),
      role: "courier",
      businessId,
      cityId,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    setNewName(""); setNewEmail(""); setNewPassword("");
    flash("Курьер добавлен ✓");
    setSaving(false);
  };

  const deleteCourier = async (id) => {
    if (!window.confirm("Удалить курьера?")) return;
    await deleteDoc(doc(db, "users", id));
  };

  // Управление сменой
  const toggleShift = async (courierId, courierName) => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = shifts.find(s => s.courierId === courierId);
    if (existing) {
      await deleteDoc(doc(db, "shifts", existing.id));
      flash(`Смена ${courierName} закрыта`);
    } else {
      await addDoc(collection(db, "shifts"), {
        courierId,
        courierName,
        businessId,
        date: today,
        startedAt: serverTimestamp(),
        active: true,
      });
      flash(`Смена ${courierName} открыта ✓`);
    }
  };

  // Сохранить настройки заработка
  const saveSettings = async () => {
    setSaving(true);
    await updateDoc(doc(db, "businesses", businessId), { settings });
    flash("Настройки сохранены ✓");
    setSaving(false);
  };

  // Статистика
  const myOrders = orders.filter(o => o.businessId === businessId);
  const delivered = myOrders.filter(o => o.status === "delivered");
  const revenue = delivered.reduce((s, o) => s + (o.price || 0), 0);
  const activeOrders = myOrders.filter(o => !["delivered", "cancelled"].includes(o.status));

  const courierStats = couriers.map(c => {
    const cOrders = delivered.filter(o => o.courierId === c.id);
    return {
      ...c,
      deliveries: cOrders.length,
      earned: cOrders.length * (settings.ratePerOrder || 0),
    };
  });

  const activeShiftIds = shifts.map(s => s.courierId);

  return (
    <div className="page">
      <header className="page-header">
        <h1>👔 Директор</h1>
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

      {/* ── Курьеры ── */}
      {tab === "couriers" && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Добавить курьера</h2>
            <div className="form">
              <label className="form-label">Имя</label>
              <input className="form-input" placeholder="Алибек" value={newName} onChange={e => setNewName(e.target.value)} />
              <label className="form-label">Email</label>
              <input className="form-input" placeholder="courier@mail.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <label className="form-label">Пароль</label>
              <input className="form-input" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <button className="btn btn-primary" onClick={addCourier} disabled={saving}>+ Добавить</button>
            </div>
          </div>

          <h2 className="section-title">Курьеры ({couriers.length})</h2>
          <div className="order-list">
            {couriers.map(c => (
              <div key={c.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">{c.name}</p>
                    <p className="order-address">📧 {c.email}</p>
                  </div>
                  <div className="order-right">
                    <span className="status-pill" style={
                      activeShiftIds.includes(c.id)
                        ? { background: "#10b98133", color: "#10b981" }
                        : { background: "#6b728033", color: "#9ca3af" }
                    }>
                      {activeShiftIds.includes(c.id) ? "На смене" : "Выходной"}
                    </span>
                    <button className="btn btn-red" style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                      onClick={() => deleteCourier(c.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {couriers.length === 0 && <div className="empty">Курьеров пока нет</div>}
          </div>
        </div>
      )}

      {/* ── Смены ── */}
      {tab === "shifts" && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <p className="section-title">Сегодня: {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 4 }}>
              На смене: {shifts.length} из {couriers.length} курьеров
            </p>
          </div>

          <div className="order-list">
            {couriers.map(c => {
              const onShift = activeShiftIds.includes(c.id);
              return (
                <div key={c.id} className="order-card">
                  <div className="order-card-top">
                    <div>
                      <p className="order-restaurant">{c.name}</p>
                      <p className="order-address">
                        {onShift ? "🟢 Работает сегодня" : "⚫ Выходной"}
                      </p>
                    </div>
                    <button
                      className={`btn ${onShift ? "btn-red" : "btn-green"}`}
                      onClick={() => toggleShift(c.id, c.name)}
                    >
                      {onShift ? "Закрыть смену" : "Открыть смену"}
                    </button>
                  </div>
                </div>
              );
            })}
            {couriers.length === 0 && <div className="empty">Сначала добавьте курьеров</div>}
          </div>
        </div>
      )}

      {/* ── Заработок ── */}
      {tab === "earnings" && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Настройка ставок</h2>
            <div className="form">
              <label className="form-label">Ставка за заказ (₸)</label>
              <input
                className="form-input"
                type="number"
                value={settings.ratePerOrder}
                onChange={e => setSettings(s => ({ ...s, ratePerOrder: +e.target.value }))}
              />
              <label className="form-label">Ставка за км (₸)</label>
              <input
                className="form-input"
                type="number"
                value={settings.ratePerKm}
                onChange={e => setSettings(s => ({ ...s, ratePerKm: +e.target.value }))}
              />
              <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
                Сохранить
              </button>
            </div>
          </div>

          <h2 className="section-title">Заработок курьеров (всё время)</h2>
          <div className="order-list">
            {courierStats.map(c => (
              <div key={c.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">{c.name}</p>
                    <p className="order-address">Доставок: {c.deliveries}</p>
                  </div>
                  <p className="order-price">{c.earned.toLocaleString()} ₸</p>
                </div>
              </div>
            ))}
            {couriers.length === 0 && <div className="empty">Нет курьеров</div>}
          </div>
        </div>
      )}

      {/* ── Статистика ── */}
      {tab === "stats" && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Всего заказов</p>
              <p className="stat-value">{myOrders.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Активные</p>
              <p className="stat-value" style={{ color: "#f59e0b" }}>{activeOrders.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Доставлено</p>
              <p className="stat-value" style={{ color: "#10b981" }}>{delivered.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Выручка</p>
              <p className="stat-value" style={{ color: "#6366f1", fontSize: "1.2rem" }}>{revenue.toLocaleString()} ₸</p>
            </div>
          </div>

          <h2 className="section-title" style={{ marginTop: 24 }}>Топ курьеров</h2>
          <div className="order-list">
            {courierStats.sort((a, b) => b.deliveries - a.deliveries).map((c, i) => (
              <div key={c.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">#{i + 1} {c.name}</p>
                    <p className="order-address">Доставок: {c.deliveries}</p>
                  </div>
                  <p className="order-price">{c.earned.toLocaleString()} ₸</p>
                </div>
              </div>
            ))}
            {couriers.length === 0 && <div className="empty">Нет данных</div>}
          </div>
        </div>
      )}
    </div>
  );
}
