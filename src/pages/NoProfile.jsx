import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function NoProfile({ user }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">⏳</div>
        <h1 className="login-title">Ожидание доступа</h1>
        <p className="login-sub">
          Ваш номер <b>{user?.phoneNumber}</b> зарегистрирован.
          <br /><br />
          Администратор ещё не назначил вам роль.
          Обратитесь к администратору системы.
        </p>
        <button
          className="btn btn-primary login-btn"
          style={{ marginTop: 24 }}
          onClick={() => signOut(auth)}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
