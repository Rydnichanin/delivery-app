import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { checkInvite, markInviteUsed } from "../data/invites";

const ROLE_LABELS = {
  director: "Директор",
  dispatcher: "Диспетчер",
  restaurant: "Заведение",
  courier: "Курьер",
  analytics: "Аналитик",
};

export default function Register({ onBack }) {
  const [mode, setMode] = useState("choose"); // choose | invite | client
  
  // Код приглашения
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState(null);
  const [inviteId, setInviteId] = useState(null);
  const [step, setStep] = useState("code"); // code | details

  // Общие поля
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkCode = async () => {
    setError("");
    if (!code.trim()) return;
    setLoading(true);
    const result = await checkInvite(code.trim());
    if (!result) {
      setError("Код не найден или уже использован");
    } else {
      setInvite(result);
      setInviteId(result.id);
      setStep("details");
    }
    setLoading(false);
  };

  // Регистрация по коду приглашения
  const registerWithInvite = async () => {
    setError("");
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: invite.name });
      await setDoc(doc(db, "users", cred.user.uid), {
        name: invite.name,
        email: email.trim(),
        role: invite.role,
        businessId: invite.businessId || "",
        cityId: invite.cityId || "",
        createdAt: serverTimestamp(),
      });
      await markInviteUsed(inviteId, cred.user.uid);
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "Этот email уже зарегистрирован",
        "auth/invalid-email": "Неверный формат email",
        "auth/weak-password": "Пароль слишком простой",
      };
      setError(msgs[e.code] || `Ошибка: ${e.code}`);
    }
    setLoading(false);
  };

  // Регистрация клиента без приглашения
  const registerAsClient = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await setDoc(doc(db, "users", cred.user.uid), {
        name: name.trim(),
        email: email.trim(),
        role: "client",
        businessId: "",
        cityId: "",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "Этот email уже зарегистрирован",
        "auth/invalid-email": "Неверный формат email",
        "auth/weak-password": "Пароль слишком простой",
      };
      setError(msgs[e.code] || `Ошибка: ${e.code}`);
    }
    setLoading(false);
  };

  // ── Выбор типа регистрации ──
  if (mode === "choose") {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">📝</div>
          <h1 className="login-title">Регистрация</h1>
          <p className="login-sub">Выберите тип аккаунта</p>

          <button
            className="role-card"
            style={{ width: "100%", flexDirection: "row", gap: 16, textAlign: "left" }}
            onClick={() => setMode("client")}
          >
            <span style={{ fontSize: "1.8rem" }}>🛍️</span>
            <div>
              <strong style={{ display: "block" }}>Клиент</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Делать заказы и отслеживать</span>
            </div>
          </button>

          <button
            className="role-card"
            style={{ width: "100%", flexDirection: "row", gap: 16, textAlign: "left" }}
            onClick={() => setMode("invite")}
          >
            <span style={{ fontSize: "1.8rem" }}>🎫</span>
            <div>
              <strong style={{ display: "block" }}>Есть код приглашения</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Для сотрудников службы доставки</span>
            </div>
          </button>

          <button className="btn-link" onClick={onBack}>← Назад ко входу</button>

          {error && (
            <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", fontSize: "0.82rem", color: "#ef4444", textAlign: "center" }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Регистрация клиента ──
  if (mode === "client") {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">🛍️</div>
          <h1 className="login-title">Регистрация</h1>
          <p className="login-sub">Создайте аккаунт для заказов</p>

          <label className="form-label">Ваше имя</label>
          <input className="form-input" placeholder="Алибек" value={name} onChange={e => setName(e.target.value)} />

          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />

          <label className="form-label">Пароль</label>
          <input className="form-input" type="password" placeholder="минимум 6 символов" value={password} onChange={e => setPassword(e.target.value)} />

          <button className="btn btn-primary login-btn" onClick={registerAsClient} disabled={loading}>
            {loading ? "Регистрация..." : "Зарегистрироваться →"}
          </button>
          <button className="btn-link" onClick={() => setMode("choose")}>← Назад</button>

          {error && (
            <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", fontSize: "0.82rem", color: "#ef4444", textAlign: "center" }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Регистрация по коду ──
  if (mode === "invite") {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">🎫</div>
          <h1 className="login-title">Регистрация</h1>

          {step === "code" && (
            <>
              <p className="login-sub">Введите код приглашения</p>
              <input
                className="form-input"
                placeholder="ABCD1234"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                style={{ textAlign: "center", letterSpacing: "0.15em", fontWeight: 700 }}
              />
              <button className="btn btn-primary login-btn" onClick={checkCode} disabled={loading}>
                {loading ? "Проверка..." : "Проверить код →"}
              </button>
              <button className="btn-link" onClick={() => setMode("choose")}>← Назад</button>
            </>
          )}

          {step === "details" && invite && (
            <>
              <div style={{ background: "#6366f122", border: "1px solid #6366f155", borderRadius: 10, padding: "12px 16px", fontSize: "0.88rem", textAlign: "center" }}>
                <p style={{ fontWeight: 700 }}>{invite.name}</p>
                <p style={{ color: "var(--muted)" }}>{ROLE_LABELS[invite.role] || invite.role}</p>
              </div>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              <label className="form-label">Пароль</label>
              <input className="form-input" type="password" placeholder="минимум 6 символов" value={password} onChange={e => setPassword(e.target.value)} />
              <button className="btn btn-primary login-btn" onClick={registerWithInvite} disabled={loading}>
                {loading ? "Регистрация..." : "Зарегистрироваться →"}
              </button>
            </>
          )}

          {error && (
            <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", fontSize: "0.82rem", color: "#ef4444", textAlign: "center" }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }
}
