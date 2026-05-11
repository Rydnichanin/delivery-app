import { useOrders, updateOrder } from "../data/ordersStore";

export default function Admin() {
  const orders = useOrders();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Диспетчер</h1>
      <div className="space-y-2">
        {orders.map(order => (
          <div key={order.id} className="p-3 rounded-lg border border-gray-700">
            <p><b>{order.restaurantName}</b> → {order.address}</p>
            <p>Клиент: {order.clientName} | Статус: <b>{order.status}</b></p>
            <div className="mt-2 flex gap-2">
              <button className="bg-blue-600 px-3 py-1 rounded" onClick={() => updateOrder(order.id, { status: "cooking" })}>В готовку</button>
              <button className="bg-amber-600 px-3 py-1 rounded" onClick={() => updateOrder(order.id, { status: "ready" })}>Готов к выдаче</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
