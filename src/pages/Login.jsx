import React, { useState, useRef, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef(null);

  const initRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch {}
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      { size: "invisible" }
    );
  };

  useEffect(() => {
    initRecaptcha();
  }, []);

  const sendCode = async () => {
    setError("");
    const raw = phone.replace(/\s/g, "");
    const formatted = raw.startsWith("+") ? raw : "+7" + raw.replace(/\D/g, "").slice(-10);

    if (formatted.length < 12) {
      setError("Введите полный номер телефона");
      return;
    }

    setLoading(true);
    try {
      if (!window.recaptchaVerifier) initRecaptcha();
      const confirm = await signInWithPhoneNumber(auth, formatted, window.recaptchaVerifier);
      confirmRef.current = confirm;
      setStep("code");
    } catch (e) {
      // Показываем полный код ошибки
      setError(`Ошибка: ${e.code} — ${e.message}`);
      initRecaptcha();
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    setError("");
    if (!code.trim()) return;
    setLoading(true);
    try {
      await confirmRef.current.confirm(code);
    } catch (e) {
      setError(`Ошибка: ${e.code} — ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">⚡</div>
        <h1 className="login-title">Delivery OS</h1>
        <p className="login-sub">
          {step === "phone" ? "Введите номер телефона" : "Введите код из SMS"}
        </p>

        {step === "phone" && (
          <>
            <input
              className="form-input"
              type="tel"
              placeholder="+7 700 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              className="btn btn-primary login-btn"
              onClick={sendCode}
              disabled={loading}
            >
              {loading ? "Отправка..." : "Получить код →"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <p className="login-phone-hint">Код отправлен на {phone}</p>
            <input
              className="form-input"
              type="number"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            <button
              className="btn btn-primary login-btn"
              onClick={verifyCode}
              disabled={loading}
            >
              {loading ? "Проверка..." : "Войти →"}
            </button>
            <button
              className="btn-link"
              onClick={() => { setStep("phone"); setError(""); setCode(""); }}
            >
              ← Изменить номер
            </button>
          </>
        )}

        {error && (
          <div style={{
            background: "#ef444422",
            border: "1px solid #ef4444",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: "0.78rem",
            color: "#ef4444",
            wordBreak: "break-all",
            lineHeight: 1.5
          }}>
            {error}
          </div>
        )}

        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
