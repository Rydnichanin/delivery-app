import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";

export default function ClientProfile({ user, profile }) {
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.savedAddress || "");
  const [apartment, setApartment] = useState(profile?.savedApartment || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setSaving(true);
    await updateDoc(doc(db, "users", user.uid), {
      name: name.trim(),
      phone: phone.trim(),
      savedAddress: address.trim(),
      savedApartment: apartment.trim(),
    });
    setMsg("Сохранено ✓");
    setTimeout(() => setMsg(""), 3000);
    setSaving(false);
  };

  return (
    <div>
      {msg && <div className="success-banner">{msg}</div>}

      <div className="card" style={{ marginBottom: 12 }}>
        <h2 className="section-title">Личные данные</h2>
        <div className="form">
          <label className="form-label">Имя</label>
          <input className="form-input" placeholder="Алибек" value={name} onChange={e => setName(e.target.value)} />

          <label className="form-label">Телефон</label>
          <input className="form-input" placeholder="+7 700 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />

          <label className="form-label">Email</label>
          <input className="form-input" value={profile?.email || user?.email || ""} disabled style={{ opacity: 0.5 }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h2 className="section-title">Адрес доставки по умолчанию</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 12 }}>
          Будет автоматически подставляться при следующих заказах
        </p>
        <div className="form">
          <label className="form-label">Адрес</label>
          <input className="form-input" placeholder="ул. Абая 10" value={address} onChange={e => setAddress(e.target.value)} />

          <label className="form-label">Квартира / этаж</label>
          <input className="form-input" placeholder="кв. 45, 3 этаж" value={apartment} onChange={e => setApartment(e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: "100%", marginBottom: 12 }} onClick={save} disabled={saving}>
        {saving ? "Сохранение..." : "💾 Сохранить"}
      </button>

      <button className="btn btn-red" style={{ width: "100%" }} onClick={() => signOut(auth)}>
        Выйти из аккаунта
      </button>
    </div>
  );
}
