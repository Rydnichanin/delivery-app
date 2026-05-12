export const STATUS_FLOW = {
  new: { label: "Новый", color: "#6366f1", next: "cooking", nextLabel: "Принять в готовку" },
  cooking: { label: "Готовится", color: "#f59e0b", next: "ready", nextLabel: "Готов к выдаче" },
  ready: { label: "Готов", color: "#10b981", next: "delivering", nextLabel: "Взять заказ" },
  delivering: { label: "В пути", color: "#3b82f6", next: "delivered", nextLabel: "Доставлено" },
  delivered: { label: "Доставлено", color: "#6b7280", next: null, nextLabel: null },
};

export function statusLabel(status) {
  return STATUS_FLOW[status]?.label ?? status;
}

export function statusColor(status) {
  return STATUS_FLOW[status]?.color ?? "#6b7280";
}
