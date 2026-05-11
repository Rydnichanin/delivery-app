import { useOrders, updateOrder } from "../data/ordersStore";

const COURIER_ID = "courier-1";

export default function Courier() {
  const orders = useOrders();
  const available = orders.filter(order => order.status === "ready" && !order.courierId);
  const mine = orders.filter(order => order.courierId === COURIER_ID && ["delivering", "delivered"].includes(order.status));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Курьер</h1>
      <h2 className="text-lg mb-2">Доступные заказы</h2>
      {available.map(order => (
        <div key={order.id} className="p-3 border border-gray-700 rounded-lg mb-2">
          <p>{order.address}</p>
          <button className="bg-indigo-600 px-3 py-1 rounded mt-2" onClick={() => updateOrder(order.id, { courierId: COURIER_ID, status: "delivering" })}>Взять заказ</button>
        </div>
      ))}

      <h2 className="text-lg mt-6 mb-2">Мои доставки</h2>
      {mine.map(order => (
        <div key={order.id} className="p-3 border border-gray-700 rounded-lg mb-2">
          <p>{order.address} — <b>{order.status}</b></p>
          {order.status === "delivering" && (
            <button className="bg-emerald-700 px-3 py-1 rounded mt-2" onClick={() => updateOrder(order.id, { status: "delivered" })}>Доставлено</button>
          )}
        </div>
      ))}
    </div>
  );
}
