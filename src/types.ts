export type Service = {
  id: number;
  name: string;
  emoji: string;
  priceLabel: string;
  duration: string;
};

export type Appointment = {
  id: number;
  servico: string;
  emoji: string;
  preco: string;
  data: string;
  dataKey: string;
  hora: string;
  nome: string;
  phone: string;
  obs: string;
  status: "confirmado";
  googleEventId?: string;
  createdAt?: string;
};
