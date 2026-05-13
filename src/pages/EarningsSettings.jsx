import React, { useState, useEffect } from "react";
import {
  collection, onSnapshot, doc, setDoc,
  serverTimestamp, query, where
} from "firebase/firestore";
import { db } from "../firebase";

const DEFAULT_TARIFF = { name: "", clientPrice: "", courierEarning: "" };

export default function EarningsSettings({ businessId, onBack }) {
  const [restaurants, setRestaurants] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [tariffs, setTariffs] = useState({});   // { restaurantId: [ {name, clientPrice, courierEarning} ] }
  const [salaries, setSalaries] = useState({}); // { courierId: number }
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
    const e = onSnapshot(doc(db, "earningsSettings", businessId), snap => {
      if (snap.exists()) {
        setTariffs(snap.data().tariffs || {});
        setSalaries(snap.data().salaries || {});
      }
    });
    return () => { r(); c(); e(); };
  }, [businessId]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  // Добавить тариф к заведению
  const addTariff = (restaurantId) => {
    setTariffs(prev => ({
      ...prev,
      [restaurantId]: [...(prev[restaurantId] || []), { ...DEFAULT_TARIFF }]
    }));
  };

  // Изменить поле тарифа
  const updateTariff = (restaurantId, index, field, value) => {
    setTariffs(prev => {
      const list = [...(prev[restaurantId] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [restaurantId]: list };
    });
  };

  // Удалить тариф
  const removeTariff = (restaurantId, index) => {
    setTariffs(prev => {
      const list = [...(prev[restaurantId] || [])];
      list.splice(index, 1);
      return { ...prev, [restaurantId]: list };
    });
  };

  const updateSalary = (courierId, value) => {
    setSalaries(prev => ({ ...prev, [courierId]: +value }));
  };

  const save = async () => {
    setSaving(true);
    await setDoc(doc(db, "earningsSettings", businessId), {
      tariffs,
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

      {/* ── Тарифы по заведениям ── */}
      {restaurants.length === 0 && (
        <div className="empty">Сначала добавьте заведения к этому бизнесу</div>
      )}

      {restaurants.map(r => (
        <div key={r.id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>🍴 {r.name}</p>
            <button
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => addTariff(r.id)}
            >
              + Добавить тариф
            </button>
          </div>

          {(!tariffs[r.id] || tariffs[r.id].length === 0) && (
            <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
              Нет тарифов — нажмите "+ Добавить тариф"
            </p>
          )}

          {(tariffs[r.id] || []).map((t, i) => (
            <div key={i} style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--accent)" }}>
                  Тариф #{i + 1}
                </p>
                <button
                  onClick={() => removeTariff(r.id, i)}
                  style={{
                    background: "none", border: "none",
                    color: "var(--red)", cursor: "pointer", fontSize: "1.1rem"
                  }}
                >
                  ✕
                </button>
              </div>

              <label className="form-label">Название тарифа</label>
              <input
                className="form-input"
                placeholder="До подъезда"
                value={t.name}
                onChange={e => updateTariff(r.id, i, "name", e.target.value)}
                style={{ marginBottom: 8 }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label className="form-label">Клиент платит (₸)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="500"
                    value={t.clientPrice}
                    onChange={e => updateTariff(r.id, i, "clientPrice", e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Курьер получает (₸)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="300"
                    value={t.courierEarning}
                    onChange={e => updateTariff(r.id, i, "courierEarning", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* ── Оклады ── */}
      {couriers.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="section-title">Оклад курьеров (₸/месяц)</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 12 }}>
            Фиксированная часть зарплаты независимо от количества заказов
          </p>
          {couriers.map(c => (
            <div key={c.id} style={{ marginBottom: 10 }}>
              <label className="form-label">{c.name}</label>
              <input
                className="form-input"
                type="number"
                placeholder="0"
                value={salaries[c.id] || ""}
                onChange={e => updateSalary(c.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: "100%", padding: 14, fontSize: "1rem" }}
        onClick={save}
        disabled={saving}
      >
        {saving ? "Сохранение..." : "💾 Сохранить все настройки"}
      </button>
    </div>
  );
      }
        
