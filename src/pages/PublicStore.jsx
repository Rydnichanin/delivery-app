import React, { useState, useEffect } from "react";
import {
  collection, onSnapshot, query, where, orderBy
} from "firebase/firestore";
import { db } from "../firebase";

// Публичный просмотр — без авторизации
export default function PublicStore({ onLoginRequired, user, cart, setCart }) {
  const [step, setStep] = useState("cities"); // cities | restaurants | menu
  const [cities, setCities] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const c = onSnapshot(collection(db, "cities"), s =>
      setCities(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return c;
  }, []);

  useEffect(() => {
    if (!selectedCity) return;
    const r = onSnapshot(
      query(collection(db, "restaurants"), where("cityId", "==", selectedCity.id)),
      s => setRestaurants(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return r;
  }, [selectedCity]);

  useEffect(() => {
    if (!selectedRestaurant) return;
    const m = onSnapshot(
      query(collection(db, "menuItems"),
        where("restaurantId", "==", selectedRestaurant.id),
        where("available", "==", true)
      ),
      s => setMenu(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return m;
  }, [selectedRestaurant]);

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1, restaurantId: selectedRestaurant.id, restaurantName: selectedRestaurant.name }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === itemId);
      if (exists && exists.qty > 1) {
        return prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Города ──
  if (step === "cities") {
    return (
      <div>
        <h2 className="section-title">Выберите ваш город</h2>
        <div className="order-list">
          {cities.map(c => (
            <div key={c.id} className="order-card" style={{ cursor: "pointer" }}
              onClick={() => { setSelectedCity(c); setStep("restaurants"); }}>
              <div className="order-card-top">
                <p className="order-restaurant">🏙️ {c.name}</p>
                <span style={{ color: "var(--accent)", fontSize: "1.2rem" }}>→</span>
              </div>
            </div>
          ))}
          {cities.length === 0 && <div className="empty">Загрузка...</div>}
        </div>
      </div>
    );
  }

  // ── Рестораны ──
  if (step === "restaurants") {
    return (
      <div>
        <button className="btn-link" onClick={() => setStep("cities")} style={{ marginBottom: 12 }}>
          ← {selectedCity?.name}
        </button>

        {cart.length > 0 && (
          <div className="card" style={{ marginBottom: 12, background: "var(--accent-lo)", border: "1px solid var(--accent)" }}
            onClick={() => user ? setStep("checkout") : onLoginRequired()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span>🛒 Корзина: {cartCount} товаров</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>{cartTotal.toLocaleString()} ₸ →</span>
            </div>
          </div>
        )}

        <input
          className="form-input"
          placeholder="🔍 Поиск заведения..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <h2 className="section-title">Заведения в {selectedCity?.name}</h2>
        <div className="order-list">
          {filteredRestaurants.map(r => (
            <div key={r.id} className="order-card" style={{ cursor: "pointer" }}
              onClick={() => {
                if (cart.length > 0 && cart[0].restaurantId !== r.id) {
                  if (!window.confirm("При смене заведения корзина очистится. Продолжить?")) return;
                  setCart([]);
                }
                setSelectedRestaurant(r);
                setStep("menu");
              }}>
              <div className="order-card-top">
                <div>
                  <p className="order-restaurant">🍴 {r.name}</p>
                  {r.address && <p className="order-address">📍 {r.address}</p>}
                  {r.workingHours && <p className="order-address">🕐 {r.workingHours}</p>}
                </div>
                <span style={{ color: "var(--accent)", fontSize: "1.2rem" }}>→</span>
              </div>
            </div>
          ))}
          {filteredRestaurants.length === 0 && (
            <div className="empty">Заведений пока нет</div>
          )}
        </div>
      </div>
    );
  }

  // ── Меню ──
  if (step === "menu") {
    const categories = [...new Set(menu.map(i => i.category || "Основное"))];

    return (
      <div>
        <button className="btn-link" onClick={() => setStep("restaurants")} style={{ marginBottom: 12 }}>
          ← {selectedRestaurant?.name}
        </button>

        {cart.length > 0 && (
          <div className="card" style={{ marginBottom: 12, background: "var(--accent-lo)", border: "1px solid var(--accent)", cursor: "pointer" }}
            onClick={() => user ? setStep("checkout") : onLoginRequired()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🛒 {cartCount} товаров</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                {cartTotal.toLocaleString()} ₸ → Оформить
              </span>
            </div>
          </div>
        )}

        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <h2 className="section-title">{cat}</h2>
            <div className="order-list">
              {menu.filter(i => (i.category || "Основное") === cat).map(item => {
                const inCart = cart.find(i => i.id === item.id);
                return (
                  <div key={item.id} className="order-card">
                    <div className="order-card-top">
                      <div style={{ flex: 1 }}>
                        <p className="order-restaurant">{item.name}</p>
                        {item.description && <p className="order-address">{item.description}</p>}
                        <p style={{ fontWeight: 700, color: "var(--accent)", marginTop: 4 }}>
                          {item.price?.toLocaleString()} ₸
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {inCart ? (
                          <>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "var(--text)", fontSize: "1.1rem" }}
                            >−</button>
                            <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{inCart.qty}</span>
                            <button
                              onClick={() => addToCart(item)}
                              style={{ background: "var(--accent)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: "1.1rem" }}
                            >+</button>
                          </>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            style={{ background: "var(--accent)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: "1.1rem" }}
                          >+</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {menu.length === 0 && <div className="empty">Меню пустое</div>}
      </div>
    );
  }
}
