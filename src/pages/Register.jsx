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
  const [step, setStep] = useState("code"); // code | details
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState(null);
  const [inviteId, setInviteId] = useState(null);
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

  const register = async () => {
    setError("");
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) {
      setError("Пароль минимум 6 символов");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: invite.name });

      // Создаём профиль в Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        name: invite.name,
        email: email.trim(),
        role: invite.role,
        businessId: invite.businessId || "",
        cityId: invite.cityId || "",
        createdAt: serverTimestamp(),
      });

      // Отмечаем код как использованный
      await markInviteUsed(inviteId, cred.user.uid);

      // AuthContext подхватит пользователя автоматически
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
            <button className="btn-link" onClick={onBack}>← Назад ко входу</button>
          </>
        )}

        {step === "details" && invite && (
          <>
            <div style={{
              background: "#6366f122",
              border: "1px solid #6366f155",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: "0.88rem",
              textAlign: "center"
            }}>
              <p style={{ fontWeight: 700 }}>{invite.name}</p>
              <p style={{ color: "var(--muted)" }}>{ROLE_LABELS[invite.role] || invite.role}</p>
            </div>
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <label className="form-label">Пароль</label>
            <input
              className="form-input"
              type="password"
              placeholder="минимум 6 символов"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="btn btn-primary login-btn" onClick={register} disabled={loading}>
              {loading ? "Регистрация..." : "Зарегистрироваться →"}
            </button>
          </>
        )}

        {error && (
          <div style={{
            background: "#ef444422",
            border: "1px solid #ef4444",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: "0.82rem",
            color: "#ef4444",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
