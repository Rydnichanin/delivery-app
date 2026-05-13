import React, { useState, useEffect } from "react";
import {
  collection, addDoc, onSnapshot, doc,
  serverTimestamp, query, where, deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { createInvite } from "../data/invites";
import EarningsSettings from "./EarningsSettings.jsx";

const TABS = [
  { id: "restaurants", label: "🍴 Заведения" },
  { id: "couriers", label: "🛵 Курьеры" },
  { id: "earnings", label: "💰 Заработок" },
  { id: "stats", label: "📊 Статистика" },
];

export default function BusinessDetail({ business, cities, onBack, adminUid }) {
  const [tab, setTab] = useState("restaurants");
  const [restaurants, setRestaurants] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [directors, setDirectors] = useState([]);

  const [newRestName, setNewRestName] = useState("");
  const [newRestAddress, setNewRestAddress] = useState("");
  const [newCourierName, setNewCourierName] = useState("");
  const [newCourierEmail, setNewCourierEmail] = useState("");
  const [newDirName, setNewDirName] = useState("");
  const [newDirEmail, setNewDirEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const cityName = cities.find(c => c.id === business.cityId)?.name || "—";

  useEffect(() => {
    const r = onSnapshot(
      query(collection(db, "restaurants"), where("businessId", "==", business.id)),
      s => setRestaurants(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const c = onSnapshot(
      query(collection(db, "users"), where("businessId", "==", business.id), where("role", "==", "courier")),
      s => setCouriers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const d = onSnapshot(
      query(collection(db, "users"), where("businessId", "==", business.id), where("role", "==", "director")),
      s => setDirectors(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { r(); c(); d(); };
  }, [business.id]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 4000); };

  const addRestaurant = async () => {
    if (!newRestName.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "restaurants"), {
      name: newRestName.trim(),
      address: newRestAddress.trim(),
      businessId: business.id,
      cityId: business.cityId,
      createdAt: serverTimestamp(),
    });
    setNewRestName(""); setNewRestAddress("");
    flash("Заведение добавлено ✓");
    setSaving(false);
  };

  const deleteRestaurant = async (id) => {
    if (!window.confirm("Удалить заведение?")) return;
    await deleteDoc(doc(db, "restaurants", id));
  };

  const inviteCourier = async () => {
    if (!newCourierName.trim()) return;
    setSaving(true);
    const code = await createInvite({
      name: newCourierName.trim(),
      role: "courier",
      businessId: business.id,
      cityId: business.cityId,
      createdBy: adminUid,
    });
    setGeneratedCode(code);
    setNewCourierName(""); setNewCourierEmail("");
    flash(`Код приглашения для курьера: ${code}`);
    setSaving(false);
  };

  const inviteDirector = async () => {
    if (!newDirName.trim()) return;
    setSaving(true);
    const code = await createInvite({
      name: newDirName.trim(),
      role: "director",
      businessId: business.id,
      cityId: business.cityId,
      createdBy: adminUid,
    });
    setGeneratedCode(code);
    setNewDirName(""); setNewDirEmail("");
    flash(`Код приглашения для директора: ${code}`);
    setSaving(false);
  };

  const deleteCourier = async (id) => {
    if (!window.confirm("Удалить курьера?")) return;
    await deleteDoc(doc(db, "users", id));
  };

  return (
    <div>
      <button className="btn-link" onClick={onBack} style={{ marginBottom: 12 }}>
        ← Все бизнесы
      </button>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 800, fontSize: "1.2rem" }}>🏢 {business.name}</p>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>🏙️ {cityName}</p>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: 4 }}>
          Директоров: {directors.length} • Курьеров: {couriers.length} • Заведений: {restaurants.length}
        </p>
      </div>

      {msg && (
        <div className="success-banner" style={{ fontSize: "0.95rem" }}>
          {msg}
        </div>
      )}

      {generatedCode && (
        <div className="card" style={{ marginBottom: 16, textAlign: "center" }}>
          <p className="section-title">Код приглашения</p>
          <p style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "0.2em", color: "var(--accent)", margin: "12px 0" }}>
            {generatedCode}
          </p>
          <button className="btn btn-primary" onClick={() => {
            navigator.clipboard?.writeText(generatedCode);
            flash("Скопировано ✓");
          }}>
            Скопировать
          </button>
        </div>
      )}

      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Заведения ── */}
      {tab === "restaurants" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title">Добавить заведение</h2>
            <div className="form">
              <label className="form-label">Название</label>
              <input className="form-input" placeholder="Бургер House" value={newRestName} onChange={e => setNewRestName(e.target.value)} />
              <label className="form-label">Адрес</label>
              <input className="form-input" placeholder="ул. Абая 10" value={newRestAddress} onChange={e => setNewRestAddress(e.target.value)} />
              <button className="btn btn-primary" onClick={addRestaurant} disabled={saving}>+ Добавить</button>
            </div>
          </div>

          <h2 className="section-title">Заведения ({restaurants.length})</h2>
          <div className="order-list">
            {restaurants.map(r => (
              <div key={r.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">🍴 {r.name}</p>
                    <p className="order-address">📍 {r.address || "—"}</p>
                  </div>
                  <button className="btn btn-red" style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                    onClick={() => deleteRestaurant(r.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {restaurants.length === 0 && <div className="empty">Заведений пока нет</div>}
          </div>
        </div>
      )}

      {/* ── Курьеры ── */}
      {tab === "couriers" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title">Пригласить директора</h2>
            <div className="form">
              <label className="form-label">Имя</label>
              <input className="form-input" placeholder="Директор" value={newDirName} onChange={e => setNewDirName(e.target.value)} />
              <button className="btn btn-amber" onClick={inviteDirector} disabled={saving}>🎫 Создать приглашение</button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title">Пригласить курьера</h2>
            <div className="form">
              <label className="form-label">Имя</label>
              <input className="form-input" placeholder="Алибек" value={newCourierName} onChange={e => setNewCourierName(e.target.value)} />
              <button className="btn btn-primary" onClick={inviteCourier} disabled={saving}>🎫 Создать приглашение</button>
            </div>
          </div>

          <h2 className="section-title">Директора ({directors.length})</h2>
          <div className="order-list" style={{ marginBottom: 16 }}>
            {directors.map(d => (
              <div key={d.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">{d.name}</p>
                    <p className="order-address">📧 {d.email}</p>
                  </div>
                  <span className="status-pill" style={{ background: "#f59e0b22", color: "#f59e0b" }}>Директор</span>
                </div>
              </div>
            ))}
            {directors.length === 0 && <div className="empty">Нет директоров</div>}
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
                  <button className="btn btn-red" style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                    onClick={() => deleteCourier(c.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {couriers.length === 0 && <div className="empty">Нет курьеров</div>}
          </div>
        </div>
      )}

      {/* ── Заработок ── */}
      {tab === "earnings" && (
        <EarningsSettings businessId={business.id} onBack={() => setTab("restaurants")} />
      )}

      {/* ── Статистика ── */}
      {tab === "stats" && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Заведений</p>
              <p className="stat-value">{restaurants.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Курьеров</p>
              <p className="stat-value">{couriers.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Директоров</p>
              <p className="stat-value">{directors.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
