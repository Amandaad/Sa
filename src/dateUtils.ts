export function addDias(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function toKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatarData(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function parseDateAndHour(date: Date, hora: string): Date {
  const [hours, minutes] = hora.split(":").map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  return start;
}
