export default function OrderCard({ order, onAction }) {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-2xl shadow-lg mb-3">
      <div className="flex justify-between">
        <div>
          <p className="font-bold">{order.address}</p>
          <p className="text-gray-400">{order.status}</p>
        </div>
        <button onClick={() => onAction(order.id)} className="bg-green-500 px-4 py-2 rounded-xl">
          Действие
        </button>
      </div>
    </div>
  );
}
