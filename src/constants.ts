import type { Service } from "./types";

export const SERVICES: Service[] = [
  { id: 1, name: "Selagem", emoji: "✨", priceLabel: "A partir de R$ 150,00", duration: "2h ~ 3h" },
  { id: 2, name: "Mechas", emoji: "🎨", priceLabel: "A partir de R$ 150,00", duration: "2h ~ 4h" },
  { id: 3, name: "Corte", emoji: "✂️", priceLabel: "R$ 30,00", duration: "30min ~ 1h" },
  { id: 4, name: "Escova", emoji: "💨", priceLabel: "A partir de R$ 150,00", duration: "1h ~ 2h" },
  { id: 5, name: "Coloração", emoji: "🌈", priceLabel: "A partir de R$ 50,00", duration: "1h30 ~ 3h" },
  { id: 6, name: "Sobrancelha", emoji: "🪄", priceLabel: "R$ 20,00", duration: "20min ~ 30min" },
];

export const HORARIOS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export const STUDIO_WHATSAPP = "5583996503562";
