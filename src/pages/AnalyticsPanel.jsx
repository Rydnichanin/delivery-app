import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useOrders } from "../data/ordersStore";

export default function AnalyticsPanel() {
  const orders = useOrders();

  const statusData = useMemo(() => {
    const statusCount = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(statusCount).map(key => ({ name: key, value: statusCount[key] }));
  }, [orders]);

  const revenue = useMemo(() => orders.reduce((acc, o) => acc + (o.price || 0), 0), [orders]);

  const courierData = useMemo(() => {
    const courierCount = orders.reduce((acc, o) => {
      if (!o.courierId) return acc;
      acc[o.courierId] = (acc[o.courierId] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(courierCount).map(key => ({ name: key, delivered: courierCount[key] }));
  }, [orders]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="p-5 bg-black text-white min-h-screen">
      <h1 className="text-2xl mb-5">Панель аналитики</h1>
      <div className="mb-10">
        <h2 className="text-xl mb-2">Статус заказов</h2>
        <PieChart width={400} height={300}>
          <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
            {statusData.map((entry, index) => <Cell key={entry.name + index} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>
      <div className="mb-10">
        <h2 className="text-xl mb-2">Доход</h2>
        <p className="text-2xl">{revenue} ₸</p>
      </div>
      <div className="mb-10">
        <h2 className="text-xl mb-2">Эффективность курьеров</h2>
        <BarChart width={500} height={300} data={courierData}>
          <XAxis dataKey="name" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Bar dataKey="delivered" fill="#00C49F" />
        </BarChart>
      </div>
    </div>
  );
}
