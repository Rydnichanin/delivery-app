import React, { useState, useEffect } from "react";
import {
  collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs
} from "firebase/firestore";
import { db } from "../firebase";

const DELIVERY_TYPES = [
  { id: "entrance", label: "До подъезда" },
  { id: "apartment", label: "До квартиры" },
];

export default function Checkout({ cart, user, profile, onSuccess, onBack }) {
  const [address, setAddress] = useState(profile?.savedAddress || "");
  const [apartment, setApartment] = useState(profile?.savedApartment || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [deliveryType, setDeliveryType] = useState("entrance");
  const [paymentType, setPaymentType] = useState("cash"); // cash | kaspi
  const [comment, setComment] = useState("");
  const [tariffs, setTariffs] = useState([]);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const restaurantId = cart[0]?.restaurantId;
  const restaurantName = cart[0]?.restaurantName;

  useEffect(() => {
    if (!restaurantId) return;
    // Найдём businessId ресторана
    getDoc(doc(db, "restaurants", restaurantId)).then(snap => {
      if (!snap.exists()) return;
      const businessId = snap.data().businessId;
      getDoc(doc(db, "earningsSettings", businessId)).then(eSnap => {
        if (eSnap.exists()) {
          setTariffs(eSnap.data().tariffs?.[restaurantId] || []);
        }
      });
    });
  }, [restaurantId]);

  const itemsTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryPrice = selectedTariff ? +selectedTariff.clientPrice : 0;
  const total = itemsTotal + deliveryPrice;

  const placeOrder = async () => {
    setError("");
    if (!address.trim()) { setError("Укажите адрес доставки"); return; }
    if (!phone.trim()) { setError("Укажите номер телефона"); return; }
    if (tariffs.length > 0 && !selectedTariff) { setError("Выберите тариф доставки"); return; }

    setPlacing(true);
    try {
      // Найдём businessId ресторана
      const restSnap = await getDoc(doc(db, "restaurants", restaurantId));
      const businessId = restSnap.data()?.businessId || "";
      const cityId = restSnap.data()?.cityId || "";

      await addDoc(collection(db, "orders"), {
        clientId: user.uid,
        clientName: profile?.name || "Клиент",
        clientPhone: phone,
        restaurantId,
        restaurantName,
        businessId,
        cityId,
        address: address.trim(),
        apartment: apartment.trim(),
        deliveryType,
        tariffName: selectedTariff?.name || "",
        clientPrice: deliveryPrice,
        courierEarning: selectedTariff ? +selectedTariff.courierEarning : 0,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        itemsTotal,
        total,
        paymentType,
        comment: comment.trim(),
        status: "new",
        courierId: "",
        courierName: "",
        createdAt: serverTimestamp(),
      });

      // Сохраняем адрес в профиль для следующих заказов
      await updateDoc(doc(db, "users", user.uid), {
        savedAddress: address.trim(),
        savedApartment: apartment.trim(),
        phone: phone.trim(),
      });

      onSuccess();
    } catch (e) {
      setError("Ошибка оформления. Попробуйте ещё раз.");
      console.error(e);
    }
    setPlacing(false);
  };

  return (
    <div>
      <button className="btn-link" onClick={onBack} style={{ marginBottom: 12 }}>
        ← Назад к меню
      </button>

      {/* Состав заказа */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 className="section-title">Ваш заказ — {restaurantName}</h2>
        {cart.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
            <span>{item.name} × {item.qty}</span>
            <span style={{ fontWeight: 600 }}>{(item.price * item.qty).toLocaleString()} ₸</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700 }}>
          <span>Товары:</span>
          <span>{itemsTotal.toLocaleString()} ₸</span>
        </div>
      </div>

      {/* Доставка */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 className="section-title">Доставка</h2>
        <div className="form">
          <label className="form-label">Телефон</label>
          <input className="form-input" placeholder="+7 700 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />

          <label className="form-label">Адрес</label>
          <input className="form-input" placeholder="ул. Абая 10" value={address} onChange={e => setAddress(e.target.value)} />

          <label className="form-label">Тип доставки</label>
          <div style={{ display: "flex", gap: 8 }}>
            {DELIVERY_TYPES.map(dt => (
              <button key={dt.id}
                className={`filter-btn ${deliveryType === dt.id ? "active" : ""}`}
                style={{ flex: 1 }}
                onClick={() => setDeliveryType(dt.id)}
              >
                {dt.label}
              </button>
            ))}
          </div>

          {deliveryType === "apartment" && (
            <>
              <label className="form-label">Квартира / этаж</label>
              <input className="form-input" placeholder="кв. 45, 3 этаж" value={apartment} onChange={e => setApartment(e.target.value)} />
            </>
          )}

          {tariffs.length > 0 && (
            <>
              <label className="form-label">Тариф доставки</label>
              {tariffs.map((t, i) => (
                <div key={i}
                  className="order-card"
                  style={{
                    cursor: "pointer", marginBottom: 8,
                    borderColor: selectedTariff?.name === t.name ? "var(--accent)" : "var(--border)",
                    background: selectedTariff?.name === t.name ? "var(--accent-lo)" : "var(--surface)"
                  }}
                  onClick={() => setSelectedTariff(t)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600 }}>{t.name}</span>
                    <span style={{ fontWeight: 700, color: "var(--accent)" }}>{t.clientPrice} ₸</span>
                  </div>
                </div>
              ))}
            </>
          )}

          <label className="form-label">Комментарий</label>
          <input className="form-input" placeholder="Без лука, код домофона 123..." value={comment} onChange={e => setComment(e.target.value)} />
        </div>
      </div>

      {/* Оплата */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 className="section-title">Способ оплаты</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`filter-btn ${paymentType === "cash" ? "active" : ""}`}
            style={{ flex: 1 }}
            onClick={() => setPaymentType("cash")}
          >
            💵 Наличные
          </button>
          <button
            className={`filter-btn ${paymentType === "kaspi" ? "active" : ""}`}
            style={{ flex: 1 }}
            onClick={() => setPaymentType("kaspi")}
          >
            📱 Kaspi
          </button>
        </div>
        {paymentType === "kaspi" && (
          <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: 8 }}>
            Курьер покажет QR-код для оплаты при доставке
          </p>
        )}
      </div>

      {/* Итог */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "var(--muted)" }}>Товары:</span>
          <span>{itemsTotal.toLocaleString()} ₸</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ color: "var(--muted)" }}>Доставка:</span>
          <span>{deliveryPrice ? `${deliveryPrice.toLocaleString()} ₸` : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem" }}>
          <span>Итого:</span>
          <span style={{ color: "var(--accent)" }}>{total.toLocaleString()} ₸</span>
        </div>
      </div>

      {error && (
        <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#ef4444", marginBottom: 12 }}>
          {error}
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: "100%", padding: 14, fontSize: "1rem" }}
        onClick={placeOrder}
        disabled={placing}
      >
        {placing ? "Оформляем..." : `✓ Заказать на ${total.toLocaleString()} ₸`}
      </button>
    </div>
  );
}
