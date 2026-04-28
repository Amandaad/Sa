import type { Appointment } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost/studio-as-api/api";
const ENDPOINT = `${API_BASE_URL}/agendamentos.php`;

export async function fetchAppointments(): Promise<Appointment[]> {
  const response = await fetch(ENDPOINT);
  if (!response.ok) {
    throw new Error("Não foi possível carregar agendamentos do banco.");
  }
  return (await response.json()) as Appointment[];
}

export async function createAppointment(payload: Omit<Appointment, "id" | "createdAt">): Promise<Appointment> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Falha ao salvar no banco: ${err}`);
  }

  return (await response.json()) as Appointment;
}

export async function deleteAppointment(id: number): Promise<void> {
  const response = await fetch(`${ENDPOINT}?id=${id}`, { method: "DELETE" });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Falha ao remover no banco: ${err}`);
  }
}
