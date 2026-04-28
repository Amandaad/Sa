# Studio AS - Sistema de Agendamentos (TypeScript + PHP + MySQL)

Aplicação web de agendamento para salão de beleza com:
- frontend React + TypeScript
- integração Google Calendar
- persistência em MySQL (phpMyAdmin) via API PHP

## Stack

- React 18
- TypeScript
- Vite
- PHP 8+
- MySQL/MariaDB (phpMyAdmin)
- Google Calendar API

## Estrutura

```text
.
├─ src/
│  ├─ App.tsx
│  ├─ constants.ts
│  ├─ dateUtils.ts
│  ├─ googleCalendar.ts
│  ├─ services/
│  │  └─ appointmentsApi.ts
│  ├─ styles.css
│  ├─ main.tsx
│  └─ types.ts
├─ api/
│  ├─ agendamentos.php
│  └─ config.example.php
├─ database/
│  └─ schema.sql
├─ .env.example
└─ README.md
```

## 1) Configurar banco no phpMyAdmin

1. Abra o `phpMyAdmin`.
2. Vá em `Importar`.
3. Importe o arquivo [`database/schema.sql`](database/schema.sql).
4. Isso cria o banco `studio_as` e a tabela `agendamentos`.

## 2) Configurar API PHP

1. Copie `api/config.example.php` para `api/config.php`.
2. Ajuste usuário/senha do MySQL local se necessário.
3. Coloque a pasta do projeto (ou ao menos a pasta `api`) dentro do `htdocs` do XAMPP.

Exemplo de URL esperada da API:

```text
http://localhost/studio-as-api/api/agendamentos.php
```

## 3) Configurar frontend

Copie `.env.example` para `.env` e preencha:

```bash
VITE_GOOGLE_CLIENT_ID=SEU_CLIENT_ID_GOOGLE
VITE_GOOGLE_CALENDAR_ID=cursotiamanda@hotmail.com
VITE_API_BASE_URL=http://localhost/studio-as-api/api
```

## 4) Rodar frontend

```bash
npm install
npm run dev
```

## 5) Fluxo de agendamento

Ao confirmar agendamento:
1. tenta criar evento no Google Calendar
2. salva agendamento no banco MySQL via PHP
3. aparece no painel admin
4. pode remover do painel (DELETE na API)

## Endpoints PHP

- `GET /api/agendamentos.php` → lista agendamentos
- `POST /api/agendamentos.php` → cria agendamento
- `DELETE /api/agendamentos.php?id=123` → remove agendamento

## Observações

- Se o Google Calendar falhar, o agendamento ainda é salvo no banco.
- Para produção, restrinja CORS e proteja endpoints com autenticação.

## Relatório diário por e-mail (SQL -> Email)

Foi adicionado o script:

- `api/enviar_relatorio_diario.php`

Ele consulta os agendamentos do dia no MySQL e envia um e-mail com tabela completa.

### Configuração

1. Copie `api/config.example.php` para `api/config.php`.
2. Preencha no `config.php`:
   - `report_email_to`
   - `report_email_from`
   - `timezone`
   - `report_token` (opcional para chamada HTTP)

### Executar manualmente

Via navegador:

```text
http://localhost/studio-as-api/api/enviar_relatorio_diario.php?token=troque-este-token
```

Via terminal (recomendado para automação):

```bash
php C:\xampp\htdocs\studio-as-api\api\enviar_relatorio_diario.php
```

### Agendar automático (Windows Task Scheduler)

Crie uma tarefa diária com ação:

```text
Programa/script: C:\xampp\php\php.exe
Argumentos: C:\xampp\htdocs\studio-as-api\api\enviar_relatorio_diario.php
```

Sugestão: executar todos os dias às 19:30.

### Importante sobre e-mail no PHP

O script usa `mail()` nativo do PHP. Em ambiente local, isso depende de SMTP configurado no `php.ini`/servidor.
Se o envio falhar, a API retorna erro informando a falha de envio.
