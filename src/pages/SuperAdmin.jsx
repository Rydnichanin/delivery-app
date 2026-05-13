cat > /mnt/user-data/outputs/delivery-app/src/pages/SuperAdmin.jsx << 'EOF'
import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { createInvite } from "../data/invites";
import BusinessDetail from "./BusinessDetail.jsx";

const ROLES = ["director", "dispatcher", "restaurant", "courier", "analytics"];
const ROLE_LABELS = {
  director: "Директор", dispatcher: "Диспетчер", restaurant: "Заведение",
  courier: "Курьер", analytics: "Аналитик", superadmin: "Супер-админ",
};

export default function SuperAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("cities");
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [invites, setInvites] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("courier");
  const [newCityId, setNewCityId] = useState("");
  const [newBusinessId, setNewBusinessId] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const [newBizName, setNewBizName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    const u = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), s =>
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const c = onSnapshot(collection(db, "cities"), s =>
      setCities(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const b = onSnapshot(collection(db, "businesses"), s =>
      setBusinesses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const i = onSnapshot(query(collection(db, "invites"), orderBy("createdAt", "desc")), s =>
      setInvites(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u(); c(); b(); i(); };
  }, []);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 5000); };

  const addCity = async () => {
    if (!newCityName.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "cities"), { name: newCityName.trim(), createdAt: serverTimestamp() });
    setNewCityName("");
    flash("Город добавлен ✓");
    setSaving(false);
  };

  const addBusiness = async () => {
    if (!newBizName.trim() || !selectedCity) return;
    setSaving(true);
    await addDoc(collection(db, "businesses"), {
      name: newBizName.trim(), cityId: selectedCity.id, createdAt: serverTimestamp()
    });
    setNewBizName("");
    flash("Бизнес добавлен ✓");
    setSaving(false);
  };

  const addUser = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const code = await createInvite({
      name: newName.trim(), role: newRole,
      businessId: newBusinessId, cityId: newCityId, createdBy: user.uid,
    });
    setGeneratedCode(code);
    setNewName(""); setNewCityId(""); setNewBusinessId("");
    flash(`Код: ${code}`);
    setSaving(false);
  };

  const TABS = [
    { id: "cities", label: "🏙️ Города" },
    { id: "users", label: "👥 Пользователи" },
    { id: "invites", label: "🎫 Приглашения" },
  ];

  // ── Открыт конкретный бизнес ──
  if (selectedBusiness) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>🔧 Супер-админ</h1>
          <button className="nav-exit" onClick={() => signOut(auth)}>Выйти</button>
        </header>
        <BusinessDetail
          business={selectedBusiness}
          cities={cities}
          onBack={() => setSelectedBusiness(null)}
          adminUid={user.uid}
        />
      </div>
    );
  }

  // ── Открыт конкретный город — показываем его бизнесы ──
  if (selectedCity) {
    const cityBusinesses = businesses.filter(b => b.cityId === selectedCity.id);
    return (
      <div className="page">
        <header className="page-header">
          <h1>🔧 Супер-админ</h1>
          <button className="nav-exit" onClick={() => signOut(auth)}>Выйти</button>
        </header>

        <button className="btn-link" onClick={() => setSelectedCity(null)} style={{ marginBottom: 12 }}>
          ← Все города
        </button>

        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 800, fontSize: "1.2rem" }}>🏙️ {selectedCity.name}</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Бизнесов: {cityBusinesses.length}
          </p>
        </div>

        {msg && <div className="success-banner">{msg}</div>}

        {/* Добавить бизнес в этот город */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="section-title">Добавить бизнес</h2>
          <div className="form">
            <input
              className="form-input"
              placeholder="Название бизнеса"
              value={newBizName}
              onChange={e => setNewBizName(e.target.value)}
            />
            <button className="btn btn-primary" onClick={addBusiness} disabled={saving}>
              + Добавить
            </button>
          </div>
        </div>

        <h2 className="section-title">Бизнесы в городе ({cityBusinesses.length})</h2>
        <div className="order-list">
          {cityBusinesses.map(b => (
            <div key={b.id} className="order-card" style={{ cursor: "pointer" }}
              onClick={() => setSelectedBusiness(b)}>
              <div className="order-card-top">
                <div>
                  <p className="order-restaurant">🏢 {b.name}</p>
                  <p className="order-address">
                    {users.filter(u => u.businessId === b.id).length} пользователей
                  </p>
                </div>
                <span style={{ color: "var(--accent)", fontSize: "1.2rem" }}>→</span>
              </div>
            </div>
          ))}
          {cityBusinesses.length === 0 && (
            <div className="empty">В этом городе пока нет бизнесов</div>
          )}
        </div>
      </div>
    );
  }

  // ── Главный экран ──
  return (
    <div className="page">
      <header className="page-header">
        <h1>🔧 Супер-админ</h1>
        <button className="nav-exit" onClick={() => signOut(auth)}>Выйти</button>
      </header>

      {msg && <div className="success-banner">{msg}</div>}

      {generatedCode && (
        <div className="card" style={{ marginBottom: 16, textAlign: "center" }}>
          <p className="section-title">Код приглашения</p>
          <p style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "0.2em", color: "var(--accent)", margin: "12px 0" }}>
            {generatedCode}
          </p>
          <button className="btn btn-primary" onClick={() => {
            navigator.clipboard?.writeText(generatedCode);
            flash("Скопировано ✓");
          }}>Скопировать</button>
        </div>
      )}

      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Города ── */}
      {tab === "cities" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title">Добавить город</h2>
            <div className="form">
              <input className="form-input" placeholder="Алматы" value={newCityName} onChange={e => setNewCityName(e.target.value)} />
              <button className="btn btn-primary" onClick={addCity} disabled={saving}>+ Добавить</button>
            </div>
          </div>

          <h2 className="section-title">Все города ({cities.length})</h2>
          <div className="order-list">
            {cities.map(c => {
              const count = businesses.filter(b => b.cityId === c.id).length;
              return (
                <div key={c.id} className="order-card" style={{ cursor: "pointer" }}
                  onClick={() => setSelectedCity(c)}>
                  <div className="order-card-top">
                    <div>
                      <p className="order-restaurant">🏙️ {c.name}</p>
                      <p className="order-address">{count} бизнесов</p>
                    </div>
                    <span style={{ color: "var(--accent)", fontSize: "1.2rem" }}>→</span>
                  </div>
                </div>
              );
            })}
            {cities.length === 0 && <div className="empty">Городов пока нет</div>}
          </div>
        </div>
      )}

      {/* ── Пользователи ── */}
      {tab === "users" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title">Создать приглашение</h2>
            <div className="form">
              <label className="form-label">Имя</label>
              <input className="form-input" placeholder="Алибек" value={newName} onChange={e => setNewName(e.target.value)} />
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
                🎫 Создать код приглашения
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
                    <p className="order-address">📧 {u.email}</p>
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

      {/* ── Приглашения ── */}
      {tab === "invites" && (
        <div>
          <h2 className="section-title">Активные</h2>
          <div className="order-list" style={{ marginBottom: 20 }}>
            {invites.filter(i => !i.used).map(i => (
              <div key={i.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">{i.name}</p>
                    <p className="order-address">{ROLE_LABELS[i.role] || i.role}</p>
                  </div>
                  <span style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "0.1em", color: "var(--accent)" }}>
                    {i.code}
                  </span>
                </div>
              </div>
            ))}
            {invites.filter(i => !i.used).length === 0 && <div className="empty">Нет активных приглашений</div>}
          </div>

          <h2 className="section-title">Использованные</h2>
          <div className="order-list">
            {invites.filter(i => i.used).map(i => (
              <div key={i.id} className="order-card" style={{ opacity: 0.5 }}>
                <div className="order-card-top">
                  <div>
                    <p className="order-restaurant">{i.name}</p>
                    <p className="order-address">{ROLE_LABELS[i.role] || i.role}</p>
                  </div>
                  <span className="status-pill" style={{ background: "#6b728033", color: "#9ca3af" }}>
                    Использован
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
EOF
