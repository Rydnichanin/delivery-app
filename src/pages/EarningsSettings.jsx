import React, { useState, useEffect } from "react";
import {
  collection, onSnapshot, doc, setDoc,
  serverTimestamp, query, where
} from "firebase/firestore";
import { db } from "../firebase";

// Настройка заработка для одного бизнеса
export default function EarningsSettings({ businessId, onBack }) {
  const [restaurants, setRestaurants] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [settings, setSettings] = useState({});
  const [salaries, setSalaries] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!businessId) return;

    const r = onSnapshot(
      query(collection(db, "restaurants"), where("businessId", "==", businessId)),
      s => setRestaurants(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const c = onSnapshot(
      query(collection(db, "users"), where("businessId", "==", businessId), where("role", "==", "courier")),
      s => setCouriers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    // Загружаем настройки заработка
    const e = onSnapshot(doc(db, "earningsSettings", businessId), snap => {
      if (snap.exists()) {
        setSettings(snap.data().byRestaurant || {});
        setSalaries(snap.data().salaries || {});
      }
    });

    return () => { r(); c(); e(); };
  }, [businessId]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const updateRestaurantRate = (restaurantId, field, value) => {
    setSettings(prev => ({
      ...prev,
      [restaurantId]: {
        ...prev[restaurantId],
        [field]: +value
      }
    }));
  };

  const updateSalary = (courierId, value) => {
    setSalaries(prev => ({ ...prev, [courierId]: +value }));
  };

  const save = async () => {
    setSaving(true);
    await setDoc(doc(db, "earningsSettings", businessId), {
      byRestaurant: settings,
      salaries,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    flash("Сохранено ✓");
    setSaving(false);
  };

  return (
    <div>
      <button className="btn-link" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Назад
      </button>

      {msg && <div className="success-banner">{msg}</div>}

      {/* ── Ставки по заведениям ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="section-title">Ставки по заведениям</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 12 }}>
          Сколько курьер получает за доставку от каждого заведения
        </p>

        {restaurants.length === 0 && (
          <div className="empty">Сначала добавьте заведения к этому бизнесу</div>
        )}

        {restaurants.map(r => (
          <div key={r.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontWeight: 700, marginBottom: 10 }}>🍴 {r.name}</p>
            <div className="form">
              <label className="form-label">Базовая ставка за заказ (₸)</label>
              <input
                className="form-input"
                type="number"
                value={settings[r.id]?.baseRate || ""}
                placeholder="500"
                onChange={e => updateRestaurantRate(r.id, "baseRate", e.target.value)}
              />
              <label className="form-label">До подъезда (₸)</label>
              <input
                className="form-input"
                type="number"
                value={settings[r.id]?.toEntrance || ""}
                placeholder="100"
                onChange={e => updateRestaurantRate(r.id, "toEntrance", e.target.value)}
              />
              <label className="form-label">До квартиры (₸)</label>
              <input
                className="form-input"
                type="number"
                value={settings[r.id]?.toApartment || ""}
                placeholder="200"
                onChange={e => updateRestaurantRate(r.id, "toApartment", e.target.value)}
              />
              <label className="form-label">% от суммы заказа (если нужен)</label>
              <input
                className="form-input"
                type="number"
                value={settings[r.id]?.percent || ""}
                placeholder="0"
                onChange={e => updateRestaurantRate(r.id, "percent", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Оклады курьеров ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="section-title">Оклад курьеров (₸/месяц)</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 12 }}>
          Фиксированная часть зарплаты независимо от заказов
        </p>

        {couriers.length === 0 && (
          <div className="empty">Нет курьеров в этом бизнесе</div>
        )}

        {couriers.map(c => (
          <div key={c.id} style={{ marginBottom: 12 }}>
            <label className="form-label">{c.name}</label>
            <input
              className="form-input"
              type="number"
              value={salaries[c.id] || ""}
              placeholder="0"
              onChange={e => updateSalary(c.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ width: "100%" }} onClick={save} disabled={saving}>
        {saving ? "Сохранение..." : "💾 Сохранить все настройки"}
      </button>
    </div>
  );
}
