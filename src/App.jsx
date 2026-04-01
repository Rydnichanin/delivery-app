import React from "react";
import Admin from "./pages/Admin.jsx";
import Client from "./pages/Client.jsx";
import Courier from "./pages/Courier.jsx";
import Restaurant from "./pages/Restaurant.jsx";
import AnalyticsPanel from "./pages/AnalyticsPanel.jsx";

export default function App() {
  // Для теста можно переключать страницу вручную
  const [page, setPage] = React.useState("admin");

  return (
    <div>
      <nav className="flex gap-2 p-2 bg-gray-900">
        <button onClick={() => setPage("admin")}>Диспетчер</button>
        <button onClick={() => setPage("restaurant")}>Заведение</button>
        <button onClick={() => setPage("courier")}>Курьер</button>
        <button onClick={() => setPage("client")}>Клиент</button>
        <button onClick={() => setPage("analytics")}>Аналитика</button>
      </nav>

      <div className="p-5">
        {page === "admin" && <Admin />}
        {page === "restaurant" && <Restaurant />}
        {page === "courier" && <Courier />}
        {page === "client" && <Client orderId="testOrder" />}
        {page === "analytics" && <AnalyticsPanel />}
      </div>
    </div>
  );
}
