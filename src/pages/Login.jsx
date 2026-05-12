import React, { useState, useRef, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone"); // phone | code
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef(null);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    // Инициализируем невидимую reCAPTCHA
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  }, []);

  const sendCode = async () => {
    setError("");
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const formatted = phone.startsWith("+") ? phone : "+7" + phone.replace(/\D/g, "").slice(-10);
      const confirm = await signInWithPhoneNumber(auth, formatted, window.recaptchaVerifier);
      confirmRef.current = confirm;
      setStep("code");
    } catch (e) {
      setError("Ошибка отправки SMS. Проверьте номер.");
      console.error(e);
      // Сбрасываем reCAPTCHA при ошибке
      window.recaptchaVerifier?.clear();
      window.recaptchaVerifier = null;
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    setError("");
    if (!code.trim()) return;
    setLoading(true);
    try {
      await confirmRef.current.confirm(code);
      // onAuthStateChanged в AuthContext подхватит пользователя
    } catch (e) {
      setError("Неверный код. Попробуйте ещё раз.");
      console.error(e);
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
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
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
              onKeyDown={(e) => e.key === "Enter" && verifyCode()}
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

        {error && <p className="error-msg">{error}</p>}

        <div id="recaptcha-container" />
      </div>
    </div>
  );
        }
        
