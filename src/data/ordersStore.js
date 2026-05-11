import { useEffect, useState } from "react";

const STORAGE_KEY = "delivery-orders-v1";

const seedOrders = [
  { id: "order-1", address: "ул. Абая 10", status: "new", price: 3200, clientName: "Айжан", restaurantName: "Бургер House", courierId: "" },
  { id: "order-2", address: "пр. Достык 55", status: "cooking", price: 4100, clientName: "Руслан", restaurantName: "Sushi Time", courierId: "" },
  { id: "order-3", address: "ул. Сатпаева 90", status: "delivering", price: 2700, clientName: "Дина", restaurantName: "Pizza Lab", courierId: "courier-1" }
];

function readOrders() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedOrders));
    return seedOrders;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedOrders));
    return seedOrders;
  }
}

function writeOrders(nextOrders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrders));
  window.dispatchEvent(new Event("orders:changed"));
}

export function useOrders() {
  const [orders, setOrders] = useState(() => readOrders());

  useEffect(() => {
    const sync = () => setOrders(readOrders());
    window.addEventListener("orders:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("orders:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return orders;
}

export function createOrder(payload) {
  const current = readOrders();
  const order = {
    id: `order-${Date.now()}`,
    status: "new",
    courierId: "",
    ...payload
  };

  writeOrders([order, ...current]);
}

export function updateOrder(orderId, patch) {
  const current = readOrders();
  const next = current.map(order => (order.id === orderId ? { ...order, ...patch } : order));
  writeOrders(next);
}
