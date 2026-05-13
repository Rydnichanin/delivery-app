import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import Register from "./Register.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) return <Register onBack={() => setShowRegister(false)} />;

  const login = async () => {
    setError("");
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      const msgs = {
        "auth/invalid-credential": "Неверный email или пароль",
        "auth/user-not-found": "Пользователь не найден",
        "auth/wrong-password": "Неверный пароль",
        "auth/too-many-requests": "Слишком много попыток. Подождите.",
      };
      setError(msgs[e.code] || `Ошибка: ${e.code}`);
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">⚡</div>
        <h1 className="login-title">Delivery OS</h1>
        <p className="login-sub">Войдите в систему</p>

        <label className="form-label">Email</label>
        <input
          className="form-input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />

        <label className="form-label">Пароль</label>
        <input
          className="form-input"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />

        <button className="btn btn-primary login-btn" onClick={login} disabled={loading}>
          {loading ? "Вход..." : "Войти →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button className="btn-link" onClick={() => setShowRegister(true)}>
            🎫 Есть код приглашения? Зарегистрироваться
          </button>
        </div>

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
