import { useEffect, useMemo, useState } from "react";
import { HORARIOS, SERVICES } from "./constants";
import { addDias, formatarData, toKey } from "./dateUtils";
import { createGoogleCalendarEvent } from "./googleCalendar";
import { createAppointment, deleteAppointment, fetchAppointments } from "./services/appointmentsApi";
import type { Appointment } from "./types";
import "./styles.css";

const hoje = new Date();

const OCUPADOS_MOCK: Record<string, string[]> = {
  [toKey(hoje)]: ["09:00", "13:00", "16:00"],
  [toKey(addDias(hoje, 1))]: ["08:00", "10:00", "15:00"],
  [toKey(addDias(hoje, 2))]: ["11:00", "14:00"],
};

type Page = "home" | "agendar" | "admin";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    void loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      setLoading(true);
      setApiError("");
      const data = await fetchAppointments();
      setAgendamentos(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar dados do banco.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(newAppointment: Omit<Appointment, "id" | "createdAt">): Promise<Appointment> {
    const created = await createAppointment(newAppointment);
    setAgendamentos((prev) => [created, ...prev]);
    return created;
  }

  async function handleDelete(id: number) {
    await deleteAppointment(id);
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <>
      <Header page={page} setPage={setPage} />
      {apiError ? (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-red-950/60 border border-red-700 text-red-200 rounded-xl p-3 text-sm">{apiError}</div>
        </div>
      ) : null}
      {loading ? (
        <div className="max-w-6xl mx-auto px-4 py-10 text-gray-400">Carregando agendamentos do banco...</div>
      ) : (
        <>
          {page === "home" && <Home setPage={setPage} />}
          {page === "agendar" && <Agendar agendamentos={agendamentos} setPage={setPage} onCreate={handleCreate} />}
          {page === "admin" && <Admin agendamentos={agendamentos} onDelete={handleDelete} />}
        </>
      )}
    </>
  );
}

function Header({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  const links: Array<{ id: Page; label: string }> = [
    { id: "home", label: "Início" },
    { id: "agendar", label: "Agendar" },
    { id: "admin", label: "Painel" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-yellow-900/40" style={{ background: "rgba(10,0,5,0.95)", backdropFilter: "blur(10px)" }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={() => setPage("home")} className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl border border-yellow-700">💇‍♀️</div>
          <div className="text-left">
            <p className="font-playfair text-xl font-bold text-gold">Studio AS</p>
            <p className="text-xs text-rose-300/70">Salão de Beleza</p>
          </div>
        </button>
        <nav className="flex gap-2">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => setPage(l.id)}
              className={`px-3 py-2 rounded-xl text-sm ${page === l.id ? "bg-yellow-600/20 text-gold border border-yellow-600/40" : "text-gray-300 hover:bg-white/5"}`}
            >
              {l.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Home({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <main>
      <section className="gradient-rose py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-6xl mb-4">💇‍♀️</div>
          <h1 className="font-playfair text-5xl font-bold mb-3">
            Beleza que <span className="text-gold">transforma</span>
          </h1>
          <p className="text-rose-200/80 mb-8">Agende seu horário em poucos cliques.</p>
          <button onClick={() => setPage("agendar")} className="px-8 py-4 rounded-2xl font-bold text-gray-950 glow-gold" style={{ background: "linear-gradient(135deg,#d4af37,#f59e0b)" }}>
            Agendar Agora
          </button>
        </div>
      </section>
    </main>
  );
}

function Agendar({
  agendamentos,
  setPage,
  onCreate,
}: {
  agendamentos: Appointment[];
  setPage: (page: Page) => void;
  onCreate: (appointment: Omit<Appointment, "id" | "createdAt">) => Promise<Appointment>;
}) {
  const [servico, setServico] = useState<number | null>(null);
  const [data, setData] = useState<Date>(hoje);
  const [hora, setHora] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", phone: "", obs: "" });
  const [confirmado, setConfirmado] = useState<Appointment | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const dias = Array.from({ length: 7 }, (_, i) => addDias(hoje, i));
  const ocupados = useMemo(() => {
    const key = toKey(data);
    const doDia = agendamentos.filter((a) => a.dataKey === key).map((a) => a.hora);
    return [...(OCUPADOS_MOCK[key] || []), ...doDia];
  }, [data, agendamentos]);

  async function confirmar() {
    if (!servico || !hora || !form.nome.trim() || !form.phone.trim()) {
      alert("Preencha serviço, data, horário, nome e WhatsApp.");
      return;
    }

    const srv = SERVICES.find((s) => s.id === servico);
    if (!srv) return;

    const payload: Omit<Appointment, "id" | "createdAt"> = {
      servico: srv.name,
      emoji: srv.emoji,
      preco: srv.priceLabel,
      data: formatarData(data),
      dataKey: toKey(data),
      hora,
      nome: form.nome.trim(),
      phone: form.phone.trim(),
      obs: form.obs.trim(),
      status: "confirmado",
    };

    try {
      setSaving(true);
      setCalendarStatus("Conectando ao Google Calendar...");
      const event = await createGoogleCalendarEvent({
        servico: payload.servico,
        nome: payload.nome,
        phone: payload.phone,
        obs: payload.obs,
        data,
        hora,
      });
      payload.googleEventId = event.id;
      setCalendarStatus("Evento criado no Google Calendar com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida no Google Calendar.";
      setCalendarStatus(`Agendado no banco, mas não foi possível enviar ao Google Calendar: ${message}`);
    }

    try {
      const created = await onCreate(payload);
      setConfirmado(created);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar agendamento.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  if (confirmado) {
    return (
      <section className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-gray-900 border border-yellow-700/40 rounded-3xl p-8">
          <h2 className="font-playfair text-3xl text-gold font-bold mb-4">Agendamento confirmado</h2>
          <p className="text-gray-300 mb-2">{confirmado.emoji} {confirmado.servico}</p>
          <p className="text-gray-300 mb-2">Data: {confirmado.data}</p>
          <p className="text-gray-300 mb-2">Horário: {confirmado.hora}</p>
          <p className="text-gray-300 mb-2">Cliente: {confirmado.nome}</p>
          <p className="text-gray-300 mb-6">WhatsApp: {confirmado.phone}</p>
          {calendarStatus && <p className="text-xs text-yellow-300 mb-4">{calendarStatus}</p>}
          <p className="text-xs text-green-300 mb-4">Agendamento salvo no banco de dados com sucesso.</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-xl bg-white/10" onClick={() => setPage("home")}>Voltar ao início</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-playfair text-2xl font-bold mb-4">1) Escolha o serviço</h2>
        <div className="space-y-2">
          {SERVICES.map((s) => (
            <label key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800 cursor-pointer">
              <div>
                <p className="font-medium">{s.emoji} {s.name}</p>
                <p className="text-sm text-gray-400">{s.duration}</p>
              </div>
              <input type="radio" name="servico" checked={servico === s.id} onChange={() => setServico(s.id)} />
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-playfair text-2xl font-bold mb-4">2) Data e horário</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {dias.map((d) => (
            <button
              key={d.toISOString()}
              onClick={() => {
                setData(d);
                setHora(null);
              }}
              className={`p-2 rounded-lg text-sm border ${toKey(d) === toKey(data) ? "border-yellow-500 text-gold bg-yellow-600/10" : "border-gray-700"}`}
            >
              {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {HORARIOS.map((h) => {
            const disabled = ocupados.includes(h);
            return (
              <button
                key={h}
                disabled={disabled}
                onClick={() => setHora(h)}
                className={`p-2 rounded-lg text-sm border ${disabled ? "opacity-40 border-gray-800 cursor-not-allowed" : hora === h ? "border-yellow-500 text-gold bg-yellow-600/10" : "border-gray-700"}`}
              >
                {h}
              </button>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-playfair text-2xl font-bold mb-4">3) Seus dados</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="bg-gray-950 border border-gray-700 rounded-xl p-3" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <input className="bg-gray-950 border border-gray-700 rounded-xl p-3" placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <textarea className="md:col-span-2 bg-gray-950 border border-gray-700 rounded-xl p-3 min-h-[90px]" placeholder="Observações (opcional)" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
        </div>
        <button
          onClick={confirmar}
          disabled={saving}
          className="mt-5 px-6 py-3 rounded-xl font-bold text-gray-950 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#d4af37,#f59e0b)" }}
        >
          {saving ? "Salvando..." : "Confirmar agendamento"}
        </button>
      </div>
    </section>
  );
}

function Admin({
  agendamentos,
  onDelete,
}: {
  agendamentos: Appointment[];
  onDelete: (id: number) => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function remover(id: number) {
    if (!confirm("Deseja remover este agendamento?")) return;

    try {
      setDeletingId(id);
      await onDelete(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao remover agendamento.";
      alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="font-playfair text-3xl font-bold mb-6">Painel de Agendamentos</h2>
      {agendamentos.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">Nenhum agendamento ainda.</div>
      ) : (
        <div className="space-y-3">
          {agendamentos.map((a) => (
            <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{a.emoji} {a.servico} • {a.data} às {a.hora}</p>
                <p className="text-sm text-gray-400">{a.nome} • {a.phone}</p>
                {a.obs ? <p className="text-sm text-gray-500 mt-1">Obs: {a.obs}</p> : null}
                {a.googleEventId ? <p className="text-xs text-green-400 mt-1">Evento Google: {a.googleEventId}</p> : null}
              </div>
              <button
                onClick={() => void remover(a.id)}
                disabled={deletingId === a.id}
                className="px-3 py-2 rounded-lg bg-red-900/40 border border-red-700 text-red-300 disabled:opacity-50"
              >
                {deletingId === a.id ? "Removendo..." : "Remover"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
