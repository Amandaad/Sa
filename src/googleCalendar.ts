import { parseDateAndHour } from "./dateUtils";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

const GOOGLE_API_URL = "https://www.googleapis.com/calendar/v3/calendars";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events";

let tokenClient: ReturnType<NonNullable<Window["google"]>["accounts"]["oauth2"]["initTokenClient"]> | null = null;
let accessToken: string | null = null;

async function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src=\"${src}\"]`)) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar script Google."));
    document.head.appendChild(script);
  });
}

export async function ensureGoogleAuthReady(): Promise<void> {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    throw new Error("Defina VITE_GOOGLE_CLIENT_ID no .env");
  }

  await loadScript("https://accounts.google.com/gsi/client");

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google OAuth indisponível no navegador.");
  }

  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          throw new Error(response.error || "Não foi possível autenticar no Google.");
        }
        accessToken = response.access_token;
      },
    });
  }
}

export async function requestGoogleToken(): Promise<string> {
  await ensureGoogleAuthReady();

  if (accessToken) return accessToken;

  if (!tokenClient) {
    throw new Error("Cliente OAuth não inicializado.");
  }

  await new Promise<void>((resolve, reject) => {
    const original = tokenClient as NonNullable<typeof tokenClient>;
    const wrapped = window.google!.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || "Falha na autenticação Google."));
          return;
        }
        accessToken = response.access_token;
        resolve();
      },
    });

    tokenClient = wrapped;
    const hasPreviousGrant = Boolean(accessToken);
    wrapped.requestAccessToken({ prompt: hasPreviousGrant ? "" : "consent" });

    tokenClient = original;
  });

  if (!accessToken) {
    throw new Error("Token não disponível após login.");
  }

  return accessToken;
}

export async function createGoogleCalendarEvent(params: {
  servico: string;
  nome: string;
  phone: string;
  obs: string;
  data: Date;
  hora: string;
  durationMinutes?: number;
}): Promise<{ id: string; htmlLink: string }> {
  const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("Defina VITE_GOOGLE_CALENDAR_ID no .env");
  }

  const token = await requestGoogleToken();

  const start = parseDateAndHour(params.data, params.hora);
  const end = new Date(start.getTime() + (params.durationMinutes ?? 60) * 60_000);

  const response = await fetch(`${GOOGLE_API_URL}/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: `Studio AS - ${params.servico}`,
      description: [
        `Cliente: ${params.nome}`,
        `WhatsApp: ${params.phone}`,
        params.obs ? `Observações: ${params.obs}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      start: {
        dateTime: start.toISOString(),
      },
      end: {
        dateTime: end.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Erro ao criar evento no Google Calendar: ${detail}`);
  }

  const data = (await response.json()) as { id: string; htmlLink: string };
  return data;
}
