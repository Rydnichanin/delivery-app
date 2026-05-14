// Client.jsx — совместимая обёртка
// Вся логика клиента теперь в App.jsx → ClientApp
// Этот файл оставлен для совместимости на случай прямых импортов

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PublicStore from "./PublicStore.jsx";
import Checkout from "./Checkout.jsx";
import ClientProfile from "./ClientProfile.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";

export default function Client() {
  const [page, setPage] = useState("store");
  const [cart, setCart] = useState([]);
  const { user, logout } = useAuth();

  const navigate = (to) => setPage(to);

  if (page === "login")    return <Login onSuccess={() => navigate("profile")} onRegister={() => navigate("register")} />;
  if (page === "register") return <Register onSuccess={() => navigate("profile")} onBack={() => navigate("login")} />;
  if (page === "checkout") return <Checkout cart={cart} onBack={() => navigate("store")} onSuccess={() => { setCart([]); navigate("profile"); }} />;
  if (page === "profile")  return <ClientProfile onBack={() => navigate("store")} onLogout={() => { logout(); navigate("store"); }} />;

  return (
    <PublicStore
      cart={cart}
      setCart={setCart}
      onCheckout={() => navigate("checkout")}
      onProfile={() => navigate(user ? "profile" : "login")}
    />
  );
}
