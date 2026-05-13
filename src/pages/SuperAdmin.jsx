import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import {
  collection, addDoc, onSnapshot, doc,
  setDoc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const ROLES = ["director", "dispatcher", "restaurant", "courier", "analytics"];
const ROLE_LABELS = {
  director: "Директор",
  dispatcher: "Диспетчер",
  restaurant: "Заведение",
  courier: "Курьер",
  analytics: "Аналитик",
  superadmin: "Супер-админ",
};

export default function SuperAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("users");

  // Users
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [businesses, setBusinesses] = useState([]);

  // Forms
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("courier");
  const [newName, setNewName] = useState("");
  const [newCityId, setNewCityId] = useState("");
  const [newBusinessId, setNewBusinessId] = useState("");

  const [newCityName, setNewCityName] = useState("");
  const [newBizName, setNewBizName] = useState("");
  const [newBizCity, setNewBizCity] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const u = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), s =>
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const c = onSnapshot(collection(db, "cities"), s =>
      setCities(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const b = onSnapshot(collection(db, "businesses"), s =>
      setBusinesses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u(); c(); b(); };
  }, []);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const addCity = async () => {
    if (!newCityName.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "cities"), { name: newCityName.trim(), createdAt: serverTimestamp() });
    setNewCityName("");
    flash("Город добавлен ✓");
    setSaving(false);
  };

  const addBusiness = async () => {
    if (!newBizName.trim() || !newBizCity) return;
    setSaving(true);
    await addDoc(collection(db, "businesses"), {
      name: newBizName.trim(),
      cityId: newBizCity,
      createdAt: serverTimestamp()
    });
    setNewBizName("");
    flash("Бизнес добавлен ✓");
    setSaving(false);
  };

  // Создаём профиль пользователя вручную (по номеру телефона)
  // После первого входа пользователя через SMS его uid появится в Auth,
  // но мы можем заранее создать запись — она подхватится по uid после входа.
  // Здесь создаём запись по номеру телефона как pending-профиль.
  const addUser = async () => {
    if (!newPhone.trim() || !newName.trim()) return;
    setSaving(true);
    const phone = newPhone.startsWith("+") ? newPhone.trim() : "+7" + newPhone.replace(/\D/g, "").slice(-10);
    // Используем номер как временный ключ — после входа uid перезапишется в AuthContext
    await addDoc(collection(db, "pendingUsers"), {
      phone,
      name: newName.trim(),
      role: newRole,
      cityId: newCityId,
      businessId: newBusinessId,
      createdAt: serverTimestamp(),
    });
    setNewPhone(""); setNewName(""); setNewCityId(""); setNewBusinessId("");
    flash("Пользователь добавлен ✓ (станет активным после первого входа)");
    setSaving(false);
  };

  const TABS = [
    { id: "users", label: "👥 Пользователи" },
    { id: "cities", label: "🏙️ Города" },
    { id: "businesses", label: "🏢 Бизнесы" },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <h1>🔧 Супер-админ</h1>
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

      {/* ── Пользователи ── */}
      {tab === "users" && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Добавить пользователя</h2>
            <div className="form">
              <label className="form-label">Имя</label>
              <input className="form-input" placeholder="Алибек" value={newName} onChange={e => setNewName(e.target.value)} />
              <label className="form-label">Номер телефона</label>
              <input className="form-input" placeholder="+7 700 000 0000" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              <label className="form-label">Роль</label>
              <select className="form-input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <label className="form-label">Город</label>
              <select className="form-input" value={newCityId} onChange={e => setNewCityId(e.target.value)}>
                <option value="">— выбрать —</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className="form-label">Бизнес</label>
              <select className="form-input" value={newBusinessId} onChange={e => setNewBusinessId(e.target.value)}>
                <option value="">— выбрать —</option>
                {businesses.filter(b => !newCityId || b.cityId === newCityId).map(b =>
                  <option key={b.id} value={b.id}>{b.name}</option>
                )}
              </select>
              <button className="btn btn-primary" onClick={addUser} disabled={saving}>
                + Добавить
              </button>
            </div>
          </div>

          <h2 className="section-title">Зарегистрированные ({users.length})</h2>
          <div className="order-list">
            {users.map(u => (
              <div key={u.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">{u.name || "Без имени"}</p>
                    <p className="order-address">📱 {u.phone}</p>
                    <p className="order-client">
                      {cities.find(c => c.id === u.cityId)?.name || "—"} •{" "}
                      {businesses.find(b => b.id === u.businessId)?.name || "—"}
                    </p>
                  </div>
                  <span className="status-pill" style={{ background: "#6366f122", color: "#6366f1" }}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="empty">Пользователей пока нет</div>}
          </div>
        </div>
      )}

      {/* ── Города ── */}
      {tab === "cities" && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Добавить город</h2>
            <div className="form">
              <input className="form-input" placeholder="Алматы" value={newCityName} onChange={e => setNewCityName(e.target.value)} />
              <button className="btn btn-primary" onClick={addCity} disabled={saving}>+ Добавить</button>
            </div>
          </div>
          <div className="order-list">
            {cities.map(c => (
              <div key={c.id} className="order-card">
                <p className="order-restaurant">🏙️ {c.name}</p>
                <p className="order-address" style={{ fontSize: 11 }}>ID: {c.id}</p>
              </div>
            ))}
            {cities.length === 0 && <div className="empty">Городов пока нет</div>}
          </div>
        </div>
      )}

      {/* ── Бизнесы ── */}
      {tab === "businesses" && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Добавить бизнес</h2>
            <div className="form">
              <input className="form-input" placeholder="Название бизнеса" value={newBizName} onChange={e => setNewBizName(e.target.value)} />
              <select className="form-input" value={newBizCity} onChange={e => setNewBizCity(e.target.value)}>
                <option value="">— выбрать город —</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn btn-primary" onClick={addBusiness} disabled={saving}>+ Добавить</button>
            </div>
          </div>
          <div className="order-list">
            {businesses.map(b => (
              <div key={b.id} className="order-card">
                <p className="order-restaurant">🏢 {b.name}</p>
                <p className="order-address">🏙️ {cities.find(c => c.id === b.cityId)?.name || b.cityId}</p>
                <p className="order-address" style={{ fontSize: 11 }}>ID: {b.id}</p>
              </div>
            ))}
            {businesses.length === 0 && <div className="empty">Бизнесов пока нет</div>}
          </div>
        </div>
      )}
    </div>
  );
                  }
                      
