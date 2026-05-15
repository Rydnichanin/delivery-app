import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PublicStore from "./PublicStore.jsx";
import Checkout from "./Checkout.jsx";
import ClientProfile from "./ClientProfile.jsx";
import Login from "./Login.jsx";

export default function Client() {
  const [page, setPage] = useState("store");
  const [cart, setCart] = useState([]);
  const { user, logout } = useAuth();

  React.useEffect(() => {
    if (user && page === "login") setPage("profile");
  }, [user, page]);

  if (page === "login") {
    return (
      <div>
        <div style={{ padding: "12px 16px" }}>
          <button className="btn-link" onClick={() => setPage("store")}>
            ← Вернуться в магазин
          </button>
        </div>
        <Login />
      </div>
    );
  }

  if (page === "checkout") {
    return (
      <Checkout
        cart={cart}
        onBack={() => setPage("store")}
        onSuccess={() => { setCart([]); setPage("profile"); }}
      />
    );
  }

  if (page === "profile") {
    return (
      <ClientProfile
        onBack={() => setPage("store")}
        onLogout={() => { logout(); setPage("store"); }}
      />
    );
  }

  return (
    <PublicStore
      user={user}
      cart={cart}
      setCart={setCart}
      onLoginRequired={() => setPage("login")}
    />
  );
}
