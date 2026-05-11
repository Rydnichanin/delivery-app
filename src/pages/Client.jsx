import { useState } from "react";
import { createOrder, useOrders } from "../data/ordersStore";

export default function Client() {
  const orders = useOrders();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("Новый клиент");

  const myOrders = orders.filter(order => order.clientName === name).slice(0, 5);

  const submit = e => {
    e.preventDefault();
    if (!address.trim()) return;
    createOrder({
      address,
      clientName: name,
      restaurantName: "Demo Kitchen",
      price: 3000 + Math.round(Math.random() * 2500)
    });
    setAddress("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Клиент</h1>
      <form onSubmit={submit} className="space-y-2 mb-5 max-w-md">
        <input className="w-full p-2 rounded text-black" value={name} onChange={e => setName(e.target.value)} placeholder="Имя" />
        <input className="w-full p-2 rounded text-black" value={address} onChange={e => setAddress(e.target.value)} placeholder="Адрес доставки" />
        <button className="bg-purple-700 px-3 py-1 rounded">Создать заказ</button>
      </form>

      <h2 className="text-lg mb-2">Мои заказы</h2>
      {myOrders.map(order => (
        <p key={order.id} className="mb-1">{order.address} — <b>{order.status}</b></p>
      ))}
    </div>
  );
}
