import { useOrders, updateOrder } from "../data/ordersStore";

export default function Restaurant() {
  const orders = useOrders();
  const queue = orders.filter(order => ["new", "cooking", "ready"].includes(order.status));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Заведение</h1>
      {queue.map(order => (
        <div key={order.id} className="p-3 rounded-lg border border-gray-700 mb-2">
          <p>{order.restaurantName} • {order.address}</p>
          <p>Статус: <b>{order.status}</b></p>
          <button className="bg-green-700 px-3 py-1 rounded mt-2" onClick={() => updateOrder(order.id, { status: "ready" })}>Отметить как готовый</button>
        </div>
      ))}
    </div>
  );
}
