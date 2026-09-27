export function fmtDate(d: Date | null | undefined) {
  return d ? d.toLocaleDateString("ru-RU", { timeZone: "UTC" }) : "—";
}

export function fmtDateTime(d: Date | null | undefined) {
  return d ? d.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }) : "—";
}

export function fmtMoney(v: { toString(): string } | null | undefined) {
  return v == null
    ? "—"
    : Number(v.toString()).toLocaleString("ru-RU", { style: "currency", currency: "RUB" });
}

export function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
