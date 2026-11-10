/* Mente & Transformação — protótipo funcional com persistência local */

const STORAGE_KEY = "mente-transformacao-clinic-v5";
const SPECIALTIES = [
  "Psicologia",
  "Psicopedagogia",
  "Neuropsicologia",
  "Neuropsicopedagogia",
  "Nutrição",
  "Musicoterapia",
  "Psicomotricidade",
  "Fonoaudiologia",
  "Terapia Ocupacional",
  "Psicoterapia",
];

const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayKey = () => dateKey(new Date());
const addDays = (key, days) => { const d = new Date(`${key}T12:00:00`); d.setDate(d.getDate() + days); return dateKey(d); };
const monthOf = (key) => key.slice(0, 7);
const shiftMonth = (month, delta) => { const [y, m] = month.split("-").map(Number); return dateKey(new Date(y, m - 1 + delta, 1)).slice(0, 7); };
const timeToMin = (time) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
const longDate = (key) => new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${key}T12:00:00`));
const monthTitle = (month) => new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SESSION_MINUTES = 60;
const SLOTS = Array.from({ length: 10 }, (_, i) => `${pad2(8 + i)}:00`);

function seedUnavailability() {
  const today = todayKey();
  return [
    { id: "una-1", professionalId: "prof-lorrayne", date: addDays(today, 2), allDay: true, start: "", end: "", note: "Exemplo de dia indisponível" },
    { id: "una-2", professionalId: "prof-eduardo", date: addDays(today, 1), allDay: false, start: "13:00", end: "18:00", note: "Exemplo de horário indisponível" },
  ];
}

const demoState = {
  clinic: {
    name: "Clínica Mente & Transformação",
    address: "Av. Exemplo, 1200 — Centro",
    phone: "(00) 0000-0000",
    email: "contato@menteetransformacao.com",
    director: "Dra. Vânia Ferreira Garcia",
    directorRole: "Psicóloga · CRP 10/10102 · Psicopedagoga especialista em Autismo",
    directorCode: "CRP 10/10102",
  },
  professionals: [
    { id: "prof-lorrayne", name: "Lorrayne Kendaly Luna Costa", specialty: "Neuropsicologia", code: "CRP 10/11303", focus: "Avaliação neuropsicológica, psicoterapia infantil e orientação parental. Pós-graduanda em Intervenção ABA para Autismo e Deficiência Intelectual." },
    { id: "prof-gabrielly", name: "Gabrielly Lima", specialty: "Nutrição", code: "CRN-7 17462/P", focus: "Nutrição clínica e hospitalar. Especialização em andamento em Nutrição em Neuropsiquiatria." },
    { id: "prof-eduardo", name: "Eduardo Vilhena", specialty: "Psicologia", code: "CRP 10/11278", focus: "Terapia Cognitivo-Comportamental (TCC), avaliação psicológica e acompanhamento em saúde mental." },
    { id: "prof-psicanalista", name: "Psicóloga e psicanalista (nome a informar)", specialty: "Psicologia", code: "", focus: "Escuta psicanalítica para adolescentes, adultos, idosos e casais. Especialista em Saúde Mental." },
    { id: "prof-costa", name: "Dr. Costa", specialty: "Fonoaudiologia", code: "", focus: "Fonoaudiólogo e terapeuta ABA. Comunicação e linguagem, motricidade orofacial e dificuldades alimentares em crianças e adultos neurodivergentes." },
    { id: "prof-audrey", name: "Audrey Andrade", specialty: "Neuropsicologia", code: "CRP 10/06517", focus: "Neuropsicologia." },
    { id: "prof-moniele", name: "Moniele Matos", specialty: "Psicopedagogia", code: "", focus: "Psicopedagoga clínica, especialista em neuropsicologia." },
    { id: "prof-nessia", name: "Néssia Arruda", specialty: "Psicomotricidade", code: "", focus: "Psicomotricista." },
    { id: "prof-laiane", name: "Laiane de Paula", specialty: "Nutrição", code: "CRN 7/17265", focus: "Nutricionista." },
  ],
  accounts: [
    { username: "dravania", role: "admin", hash: "c117add62f69b58a461d8e4550203b6e314d282d579291a933fbf813f12af3c4" },
  ],
  unavailability: seedUnavailability(),
  patients: [
    {
      id: "case-miguel",
      name: "Miguel Alves",
      gender: "Masculino",
      birthDate: "2019-06-15",
      cpf: "000.000.000-00",
      guardians: [
        { relation: "Mãe", name: "Mariana Alves", cpf: "000.000.000-00", phone: "(00) 90000-0000", email: "mariana@email.com" },
        { relation: "Pai", name: "Carlos Alves", cpf: "000.000.000-00", phone: "(00) 90000-0000", email: "carlos@email.com" },
      ],
      hypothesis: { has: true, narrative: "Família relata dificuldades na comunicação e interação em contextos sociais." },
      diagnosis: { has: true, fileName: "avaliacao-escolar.pdf" },
      familyComplaint: "A família observa atraso na fala, frustração ao comunicar necessidades e dificuldades de adaptação na escola.",
      assignedIds: ["prof-lorrayne", "prof-costa"],
      status: "Em acompanhamento",
      createdAt: "2026-10-21",
    },
    {
      id: "case-luiza",
      name: "Luíza Nascimento",
      gender: "Feminino",
      birthDate: "2016-01-23",
      cpf: "000.000.000-00",
      guardians: [{ relation: "Mãe", name: "Rafaela Nascimento", cpf: "000.000.000-00", phone: "(00) 90000-0000", email: "rafaela@email.com" }],
      hypothesis: { has: false, narrative: "" },
      diagnosis: { has: false, fileName: "" },
      familyComplaint: "A família busca acompanhamento para dificuldades de aprendizagem e organização da rotina escolar.",
      assignedIds: ["prof-lorrayne", "prof-gabrielly"],
      status: "Em acompanhamento",
      createdAt: "2026-10-24",
    },
  ],
  reports: {
    "case-miguel": {
      "prof-lorrayne": {
        complaint: "Observa-se dificuldade de comunicação de necessidades e regulação emocional diante de mudanças de rotina.",
        plan: "Realizar acolhimento lúdico, observação clínica e orientação parental com foco em previsibilidade e comunicação.",
        result: "Vínculo terapêutico iniciado. Miguel passou a aceitar melhor a transição entre atividades em sessão.",
        updatedAt: "2026-10-28",
      },
    },
  },
  sessions: {
    "case-miguel": {
      "prof-lorrayne": [
        { id: "s1", date: "2026-10-27", time: "09:00", objective: "Entrevista inicial e observação clínica", status: "Realizada" },
        { id: "s2", date: "2026-11-03", time: "09:00", objective: "Atividade de vínculo e comunicação", status: "Agendada" },
      ],
    },
  },
};

let state = loadState();
let ui = { role: null, account: null, newAccess: null, editProfessionalId: null, agenda: { month: monthOf(todayKey()), date: null }, sched: {}, draftSessions: [], draftAssigned: null, view: "dashboard", activeCaseId: "case-miguel", professionalId: "prof-lorrayne", filterSpecialty: "Todas", caseTab: "registro" };

/* Acesso: a senha nunca é guardada, só o hash (SHA-256).
   ATENÇÃO: sem servidor, isto é apenas uma barreira de tela. Quem tiver acesso ao navegador ou
   aos arquivos consegue contorná-la. Autenticação segura exige back-end. */
function sha256(str) {
  const bytes = new TextEncoder().encode(str);
  if (window.crypto?.subtle) {
    return crypto.subtle.digest('SHA-256', bytes).then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''));
  }
  // alternativa para contextos sem crypto.subtle
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const len = bytes.length, total = ((len + 9 + 63) >> 6) << 6, m = new Uint8Array(total);
  m.set(bytes); m[len] = 0x80;
  const dv = new DataView(m.buffer); dv.setUint32(total - 4, len * 8, false); dv.setUint32(total - 8, Math.floor(len * 8 / 4294967296), false);
  const rr = (x, n) => (x >>> n) | (x << (32 - n)), w = new Uint32Array(64);
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4, false);
    for (let i = 16; i < 64; i++) { const a = rr(w[i-15],7) ^ rr(w[i-15],18) ^ (w[i-15] >>> 3), b = rr(w[i-2],17) ^ rr(w[i-2],19) ^ (w[i-2] >>> 10); w[i] = (w[i-16] + a + w[i-7] + b) | 0; }
    let [a,b,c,d,e,f,g,h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rr(e,6) ^ rr(e,11) ^ rr(e,25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rr(a,2) ^ rr(a,13) ^ rr(a,22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a,b,c,d,e,f,g,h].forEach((v, i) => (H[i] = (H[i] + v) | 0));
  }
  return Promise.resolve([...H].map(x => (x >>> 0).toString(16).padStart(8, '0')).join(''));
}

const hashPassword = (username, password) => sha256(`mt-portal:${username}:${password}`);
const normUser = (value) => String(value || "").trim().replace(/^@+/, "").toLowerCase();
const ADMIN_VIEWS = ["professionals", "anamnese", "assignments"];

const LOCK_KEY = "mt-login-lock";
const readLock = () => { try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { n: 0, until: 0 }; } catch { return window.__mtLock || { n: 0, until: 0 }; } };
const writeLock = (value) => { try { localStorage.setItem(LOCK_KEY, JSON.stringify(value)); } catch { window.__mtLock = value; } };
const lockedFor = () => Math.max(0, Math.ceil((readLock().until - Date.now()) / 1000));
function registerFailure() { const lock = readLock(); lock.n += 1; if (lock.n >= 5) { lock.until = Date.now() + 30000; lock.n = 0; } writeLock(lock); }
const clearFailures = () => writeLock({ n: 0, until: 0 });

function suggestUsername(name) {
  const words = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z\s]/g, " ").split(/\s+/).filter((word) => word && !["dr", "dra"].includes(word));
  const base = (words.length > 1 ? `${words[0]}.${words[words.length - 1]}` : words[0] || "profissional");
  let username = base, n = 2;
  while (state.accounts.some((account) => account.username === username)) username = `${base}${n++}`;
  return username;
}

function generatePassword(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(length)), (n) => alphabet[n % alphabet.length]).join("");
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const loaded = stored ? JSON.parse(stored) : structuredClone(demoState);
    loaded.unavailability ||= [];
    return loaded;
  } catch {
    return structuredClone(demoState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((item) => item[0]).join("").toUpperCase() || "MT";
}

function ageFromDate(date) {
  if (!date) return "—";
  const born = new Date(`${date}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const month = today.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < born.getDate())) age -= 1;
  return `${age} anos`;
}

function dateLabel(date) {
  if (!date) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function getPatient(id = ui.activeCaseId) { return state.patients.find((patient) => patient.id === id); }
function getProfessional(id) { return state.professionals.find((professional) => professional.id === id); }
function getAssigned(patient) { return patient ? patient.assignedIds.map(getProfessional).filter(Boolean) : []; }
function patientReports(patientId) { return state.reports[patientId] || {}; }
function patientSessions(patientId, professionalId) { return state.sessions[patientId]?.[professionalId] || []; }
function professionalSessions(professionalId) {
  return state.patients.flatMap((patient) => patientSessions(patient.id, professionalId).map((session) => ({ patient, session })));
}

function busyBlocks(professionalId, date) {
  const blocks = state.unavailability.filter((item) => item.professionalId === professionalId && item.date === date).map((item) => ({ kind: "off", start: item.allDay ? 0 : timeToMin(item.start), end: item.allDay ? 1440 : timeToMin(item.end) }));
  professionalSessions(professionalId).forEach(({ session }) => { if (session.date === date && session.time && session.status === "Agendada") blocks.push({ kind: "session", start: timeToMin(session.time), end: timeToMin(session.time) + SESSION_MINUTES }); });
  ui.draftSessions.filter((draft) => draft.professionalId === professionalId && draft.date === date).forEach((draft) => blocks.push({ kind: "draft", start: timeToMin(draft.time), end: timeToMin(draft.time) + SESSION_MINUTES }));
  return blocks;
}

function slotKind(professionalId, date, time) {
  const start = timeToMin(time), end = start + SESSION_MINUTES;
  return busyBlocks(professionalId, date).find((block) => start < block.end && block.start < end)?.kind || "free";
}

const freeSlots = (professionalId, date) => date < todayKey() ? [] : SLOTS.filter((time) => slotKind(professionalId, date, time) === "free");

function conflictMessage(professionalId, date, time) {
  if (!date || !time) return "Informe o dia e o horário.";
  if (date < todayKey()) return "Escolha uma data a partir de hoje.";
  const kind = slotKind(professionalId, date, time);
  if (kind === "off") return "O profissional marcou indisponibilidade nesse dia e horário.";
  if (kind !== "free") return "O profissional já tem atendimento marcado nesse horário.";
  return "";
}

function calState(scope) {
  if (scope === "agenda") return ui.agenda;
  return ui.sched[scope] ||= { month: monthOf(todayKey()), date: null };
}

function monthCalendar(scope, month, cellFor, compact = false) {
  const first = new Date(`${month}-01T12:00:00`);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Array(first.getDay()).fill('<span class="cal-blank"></span>');
  for (let day = 1; day <= days; day++) cells.push(cellFor(`${month}-${pad2(day)}`, day));
  return `<div class="calendar ${compact ? "compact" : ""}"><div class="calendar-head"><button type="button" class="cal-nav" data-cal-nav="${scope}|-1" aria-label="Mês anterior">‹</button><strong>${monthTitle(month)}</strong><button type="button" class="cal-nav" data-cal-nav="${scope}|1" aria-label="Próximo mês">›</button></div><div class="calendar-grid">${WEEKDAYS.map((day) => `<span class="cal-weekday">${day}</span>`).join("")}${cells.join("")}</div></div>`;
}

function setView(view) { ui.view = view; ui.newAccess = null; ui.editProfessionalId = null; ui.draftSessions = []; ui.draftAssigned = null; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

function toast(message, isError = false) {
  const region = document.querySelector("#toast-region");
  if (!region) return;
  const item = document.createElement("div");
  item.className = `toast${isError ? " error" : ""}`;
  item.textContent = message;
  region.append(item);
  window.setTimeout(() => item.remove(), 3600);
}

function loginTemplate() {
  return `
    <main class="login-page">
      <section class="login-hero" aria-label="Mente e Transformação">
        <div class="brand"><img class="brand-logo" src="assets/logo-horizontal-branco.png" alt="Mente e Transformação · Clínica"></div>
        <div class="login-message">
          <p class="eyebrow">Gestão clínica integrada</p>
          <h1>O cuidado começa com escuta e conexão.</h1>
          <p>Organize cada etapa do acompanhamento multidisciplinar em um espaço seguro, claro e humano.</p>
        </div>
        <div class="login-footer">Painel clínico · versão inicial</div>
      </section>
      <section class="login-panel">
        <div class="login-card">
          <p class="eyebrow" style="color:var(--forest-700)">Acesso ao sistema</p>
          <h2>Entrar no painel</h2>
          <p>Use o usuário e a senha fornecidos pela administração da clínica.</p>
          <form id="login-form" novalidate>
            <div class="form-grid">
              <div class="field full"><label for="login-user">Usuário</label><input id="login-user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="seu.usuario" required /></div>
              <div class="field full"><label for="login-password" id="login-password-label">Senha</label><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required /></div>
              <div class="field full hidden" id="login-confirm-field"><label for="login-confirm">Repita a nova senha</label><input id="login-confirm" name="confirm" type="password" autocomplete="new-password" placeholder="Repita a senha" /></div>
            </div>
            <p class="form-message" id="login-message" role="alert" hidden></p>
            <div class="form-actions"><button class="button" type="submit">Entrar</button></div>
          </form>
          <p class="login-note">Acesso de demonstração: usuários e senhas ficam salvos apenas neste navegador.</p>
        </div>
      </section>
    </main>`;
}

async function submitLogin(event) {
  event.preventDefault();
  const form = event.currentTarget, message = document.querySelector("#login-message");
  const fail = (text) => { message.textContent = text; message.hidden = false; message.className = "form-message error"; };
  const wait = lockedFor();
  if (wait > 0) return fail(`Muitas tentativas. Tente de novo em ${wait}s.`);
  const data = new FormData(form), username = normUser(data.get("username")), password = String(data.get("password") || "");
  if (!username || !password) return fail("Informe usuário e senha.");
  const account = state.accounts.find((item) => item.username === username);
  if (account && !account.hash) {
    const confirmField = document.querySelector("#login-confirm-field");
    if (confirmField.classList.contains("hidden")) {
      confirmField.classList.remove("hidden");
      document.querySelector("#login-password-label").textContent = "Crie sua senha";
      message.textContent = "Primeiro acesso: crie uma senha com pelo menos 8 caracteres e repita no campo abaixo.";
      message.className = "form-message"; message.hidden = false;
      return document.querySelector("#login-confirm").focus();
    }
    if (password.length < 8) return fail("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== data.get("confirm")) return fail("As senhas não conferem.");
    account.hash = await hashPassword(username, password);
    saveState();
  } else {
    const hash = await hashPassword(username, password);
    if (!account || account.hash !== hash) { registerFailure(); const left = lockedFor(); return fail(left > 0 ? `Muitas tentativas. Tente de novo em ${left}s.` : "Usuário ou senha incorretos."); }
  }
  clearFailures();
  ui.role = account.role; ui.account = account; ui.view = "dashboard"; ui.newAccess = null;
  if (account.role === "professional") ui.professionalId = account.professionalId;
  render();
}

function navItems() {
  if (ui.role === "admin") return [
    ["dashboard", "◫", "Visão geral"],
    ["professionals", "♧", "Profissionais"],
    ["anamnese", "▤", "Nova anamnese"],
    ["assignments", "◎", "Encaminhamentos"],
    ["reports", "▧", "Relatórios"],
  ];
  return [
    ["dashboard", "◫", "Meu painel"],
    ["my-cases", "◎", "Meus atendimentos"],
    ["agenda", "▦", "Minha agenda"],
    ["reports", "▧", "Relatório integrado"],
  ];
}

function shellTemplate(content) {
  const isAdmin = ui.role === "admin";
  const currentProfessional = getProfessional(ui.professionalId);
  const userName = isAdmin ? state.clinic.director : (currentProfessional?.name || "Profissional");
  const userSub = isAdmin ? `Administradora · ${state.clinic.directorCode}` : (currentProfessional?.specialty || "Profissional");
  const activeNav = ui.view === "case-detail" ? "my-cases" : ui.view;
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><img class="brand-logo" src="assets/logo-horizontal-branco.png" alt="Mente e Transformação · Clínica"></div>
        <p class="nav-label">${isAdmin ? "Gestão da clínica" : "Área profissional"}</p>
        <nav class="sidebar-nav" aria-label="Navegação principal">
          ${navItems().map(([view, icon, label]) => `<button class="nav-item ${activeNav === view ? "active" : ""}" type="button" data-nav="${view}"><span class="nav-icon">${icon}</span>${label}</button>`).join("")}
        </nav>
        <div class="sidebar-bottom"><strong>Ambiente de demonstração</strong><span>Dados armazenados neste navegador.</span></div>
      </aside>
      <section class="workspace">
        <header class="topbar">
          <div class="breadcrumb">Painel Clínico <span> / </span> <b>${pageLabel()}</b></div>
          <div class="top-actions">
            <button class="notice-button" type="button" data-open-notices aria-label="Notificações">♢<span class="notice-count">${notificationCount()}</span></button>
            <div class="user-chip"><span class="avatar">${initials(userName)}</span><span><strong>${escapeHTML(userName)}</strong><small>${escapeHTML(userSub)}</small></span></div>
            <button class="button secondary small" type="button" data-logout>Sair</button>
          </div>
        </header>
        <main class="page">${content}</main>
      </section>
    </div>`;
}

function pageLabel() {
  const labels = { dashboard: "Visão geral", professionals: "Profissionais", anamnese: "Nova anamnese", assignments: "Encaminhamentos", "my-cases": "Meus atendimentos", agenda: "Minha agenda", "case-detail": "Acompanhamento do caso", reports: "Relatório integrado" };
  return labels[ui.view] || "Painel";
}

function notificationCount() {
  if (ui.role === "admin") return state.patients.filter((patient) => patient.status === "Aguardando encaminhamento").length + 2;
  return state.patients.filter((patient) => patient.assignedIds.includes(ui.professionalId)).length;
}

function statusClass(status) {
  const values = { "Em acompanhamento": "in-progress", "Aguardando encaminhamento": "waiting", "Relatório pronto": "ready", "Concluído": "done", "Agendada": "waiting", "Realizada": "in-progress" };
  return values[status] || "waiting";
}

function statusTag(status) { return `<span class="status ${statusClass(status)}">${escapeHTML(status)}</span>`; }

function sectionHeading(title, text, action = "") {
  return `<div class="page-heading"><div><h1>${title}</h1>${text ? `<p>${text}</p>` : ""}</div>${action}</div>`;
}

function adminDashboard() {
  const underway = state.patients.filter((patient) => patient.status === "Em acompanhamento").length;
  const reportReady = state.patients.filter((patient) => Object.values(patientReports(patient.id)).some((report) => report.result)).length;
  return `
    ${sectionHeading(`Olá, ${escapeHTML(state.clinic.director.split(" ").slice(0, 2).join(" "))}`, "Acompanhe os encaminhamentos e a evolução clínica em um só lugar.", `<button class="button" type="button" data-nav="anamnese">+ Iniciar anamnese</button>`)}
    <section class="stats-grid" aria-label="Resumo da clínica">
      <article class="stat-card"><span class="stat-icon">♧</span><div class="stat-label">Profissionais ativos</div><div class="stat-value">${state.professionals.length}</div><div class="stat-foot">Equipe multidisciplinar</div></article>
      <article class="stat-card"><span class="stat-icon">◎</span><div class="stat-label">Casos em acompanhamento</div><div class="stat-value">${underway}</div><div class="stat-foot">Em evolução clínica</div></article>
      <article class="stat-card"><span class="stat-icon">◷</span><div class="stat-label">Aguardando ação</div><div class="stat-value">${state.patients.filter((patient) => patient.status === "Aguardando encaminhamento").length}</div><div class="stat-foot">Encaminhamentos pendentes</div></article>
      <article class="stat-card"><span class="stat-icon">▧</span><div class="stat-label">Relatórios em construção</div><div class="stat-value">${reportReady}</div><div class="stat-foot">Com evolução registrada</div></article>
    </section>
    <section class="dashboard-grid">
      <article class="panel"><div class="panel-header"><h2>Casos recentes</h2><button class="text-action" type="button" data-nav="assignments">Ver todos</button></div><div class="case-list">${state.patients.slice(0, 5).map(caseRow).join("") || emptyInline("Nenhuma anamnese cadastrada.")}</div></article>
      <article class="panel"><div class="panel-header"><h2>Atividade recente</h2></div><div class="timeline">
        <div class="timeline-item"><span class="timeline-dot"></span><div class="timeline-copy"><strong>Anamnese de Miguel atualizada</strong><span>Hoje · Cadastro validado e encaminhado</span></div></div>
        <div class="timeline-item"><span class="timeline-dot"></span><div class="timeline-copy"><strong>Nova sessão registrada</strong><span>Ontem · Psicologia</span></div></div>
        <div class="timeline-item"><span class="timeline-dot"></span><div class="timeline-copy"><strong>Relatório integrado disponível</strong><span>25 out · Caso Luíza Nascimento</span></div></div>
      </div></article>
    </section>`;
}

function agendaView() {
  const professional = getProfessional(ui.professionalId);
  if (!professional) return emptyState("Profissional não encontrado", "Entre novamente para ver a sua agenda.");
  const { month, date } = ui.agenda;
  const calendar = monthCalendar("agenda", month, (key, day) => {
    const blocks = state.unavailability.filter((item) => item.professionalId === professional.id && item.date === key);
    const sessions = professionalSessions(professional.id).filter(({ session }) => session.date === key && session.status === "Agendada");
    const allDay = blocks.some((item) => item.allDay), partial = blocks.length > 0 && !allDay;
    const tag = allDay ? "Indisponível" : partial ? "Parcial" : sessions.length ? `${sessions.length} atend.` : "";
    return `<button type="button" class="cal-day ${key === todayKey() ? "is-today" : ""} ${key === date ? "is-selected" : ""} ${key < todayKey() ? "is-past" : ""} ${allDay ? "has-off" : ""} ${partial ? "has-partial" : ""} ${sessions.length ? "has-session" : ""}" data-cal-day="agenda|${key}"><b>${day}</b>${tag ? `<span class="cal-tag">${tag}</span>` : ""}</button>`;
  });
  return `
    ${sectionHeading("Minha agenda", "Marque os dias e horários em que você NÃO poderá atender. A administração só agenda atendimentos nos horários livres.")}
    <div class="split-layout">
      <article class="panel content-panel">${calendar}<div class="calendar-legend"><span><i class="dot off"></i>Indisponível o dia todo</span><span><i class="dot partial"></i>Indisponível em parte do dia</span><span><i class="dot session"></i>Atendimento agendado</span></div></article>
      <aside class="panel form-card">${agendaDayPanel(professional, date)}</aside>
    </div>`;
}

function agendaDayPanel(professional, date) {
  if (!date) return `<h2>Selecione um dia</h2><p>Clique em um dia do calendário para marcar sua indisponibilidade ou ver os atendimentos.</p>`;
  const blocks = state.unavailability.filter((item) => item.professionalId === professional.id && item.date === date).sort((a, b) => (a.allDay ? "" : a.start).localeCompare(b.allDay ? "" : b.start));
  const sessions = professionalSessions(professional.id).filter(({ session }) => session.date === date).sort((x, y) => (x.session.time || "").localeCompare(y.session.time || ""));
  const past = date < todayKey();
  return `<h2>${escapeHTML(longDate(date))}</h2>
    <div class="day-list">
      ${blocks.map((item) => `<div class="day-item off"><div><strong>${item.allDay ? "Indisponível o dia todo" : `Indisponível ${escapeHTML(item.start)}–${escapeHTML(item.end)}`}</strong>${item.note ? `<span>${escapeHTML(item.note)}</span>` : ""}</div>${past ? "" : `<button class="button danger small" type="button" data-remove-unavailability="${item.id}">Remover</button>`}</div>`).join("")}
      ${sessions.map(({ patient, session }) => `<div class="day-item session"><div><strong>${session.time ? escapeHTML(session.time) : "Horário a definir"} · ${escapeHTML(patient.name)}</strong><span>${escapeHTML(session.objective)} · ${escapeHTML(session.status)}</span></div></div>`).join("")}
      ${blocks.length || sessions.length ? "" : `<div class="empty-inline">Nada marcado neste dia.</div>`}
    </div>
    ${past ? `<p class="cell-muted">Este dia já passou, então não é possível marcar indisponibilidade.</p>` : `<form id="unavailability-form" class="unavailability-form"><h3>Marcar indisponibilidade</h3>
      <div class="choice-row"><label><input type="radio" name="mode" value="day" checked /> Dia todo</label><label><input type="radio" name="mode" value="time" /> Somente um horário</label></div>
      <div class="form-grid conditional hidden" id="time-fields"><div class="field"><label for="una-start">Das</label><input id="una-start" name="start" type="time" value="08:00" /></div><div class="field"><label for="una-end">Até</label><input id="una-end" name="end" type="time" value="12:00" /></div></div>
      <div class="form-grid"><div class="field full"><label for="una-note">Motivo (opcional)</label><input id="una-note" name="note" placeholder="Ex.: curso, consulta, folga" /></div><div class="field"><label for="una-weeks">Repetir toda semana por</label><select id="una-weeks" name="weeks">${[1, 2, 4, 8, 12, 26].map((n) => `<option value="${n}">${n === 1 ? "Só neste dia" : `${n} semanas`}</option>`).join("")}</select></div></div>
      <div class="form-actions"><button class="button" type="submit">Marcar indisponível</button></div></form>`}`;
}

function professionalDashboard() {
  const professional = getProfessional(ui.professionalId) || state.professionals[0];
  const cases = state.patients.filter((patient) => patient.assignedIds.includes(professional?.id));
  const complete = cases.filter((patient) => patientReports(patient.id)[professional?.id]?.result).length;
  return `
    ${sectionHeading(`Olá, ${escapeHTML(professional?.name?.split(" ").slice(0, 2).join(" ") || "profissional")}`, "Aqui estão os pacientes que aguardam seu acompanhamento.")}
    <section class="stats-grid">
      <article class="stat-card"><span class="stat-icon">◎</span><div class="stat-label">Casos atribuídos</div><div class="stat-value">${cases.length}</div><div class="stat-foot">Notificações recebidas</div></article>
      <article class="stat-card"><span class="stat-icon">◷</span><div class="stat-label">Sessões agendadas</div><div class="stat-value">${cases.reduce((total, patient) => total + patientSessions(patient.id, professional?.id).filter((session) => session.status === "Agendada").length, 0)}</div><div class="stat-foot">Próximos atendimentos</div></article>
      <article class="stat-card"><span class="stat-icon">✓</span><div class="stat-label">Evoluções registradas</div><div class="stat-value">${complete}</div><div class="stat-foot">Com resultado parcial</div></article>
      <article class="stat-card"><span class="stat-icon">▧</span><div class="stat-label">Perfil profissional</div><div class="stat-value">1</div><div class="stat-foot">${escapeHTML(professional?.specialty || "")}</div></article>
    </section>
    <section class="panel"><div class="panel-header"><h2>Notificações de encaminhamento</h2><button class="text-action" type="button" data-nav="my-cases">Ver atendimentos</button></div><div class="case-list">${cases.map((patient) => professionalCaseRow(patient, professional)).join("") || emptyInline("Nenhum caso foi encaminhado para este profissional.")}</div></section>`;
}

function caseRow(patient) {
  return `<div class="case-row"><span class="case-avatar">${initials(patient.name)}</span><div class="case-identity"><strong>${escapeHTML(patient.name)}</strong><span>${ageFromDate(patient.birthDate)} · ${getAssigned(patient).map((item) => item.specialty).join(", ") || "Sem profissionais"}</span></div>${statusTag(patient.status)}<button class="text-action case-arrow" data-open-assignment="${patient.id}" type="button" aria-label="Abrir caso de ${escapeHTML(patient.name)}">›</button></div>`;
}

function professionalCaseRow(patient, professional) {
  const report = patientReports(patient.id)[professional.id];
  const notice = report?.updatedAt ? "Evolução em andamento" : "Novo encaminhamento";
  return `<div class="case-row"><span class="case-avatar">${initials(patient.name)}</span><div class="case-identity"><strong>${escapeHTML(patient.name)}</strong><span>${notice} · ${ageFromDate(patient.birthDate)}</span></div>${statusTag(report?.result ? "Relatório pronto" : "Em acompanhamento")}<button class="text-action case-arrow" data-open-case="${patient.id}" type="button" aria-label="Abrir atendimento de ${escapeHTML(patient.name)}">›</button></div>`;
}

function professionalsView() {
  return `
    ${sectionHeading("Profissionais", "Cadastre e mantenha atualizada a equipe multidisciplinar. Clique em um profissional para ver e editar os dados e o acesso.", `<button class="button" type="button" data-scroll-add>+ Cadastrar profissional</button>`)}
    ${accessCard()}
    <div class="split-layout">
      <article class="panel content-panel"><div class="panel-header" style="padding:0 0 17px"><h2>Equipe cadastrada</h2><span class="cell-muted">${state.professionals.length} profissionais</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Profissional</th><th>Especialidade</th><th>Código/registro</th><th></th></tr></thead><tbody>${state.professionals.map((professional) => `<tr class="is-clickable ${professional.id === ui.editProfessionalId ? "is-selected" : ""}" tabindex="0" data-edit-professional="${professional.id}" aria-label="Ver e editar ${escapeHTML(professional.name)}"><td><div class="person-cell"><span class="mini-avatar">${initials(professional.name)}</span><div><strong>${escapeHTML(professional.name)}</strong>${professional.focus ? `<small class="cell-muted">${escapeHTML(professional.focus)}</small>` : ""}<small class="access-line">${accountOf(professional.id) ? `Usuário: ${escapeHTML(accountOf(professional.id).username)}` : "Sem acesso"}</small></div></div></td><td>${escapeHTML(professional.specialty)}</td><td class="cell-muted">${escapeHTML(professional.code || "Registro a informar")}</td><td><div class="table-actions"><button class="button danger small" type="button" data-delete-professional="${professional.id}">Remover</button></div></td></tr>`).join("") || `<tr><td colspan="4">${emptyInline("Nenhum profissional cadastrado.")}</td></tr>`}</tbody></table></div></article>
      <aside class="panel form-card" id="add-professional">${professionalFormCard()}</aside>
    </div>`;
}

function professionalFormCard() {
  const professional = getProfessional(ui.editProfessionalId);
  if (!professional) return `<h2>Novo profissional</h2><p>Ao salvar, o sistema gera automaticamente um usuário e uma senha para o profissional acessar a própria conta.</p><form id="professional-form"><div class="form-grid"><div class="field full"><label for="professional-name">Nome completo</label><input id="professional-name" name="name" required placeholder="Nome do profissional" /></div><div class="field"><label for="professional-specialty">Especialidade</label><select id="professional-specialty" name="specialty" required><option value="" selected disabled>Selecione</option>${SPECIALTIES.map((item) => `<option>${item}</option>`).join("")}</select></div><div class="field"><label for="professional-code">Código ou registro</label><input id="professional-code" name="code" required placeholder="Ex.: CRP 00/00000" /></div></div><div class="form-actions"><button class="button" type="submit">Salvar profissional</button></div></form>`;
  const account = accountOf(professional.id);
  const passwordHint = account ? (account.password ? "" : "Senha anterior não pode ser consultada. Defina uma nova para alterá-la.") : "Preencha usuário e senha para liberar o acesso deste profissional.";
  return `<h2>${escapeHTML(professional.name)}</h2><p>Dados e acesso do profissional. Somente a administração vê esta área.</p>
    <form id="professional-edit-form"><div class="form-grid">
      <div class="field full"><label for="edit-name">Nome completo</label><input id="edit-name" name="name" required value="${escapeHTML(professional.name)}" /></div>
      <div class="field"><label for="edit-specialty">Especialidade</label><select id="edit-specialty" name="specialty" required>${SPECIALTIES.map((item) => `<option ${item === professional.specialty ? "selected" : ""}>${item}</option>`).join("")}</select></div>
      <div class="field"><label for="edit-code">Código ou registro</label><input id="edit-code" name="code" value="${escapeHTML(professional.code || "")}" placeholder="Ex.: CRP 00/00000" /></div>
      <div class="field full"><label for="edit-focus">Áreas de atuação</label><textarea id="edit-focus" name="focus" rows="3" placeholder="Resumo da atuação do profissional">${escapeHTML(professional.focus || "")}</textarea></div>
    </div>
    <div class="form-section access-edit"><h3>Acesso ao sistema</h3><div class="form-grid">
      <div class="field full"><label for="edit-username">Usuário</label><input id="edit-username" name="username" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escapeHTML(account?.username || "")}" placeholder="nome.sobrenome" /></div>
      <div class="field full"><label for="edit-password">Senha</label><input id="edit-password" name="password" type="password" autocomplete="off" value="${escapeHTML(account?.password || "")}" placeholder="${account ? "Defina uma nova senha" : "Senha de acesso"}" />${passwordHint ? `<small class="cell-muted">${passwordHint}</small>` : ""}</div>
    </div>
    <div class="access-tools"><button class="button secondary small" type="button" data-toggle-password>Mostrar senha</button><button class="button secondary small" type="button" data-generate-password>Gerar nova senha</button><button class="button secondary small" type="button" data-copy-credentials>Copiar acesso</button></div></div>
    <div class="form-actions"><button class="button secondary" type="button" data-cancel-edit>Cancelar</button><button class="button" type="submit">Salvar alterações</button></div></form>`;
}

function guardianFields(guardian = {}) {
  return `<div class="guardian-row"><div class="field"><label>Categoria</label><select name="guardian-relation"><option value="" ${!guardian.relation ? "selected" : ""} disabled>Ex.: Mãe</option>${["Mãe", "Pai", "Avó", "Avô", "Tio", "Tia", "Responsável legal", "Outro"].map((item) => `<option ${guardian.relation === item ? "selected" : ""}>${item}</option>`).join("")}</select></div><div class="field"><label>Nome completo</label><input name="guardian-name" value="${escapeHTML(guardian.name || "")}" placeholder="Nome" /></div><div class="field"><label>CPF</label><input name="guardian-cpf" value="${escapeHTML(guardian.cpf || "")}" placeholder="000.000.000-00" /></div><div class="field"><label>Telefone</label><input name="guardian-phone" value="${escapeHTML(guardian.phone || "")}" placeholder="(00) 00000-0000" /></div><div class="field"><label>E-mail</label><input name="guardian-email" type="email" value="${escapeHTML(guardian.email || "")}" placeholder="email@exemplo.com" /></div><button class="icon-button remove-guardian" type="button" title="Remover responsável" aria-label="Remover responsável">×</button></div>`;
}

function anamneseView() {
  return `
    ${sectionHeading("Nova ficha de anamnese", "Colete as informações iniciais do paciente e da família para começar a investigação.")}
    <div class="split-layout">
      <form class="panel form-card" id="anamnese-form">
        <h2>Dados de entrada</h2>
        <section class="form-section"><div class="form-section-title"><div><h3>Responsáveis para contato</h3></div><button class="button secondary small" id="add-guardian" type="button">+ Adicionar</button></div><div id="guardians-container">${guardianFields()}</div></section>
        <section class="form-section"><div class="form-section-title"><div><h3>Cadastro do paciente</h3></div></div><div class="form-grid three"><div class="field full"><label for="patient-name">Nome completo</label><input id="patient-name" name="patientName" required placeholder="Nome do paciente" /></div><div class="field"><label for="patient-gender">Sexo</label><select id="patient-gender" name="gender" required><option value="" selected disabled>Selecione</option><option>Feminino</option><option>Masculino</option><option>Outro</option><option>Prefere não informar</option></select></div><div class="field"><label for="patient-birth">Data de nascimento</label><input id="patient-birth" type="date" name="birthDate" required /></div><div class="field"><label for="patient-cpf">CPF</label><input id="patient-cpf" name="patientCpf" placeholder="000.000.000-00" /></div></div></section>
        <section class="form-section"><div class="form-section-title"><div><h3>Hipótese diagnóstica</h3></div></div><div class="radio-line"><label class="radio-pill"><input type="radio" name="hypothesis" value="yes" /> Sim</label><label class="radio-pill"><input type="radio" name="hypothesis" value="no" checked /> Não</label></div><div class="conditional hidden" id="hypothesis-details"><div class="field"><label for="hypothesis-text">Relato da família ou do responsável</label><textarea id="hypothesis-text" name="hypothesisText" placeholder="Descreva a hipótese apresentada durante a entrevista."></textarea></div></div></section>
        <section class="form-section"><div class="form-section-title"><div><h3>Diagnóstico ou documento anterior</h3></div></div><div class="radio-line"><label class="radio-pill"><input type="radio" name="diagnosis" value="yes" /> Sim</label><label class="radio-pill"><input type="radio" name="diagnosis" value="no" checked /> Não</label></div><div class="conditional hidden" id="diagnosis-details"><div class="upload-box"><label class="upload-label" for="diagnosis-file">Anexar arquivo</label><input id="diagnosis-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" /><span class="file-name" id="file-name">Nenhum arquivo selecionado</span></div></div></section>
        <section class="form-section"><div class="form-section-title"><div><h3>Anamnese</h3></div></div><div class="field"><textarea name="familyComplaint" placeholder="Descreva o motivo da busca, contexto e principais dificuldades relatadas."></textarea></div></section>
        <div class="form-actions"><button class="button secondary" type="reset">Limpar</button><button class="button" type="submit">Salvar e selecionar profissionais →</button></div>
      </form>
      ${processAside(1)}
    </div>`;
}

function processAside(current) {
  const steps = ["Ficha de anamnese", "Selecionar profissionais", "Acompanhamento clínico", "Relatório integrado"];
  return `<aside class="panel side-note"><h2>Jornada do caso</h2><p>O caso segue para os profissionais somente após a ficha inicial ser salva.</p><div class="step-list">${steps.map((step, index) => `<div class="step ${index + 1 === current ? "active" : ""}"><span class="step-number">${index + 1}</span>${step}</div>`).join("")}</div><hr /><small>As informações desta ficha serão exibidas aos profissionais encaminhados, junto com os documentos anexados.</small></aside>`;
}

function assignmentsView() {
  const patient = getPatient();
  const assignedIds = new Set(ui.draftAssigned || patient?.assignedIds || []);
  const selectedProfessionals = [...assignedIds].map(getProfessional).filter(Boolean);
  const listed = ui.filterSpecialty === "Todas" ? state.professionals : state.professionals.filter((professional) => professional.specialty === ui.filterSpecialty);
  return `
    ${sectionHeading("Encaminhar profissionais", "Selecione a equipe que acompanhará este caso individualmente.")}
    <div class="split-layout">
      <article class="panel form-card">
        ${patient ? `<div class="assignment-patient"><span class="case-avatar">${initials(patient.name)}</span><div><h3>${escapeHTML(patient.name)}</h3><span>${ageFromDate(patient.birthDate)} · Anamnese criada em ${dateLabel(patient.createdAt)}</span></div>${statusTag(patient.status)}</div>` : `<div class="empty-state"><div class="empty-icon">◎</div><h2>Nenhuma ficha selecionada</h2><p>Crie uma anamnese antes de fazer um encaminhamento.</p><button class="button" type="button" data-nav="anamnese">Iniciar anamnese</button></div>`}
        ${patient ? `<section class="form-section"><div class="form-section-title"><div><h3>Equipe multidisciplinar</h3><p>Clique nos profissionais que participarão da investigação e do plano de cuidado.</p></div></div><div class="specialty-filter">${["Todas", ...SPECIALTIES.filter((specialty) => state.professionals.some((item) => item.specialty === specialty))].map((specialty) => `<button type="button" class="filter-chip ${ui.filterSpecialty === specialty ? "active" : ""}" data-filter-specialty="${escapeHTML(specialty)}">${escapeHTML(specialty)}</button>`).join("")}</div><div class="professional-options">${listed.map((professional) => `<label class="professional-option ${assignedIds.has(professional.id) ? "selected" : ""}"><input type="checkbox" name="assigned-professional" value="${professional.id}" ${assignedIds.has(professional.id) ? "checked" : ""}/><span class="mini-avatar">${initials(professional.name)}</span><span><strong>${escapeHTML(professional.name)}</strong><span>${escapeHTML(professional.specialty)} · ${escapeHTML(professional.code)}</span></span><span class="choice-check">${assignedIds.has(professional.id) ? "✓" : ""}</span></label>`).join("") || emptyInline("Não há profissionais nesta especialidade.")}</div></section>${scheduleSection(patient, selectedProfessionals)}<div class="form-actions"><button class="button secondary" type="button" data-nav="anamnese">← Voltar</button><button class="button" id="save-assignment" type="button">Salvar encaminhamento</button></div>` : ""}
      </article>
      <aside class="panel assignment-summary"><h2>Profissionais selecionados</h2><p>Os selecionados receberão uma notificação em seu painel.</p><div class="selection-list" id="selection-list">${assignedSummary(selectedProfessionals)}</div>${patient ? bookedSummary(patient) : ""}<button class="button secondary wide-action" type="button" data-nav="reports">Visualizar relatório integrado</button></aside>
    </div>`;
}

function assignedSummary(professionals) {
  return professionals.length ? professionals.map((professional) => `<span><strong>${escapeHTML(professional.specialty)}</strong><br>${escapeHTML(professional.name)}</span>`).join("") : `<div class="empty-selection">Selecione pelo menos um profissional.</div>`;
}

function bookedSummary(patient) {
  const items = state.professionals.flatMap((professional) => patientSessions(patient.id, professional.id).filter((session) => session.status === "Agendada").map((session) => ({ professional, session }))).sort((x, y) => `${x.session.date} ${x.session.time || ""}`.localeCompare(`${y.session.date} ${y.session.time || ""}`));
  const drafts = ui.draftSessions.map((draft) => ({ professional: getProfessional(draft.professionalId), session: draft, draft: true })).filter((item) => item.professional);
  const rows = [...items, ...drafts].map(({ professional, session, draft }) => `<span><strong>${escapeHTML(dateLabel(session.date))}${session.time ? ` · ${escapeHTML(session.time)}` : ""}</strong>${draft ? ' <em class="draft-flag">a salvar</em>' : ""}<br>${escapeHTML(professional.name)}</span>`).join("");
  return `<h3 class="booked-title">Atendimentos agendados</h3><div class="selection-list">${rows || `<div class="empty-selection">Nenhum atendimento agendado ainda.</div>`}</div>`;
}

function scheduleSection(patient, professionals) {
  return `<section class="form-section"><div class="form-section-title"><div><h3>Agendar atendimentos</h3><p>Escolha o dia e o horário de cada profissional. Dias e horários marcados como indisponíveis pelo profissional ficam bloqueados.</p></div></div>${professionals.map((professional) => schedulerCard(professional, patient)).join("") || emptyInline("Selecione os profissionais acima para agendar os atendimentos.")}</section>`;
}

function schedulerCard(professional, patient) {
  const { month, date } = calState(professional.id);
  const drafts = ui.draftSessions.filter((draft) => draft.professionalId === professional.id);
  const calendar = monthCalendar(professional.id, month, (key, day) => {
    const past = key < todayKey(), free = freeSlots(professional.id, key).length, picked = drafts.some((draft) => draft.date === key);
    const blocked = !past && !free;
    return `<button type="button" class="cal-day ${key === todayKey() ? "is-today" : ""} ${key === date ? "is-selected" : ""} ${past ? "is-past" : ""} ${blocked ? "is-blocked" : ""} ${picked ? "has-session" : ""}" data-cal-day="${professional.id}|${key}" ${past || blocked ? "disabled" : ""} ${blocked ? 'title="Sem horários livres: profissional indisponível ou com agenda cheia"' : ""}><b>${day}</b>${picked ? '<span class="cal-tag">✓</span>' : ""}</button>`;
  }, true);
  const slots = date ? `<div class="slot-picker"><strong>${escapeHTML(longDate(date))}</strong><div class="slot-grid">${SLOTS.map((time) => { const kind = slotKind(professional.id, date, time); return kind === "free" ? `<button type="button" class="slot" data-sched-slot="${professional.id}|${date}|${time}">${time}</button>` : `<span class="slot is-busy" title="${kind === "off" ? "Profissional indisponível" : "Horário já ocupado"}">${time}<small>${kind === "off" ? "indisponível" : "ocupado"}</small></span>`; }).join("")}</div></div>` : `<p class="cell-muted">Clique em um dia disponível para ver os horários.</p>`;
  const chips = drafts.map((draft) => `<span class="draft-chip">${escapeHTML(dateLabel(draft.date))} · ${escapeHTML(draft.time)}<button type="button" data-remove-draft="${draft.id}" aria-label="Remover atendimento de ${escapeHTML(dateLabel(draft.date))}">×</button></span>`).join("");
  return `<div class="scheduler-card"><div class="scheduler-head"><span class="mini-avatar">${initials(professional.name)}</span><div><strong>${escapeHTML(professional.name)}</strong><span class="cell-muted">${escapeHTML(professional.specialty)}</span></div></div><div class="scheduler-body">${calendar}<div>${slots}</div></div>${chips ? `<div class="draft-list">${chips}</div>` : ""}</div>`;
}

function myCasesView() {
  const professional = getProfessional(ui.professionalId) || state.professionals[0];
  const cases = state.patients.filter((patient) => patient.assignedIds.includes(professional?.id));
  return `
    ${sectionHeading("Meus atendimentos", "Casos em que você foi selecionado pela administração.")}
    <section class="case-grid">${cases.map((patient) => { const report = patientReports(patient.id)[professional.id]; const sessions = patientSessions(patient.id, professional.id); return `<article class="case-card"><div class="case-card-head"><span class="case-avatar">${initials(patient.name)}</span>${statusTag(report?.result ? "Relatório pronto" : "Em acompanhamento")}</div><h2>${escapeHTML(patient.name)}</h2><span class="case-meta">${ageFromDate(patient.birthDate)} · ${escapeHTML(patient.gender)}</span><div class="case-card-footer"><span>${sessions.length} atendimento${sessions.length === 1 ? "" : "s"} registrado${sessions.length === 1 ? "" : "s"}</span><button class="button small" type="button" data-open-case="${patient.id}">Abrir caso</button></div></article>`; }).join("") || `<article class="panel">${emptyState("Nenhum caso atribuído", "Quando a administração selecionar este profissional, os novos pacientes aparecerão aqui.")}</article>`}</section>`;
}

function caseDetailView() {
  const patient = getPatient();
  const professional = getProfessional(ui.professionalId);
  if (!patient || !professional || !patient.assignedIds.includes(professional.id)) { ui.view = "my-cases"; return myCasesView(); }
  const report = patientReports(patient.id)[professional.id] || { complaint: "", plan: "", result: "" };
  const sessions = patientSessions(patient.id, professional.id);
  return `
    <button class="text-action" type="button" data-nav="my-cases" style="margin-bottom:12px">← Voltar aos atendimentos</button>
    <section class="case-header"><span class="case-avatar">${initials(patient.name)}</span><div><h2>${escapeHTML(patient.name)}</h2><p>${ageFromDate(patient.birthDate)} · ${escapeHTML(patient.gender)} · ${escapeHTML(professional.specialty)}</p></div><div class="case-header-actions">${statusTag(patient.status)}</div></section>
    <div class="tabs"><button class="tab ${ui.caseTab === "registro" ? "active" : ""}" type="button" data-case-tab="registro">Registro profissional</button><button class="tab ${ui.caseTab === "anamnese" ? "active" : ""}" type="button" data-case-tab="anamnese">Ficha de anamnese</button><button class="tab ${ui.caseTab === "agenda" ? "active" : ""}" type="button" data-case-tab="agenda">Agenda e sessões</button></div>
    ${ui.caseTab === "registro" ? professionalRecordForm(patient, professional, report) : ui.caseTab === "anamnese" ? anamneseReadOnly(patient) : scheduleView(patient, professional, sessions)}`;
}

function professionalRecordForm(patient, professional, report) {
  return `<div class="split-layout"><form id="professional-record-form" class="panel form-card"><h2>Seu registro clínico</h2><p>Preencha aos poucos. Você pode revisar e atualizar as informações ao longo dos atendimentos.</p><section class="form-section"><div class="form-section-title"><div><h3>Queixa principal</h3><p>Seu olhar profissional sobre a demanda apresentada.</p></div></div><div class="field"><textarea name="complaint" placeholder="Descreva a queixa principal observada em sua área de atuação.">${escapeHTML(report.complaint)}</textarea></div></section><section class="form-section"><div class="form-section-title"><div><h3>Plano de ação</h3><p>Estratégias, avaliação e ações planejadas.</p></div></div><div class="field"><textarea name="plan" placeholder="Descreva os objetivos e as ações propostas.">${escapeHTML(report.plan)}</textarea></div></section><section class="form-section"><div class="form-section-title"><div><h3>Resultado e evolução</h3><p>Registre avanços, observações e resultados parciais.</p></div></div><div class="field"><textarea name="result" placeholder="Descreva a evolução observada durante o acompanhamento.">${escapeHTML(report.result)}</textarea></div></section><div class="form-actions"><span class="cell-muted">${report.updatedAt ? `Atualizado em ${dateLabel(report.updatedAt)}` : "Ainda não salvo"}</span><button class="button" type="submit">Salvar evolução</button></div></form><aside class="panel side-note"><h2>Contexto do caso</h2><p>Informações compartilhadas pela administração na anamnese.</p><div class="step-list"><div class="step active"><span class="step-number">✓</span>Queixa familiar registrada</div><div class="step"><span class="step-number">${patient.diagnosis.has ? "✓" : "—"}</span>${patient.diagnosis.has ? `Documento: ${escapeHTML(patient.diagnosis.fileName || "anexado")}` : "Sem documento diagnóstico"}</div><div class="step"><span class="step-number">${patient.hypothesis.has ? "✓" : "—"}</span>${patient.hypothesis.has ? "Hipótese registrada" : "Sem hipótese relatada"}</div></div><hr /><small><strong>Queixa da família:</strong><br>${escapeHTML(patient.familyComplaint)}</small></aside></div>`;
}

function anamneseReadOnly(patient) {
  return `<section class="panel content-panel"><div class="panel-header" style="padding:0 0 15px"><h2>Ficha de anamnese</h2><span class="cell-muted">Preenchida pela administração</span></div><div class="report-section" style="margin-top:0"><table class="patient-table"><tbody><tr><td>Paciente</td><td>${escapeHTML(patient.name)}</td><td>Data de nascimento</td><td>${dateLabel(patient.birthDate)} (${ageFromDate(patient.birthDate)})</td></tr><tr><td>Responsáveis</td><td colspan="3">${patient.guardians.map((guardian) => `${escapeHTML(guardian.relation || "Responsável")}: ${escapeHTML(guardian.name)} · ${escapeHTML(guardian.phone)}`).join("<br>")}</td></tr><tr><td>Hipótese</td><td colspan="3">${patient.hypothesis.has ? escapeHTML(patient.hypothesis.narrative) : "Não relatada"}</td></tr><tr><td>Diagnóstico</td><td colspan="3">${patient.diagnosis.has ? `Documento anexado: ${escapeHTML(patient.diagnosis.fileName || "arquivo")}` : "Não informado"}</td></tr><tr><td>Queixa familiar</td><td colspan="3">${escapeHTML(patient.familyComplaint)}</td></tr></tbody></table></div></section>`;
}

function scheduleView(patient, professional, sessions) {
  return `<div class="split-layout"><article class="panel form-card"><h2>Agenda de atendimentos</h2><p>Registre as sessões previstas e acompanhe o que já foi realizado.</p><div class="session-list">${sessions.map((session) => `<div class="session-item"><span class="session-calendar"><b>${new Date(`${session.date}T12:00:00`).getDate().toString().padStart(2, "0")}</b>${new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${session.date}T12:00:00`)).replace(".", "")}</span><div><strong>${escapeHTML(session.objective)}</strong><span>${dateLabel(session.date)}${session.time ? ` · ${escapeHTML(session.time)}` : ""}</span></div><span class="session-status">${statusTag(session.status)}</span></div>`).join("") || emptyInline("Nenhuma sessão registrada ainda.")}</div></article><form class="panel form-card" id="session-form"><h2>Adicionar sessão</h2><p>Crie um lembrete para o próximo atendimento.</p><div class="form-grid"><div class="field"><label for="session-date">Data</label><input id="session-date" name="date" type="date" required /></div><div class="field"><label for="session-time">Horário</label><select id="session-time" name="time">${SLOTS.map((time) => `<option>${time}</option>`).join("")}</select></div><div class="field"><label for="session-status">Status</label><select id="session-status" name="status"><option>Agendada</option><option>Realizada</option></select></div><div class="field full"><label for="session-objective">Objetivo ou observação</label><input id="session-objective" name="objective" required placeholder="Ex.: Entrevista inicial com responsáveis" /></div></div><div class="form-actions"><button class="button" type="submit">Adicionar à agenda</button></div></form></div>`;
}

function reportsView() {
  const patient = getPatient() || state.patients[0];
  if (!patient) return `${sectionHeading("Relatório integrado", "Documento clínico consolidado.")}${emptyState("Nenhum caso disponível", "Cadastre uma anamnese e encaminhe profissionais para gerar o primeiro relatório.", "Iniciar anamnese", "anamnese")}`;
  return `
    ${sectionHeading("Relatório integrado", "Visualização consolidada dos registros preenchidos pela equipe.", `<button class="button" type="button" data-print-report>Imprimir relatório</button>`)}
    <div class="report-layout">
      <aside class="panel report-controls"><div><h2>Selecionar caso</h2><p>Alterne o paciente para visualizar o relatório correspondente.</p><select id="report-patient">${state.patients.map((item) => `<option value="${item.id}" ${item.id === patient.id ? "selected" : ""}>${escapeHTML(item.name)}</option>`).join("")}</select></div><div class="report-info"><strong>Conteúdo automático</strong><span>Entram apenas registros preenchidos por profissionais encaminhados.</span></div></aside>
      ${reportPaper(patient)}
    </div>`;
}

function reportPaper(patient, print = false) {
  const assigned = getAssigned(patient);
  const reports = patientReports(patient.id);
  const reportSection = (field, title) => {
    const items = assigned.filter((professional) => reports[professional.id]?.[field]?.trim());
    return `<section class="report-section"><h3>${title}</h3>${items.length ? items.map((professional) => `<div class="professional-report"><strong>${escapeHTML(professional.specialty)} · ${escapeHTML(professional.name)}</strong><p>${escapeHTML(reports[professional.id][field])}</p></div>`).join("") : `<p class="report-empty">Nenhum registro profissional preenchido nesta seção.</p>`}</section>`;
  };
  const guardians = patient.guardians;
  return `<article class="report-paper ${print ? "print-paper" : ""}"><header class="letterhead"><img class="report-logo" src="assets/logo-horizontal-azul.png" alt="Mente e Transformação · Clínica"><h2>${escapeHTML(state.clinic.name)}</h2><p>${escapeHTML(state.clinic.address)} · ${escapeHTML(state.clinic.phone)} · ${escapeHTML(state.clinic.email)}</p><div class="report-title">Relatório profissional integrado</div></header><section class="report-section"><h3>Dados de cadastro</h3><table class="patient-table"><tbody><tr><td>Paciente</td><td>${escapeHTML(patient.name)}</td><td>Sexo</td><td>${escapeHTML(patient.gender)}</td></tr><tr><td>Nascimento</td><td>${dateLabel(patient.birthDate)} · ${ageFromDate(patient.birthDate)}</td><td>CPF</td><td>${escapeHTML(patient.cpf || "Não informado")}</td></tr><tr><td>Responsáveis</td><td colspan="3">${guardians.map((guardian) => `${escapeHTML(guardian.relation || "Responsável")}: ${escapeHTML(guardian.name)} · CPF ${escapeHTML(guardian.cpf || "não informado")}`).join("<br>")}</td></tr><tr><td>Queixa familiar</td><td colspan="3">${escapeHTML(patient.familyComplaint)}</td></tr></tbody></table></section>${reportSection("complaint", "Queixa principal por área")}${reportSection("plan", "Plano de ação")}${reportSection("result", "Resultados e evolução")}<section class="signatures">${guardians.map((guardian) => `<div class="signature">${escapeHTML(guardian.name)}<span>${escapeHTML(guardian.relation || "Responsável")} · CPF ${escapeHTML(guardian.cpf || "")}</span></div>`).join("")}<div class="signature">${escapeHTML(state.clinic.director)}<span>${escapeHTML(state.clinic.directorRole)}</span></div></section><footer class="report-footer">${escapeHTML(state.clinic.name)} · Documento gerado em ${dateLabel(new Date().toISOString().slice(0, 10))}</footer></article>`;
}

function emptyInline(text) { return `<div class="empty-inline">${escapeHTML(text)}</div>`; }
function emptyState(title, text, buttonLabel = "", target = "") { return `<div class="empty-state"><div class="empty-icon">◌</div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(text)}</p>${buttonLabel ? `<button class="button" type="button" data-nav="${target}">${escapeHTML(buttonLabel)}</button>` : ""}</div>`; }

function viewTemplate() {
  if (!ui.role) return loginTemplate();
  if (ui.role !== "admin" && ADMIN_VIEWS.includes(ui.view)) ui.view = "dashboard";
  if (ui.role === "admin" && ui.view === "agenda") ui.view = "dashboard";
  let content;
  if (ui.view === "professionals") content = professionalsView();
  else if (ui.view === "anamnese") content = anamneseView();
  else if (ui.view === "assignments") content = assignmentsView();
  else if (ui.view === "my-cases") content = myCasesView();
  else if (ui.view === "agenda") content = agendaView();
  else if (ui.view === "case-detail") content = caseDetailView();
  else if (ui.view === "reports") content = reportsView();
  else content = ui.role === "admin" ? adminDashboard() : professionalDashboard();
  return shellTemplate(content);
}

function render() {
  document.querySelector("#app").innerHTML = viewTemplate();
  bindEvents();
}

function bindEvents() {
  document.querySelector("#login-form")?.addEventListener("submit", submitLogin);
  document.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.nav)));
  document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", () => { ui.role = null; ui.account = null; ui.newAccess = null; ui.editProfessionalId = null; ui.draftSessions = []; ui.draftAssigned = null; ui.view = "dashboard"; render(); }));
  document.querySelectorAll("[data-open-notices]").forEach((button) => button.addEventListener("click", () => { toast(ui.role === "admin" ? "Você possui encaminhamentos e atualizações para revisar." : "Estes são os casos encaminhados para seu perfil."); setView(ui.role === "admin" ? "assignments" : "my-cases"); }));
  document.querySelectorAll("[data-open-assignment]").forEach((button) => button.addEventListener("click", () => { ui.activeCaseId = button.dataset.openAssignment; setView("assignments"); }));
  document.querySelectorAll("[data-open-case]").forEach((button) => button.addEventListener("click", () => { ui.activeCaseId = button.dataset.openCase; ui.caseTab = "registro"; setView("case-detail"); }));
  document.querySelectorAll("[data-edit-professional]").forEach((row) => {
    const open = () => { ui.editProfessionalId = row.dataset.editProfessional; ui.newAccess = null; render(); document.querySelector("#add-professional")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
    row.addEventListener("click", (event) => { if (!event.target.closest("button")) open(); });
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" && event.target === row) open(); });
  });
  document.querySelector("[data-cancel-edit]")?.addEventListener("click", () => { ui.editProfessionalId = null; render(); });
  document.querySelector("[data-toggle-password]")?.addEventListener("click", (event) => { const input = document.querySelector("#edit-password"); const show = input.type === "password"; input.type = show ? "text" : "password"; event.currentTarget.textContent = show ? "Ocultar senha" : "Mostrar senha"; });
  document.querySelector("[data-generate-password]")?.addEventListener("click", () => { const input = document.querySelector("#edit-password"); input.value = generatePassword(); input.type = "text"; document.querySelector("[data-toggle-password]").textContent = "Ocultar senha"; toast("Nova senha gerada. Clique em Salvar alterações para aplicar."); });
  document.querySelector("[data-copy-credentials]")?.addEventListener("click", () => { const user = document.querySelector("#edit-username").value, pass = document.querySelector("#edit-password").value; if (!user || !pass) return toast("Preencha usuário e senha antes de copiar.", true); navigator.clipboard?.writeText(`Usuário: ${user}\nSenha: ${pass}`).then(() => toast("Acesso copiado."), () => toast("Não foi possível copiar. Selecione e copie manualmente.", true)); });
  document.querySelector("#professional-edit-form")?.addEventListener("submit", submitProfessionalEdit);
  document.querySelector("[data-copy-access]")?.addEventListener("click", copyAccess);
  document.querySelector("[data-dismiss-access]")?.addEventListener("click", () => { ui.newAccess = null; render(); });
  document.querySelectorAll("[data-delete-professional]").forEach((button) => button.addEventListener("click", () => deleteProfessional(button.dataset.deleteProfessional)));
  document.querySelectorAll("[data-scroll-add]").forEach((button) => button.addEventListener("click", () => document.querySelector("#add-professional")?.scrollIntoView({ behavior: "smooth" })));
  document.querySelectorAll("[data-filter-specialty]").forEach((button) => button.addEventListener("click", () => { ui.filterSpecialty = button.dataset.filterSpecialty; render(); }));
  document.querySelectorAll("[data-case-tab]").forEach((button) => button.addEventListener("click", () => { ui.caseTab = button.dataset.caseTab; render(); }));
  document.querySelectorAll("[data-print-report]").forEach((button) => button.addEventListener("click", printReport));

  document.querySelector("#professional-form")?.addEventListener("submit", submitProfessional);
  document.querySelector("#anamnese-form")?.addEventListener("submit", submitAnamnese);
  document.querySelector("#add-guardian")?.addEventListener("click", () => { document.querySelector("#guardians-container").insertAdjacentHTML("beforeend", guardianFields()); bindGuardianButtons(); });
  bindGuardianButtons();
  document.querySelectorAll('input[name="hypothesis"]').forEach((input) => input.addEventListener("change", toggleConditionalFields));
  document.querySelectorAll('input[name="diagnosis"]').forEach((input) => input.addEventListener("change", toggleConditionalFields));
  document.querySelector("#diagnosis-file")?.addEventListener("change", (event) => { document.querySelector("#file-name").textContent = event.target.files?.[0]?.name || "Nenhum arquivo selecionado"; });
  document.querySelectorAll('input[name="assigned-professional"]').forEach((input) => input.addEventListener("change", () => {
    const patient = getPatient();
    const picked = new Set(ui.draftAssigned || patient?.assignedIds || []);
    if (input.checked) picked.add(input.value); else picked.delete(input.value);
    ui.draftAssigned = [...picked];
    ui.draftSessions = ui.draftSessions.filter((draft) => picked.has(draft.professionalId));
    render();
  }));
  document.querySelectorAll("[data-cal-nav]").forEach((button) => button.addEventListener("click", () => { const [scope, delta] = button.dataset.calNav.split("|"); const cal = calState(scope); cal.month = shiftMonth(cal.month, Number(delta)); render(); }));
  document.querySelectorAll("[data-cal-day]").forEach((button) => button.addEventListener("click", () => { const [scope, date] = button.dataset.calDay.split("|"); calState(scope).date = date; render(); }));
  document.querySelectorAll("[data-sched-slot]").forEach((button) => button.addEventListener("click", () => {
    const [professionalId, date, time] = button.dataset.schedSlot.split("|");
    const problem = conflictMessage(professionalId, date, time);
    if (problem) return toast(problem, true);
    ui.draftSessions.push({ id: uid("draft"), professionalId, date, time });
    render();
  }));
  document.querySelectorAll("[data-remove-draft]").forEach((button) => button.addEventListener("click", () => { ui.draftSessions = ui.draftSessions.filter((draft) => draft.id !== button.dataset.removeDraft); render(); }));
  document.querySelectorAll("[data-remove-unavailability]").forEach((button) => button.addEventListener("click", () => {
    const item = state.unavailability.find((entry) => entry.id === button.dataset.removeUnavailability);
    if (!item || item.professionalId !== ui.professionalId) return;
    state.unavailability = state.unavailability.filter((entry) => entry !== item); saveState(); render(); toast("Indisponibilidade removida.");
  }));
  document.querySelector("#unavailability-form")?.addEventListener("submit", saveUnavailability);
  document.querySelectorAll('#unavailability-form input[name="mode"]').forEach((input) => input.addEventListener("change", () => document.querySelector("#time-fields").classList.toggle("hidden", document.querySelector('#unavailability-form input[name="mode"]:checked').value !== "time")));
  document.querySelector("#save-assignment")?.addEventListener("click", saveAssignment);
  document.querySelector("#professional-record-form")?.addEventListener("submit", saveProfessionalRecord);
  document.querySelector("#session-form")?.addEventListener("submit", saveSession);
  document.querySelector("#report-patient")?.addEventListener("change", (event) => { ui.activeCaseId = event.target.value; render(); });
}

function bindGuardianButtons() {
  document.querySelectorAll(".remove-guardian").forEach((button) => button.onclick = () => {
    const rows = document.querySelectorAll(".guardian-row");
    if (rows.length === 1) return toast("Mantenha pelo menos um responsável para contato.", true);
    button.closest(".guardian-row").remove();
  });
}

function toggleConditionalFields() {
  const hypothesisYes = document.querySelector('input[name="hypothesis"]:checked')?.value === "yes";
  const diagnosisYes = document.querySelector('input[name="diagnosis"]:checked')?.value === "yes";
  document.querySelector("#hypothesis-details")?.classList.toggle("hidden", !hypothesisYes);
  document.querySelector("#diagnosis-details")?.classList.toggle("hidden", !diagnosisYes);
}

const accountOf = (professionalId) => state.accounts.find((account) => account.professionalId === professionalId);

function accessCard() {
  const access = ui.newAccess;
  if (!access) return "";
  return `<article class="panel content-panel access-card" role="status"><div><h2>Acesso gerado para ${escapeHTML(access.name)}</h2><p class="cell-muted">Entregue estes dados ao profissional. A senha aparece só agora e não poderá ser consultada depois; se for perdida, use “Nova senha”.</p><dl class="access-data"><div><dt>Usuário</dt><dd>${escapeHTML(access.username)}</dd></div><div><dt>Senha</dt><dd>${escapeHTML(access.password)}</dd></div></dl></div><div class="table-actions"><button class="button small" type="button" data-copy-access>Copiar</button><button class="button secondary small" type="button" data-dismiss-access>Fechar</button></div></article>`;
}

async function createAccess(professional) {
  const existing = accountOf(professional.id);
  const username = existing?.username || suggestUsername(professional.name);
  const password = generatePassword();
  const hash = await hashPassword(username, password);
  if (existing) Object.assign(existing, { hash, password });
  else state.accounts.push({ username, role: "professional", professionalId: professional.id, password, hash });
  ui.newAccess = { name: professional.name, username, password };
}

function copyAccess() {
  const access = ui.newAccess;
  if (!access) return;
  navigator.clipboard?.writeText(`Usuário: ${access.username}\nSenha: ${access.password}`).then(() => toast("Acesso copiado."), () => toast("Não foi possível copiar. Selecione e copie manualmente.", true));
}

async function submitProfessionalEdit(event) {
  event.preventDefault();
  if (ui.role !== "admin") return toast("Somente a administração pode editar profissionais.", true);
  const professional = getProfessional(ui.editProfessionalId);
  if (!professional) return;
  const data = new FormData(event.currentTarget);
  const name = data.get("name").trim(), username = normUser(data.get("username")), password = String(data.get("password") || "");
  const account = accountOf(professional.id);
  if (!name) return toast("Informe o nome do profissional.", true);
  if (password && !username) return toast("Informe o usuário de acesso.", true);
  if (username && !/^[a-z0-9._-]{3,}$/.test(username)) return toast("O usuário precisa ter 3 ou mais caracteres: letras minúsculas, números, ponto, hífen ou sublinhado.", true);
  if (username && state.accounts.some((item) => item.username === username && item !== account)) return toast("Este usuário já está em uso.", true);
  if (password && password.length < 6) return toast("A senha precisa ter pelo menos 6 caracteres.", true);
  const keepsHash = Boolean(account) && !password && !account.password && username === account.username;
  if (username && !password && !keepsHash) return toast("Defina uma senha para este acesso.", true);
  Object.assign(professional, { name, specialty: data.get("specialty"), code: data.get("code").trim(), focus: data.get("focus").trim() });
  if (username && !keepsHash) {
    const hash = await hashPassword(username, password);
    if (account) Object.assign(account, { username, password, hash });
    else state.accounts.push({ username, role: "professional", professionalId: professional.id, password, hash });
  }
  saveState(); ui.editProfessionalId = null; render(); toast("Dados do profissional atualizados.");
}

async function submitProfessional(event) {
  event.preventDefault();
  if (ui.role !== "admin") return toast("Somente a administração pode cadastrar profissionais.", true);
  const data = new FormData(event.currentTarget);
  const professional = { id: uid("prof"), name: data.get("name").trim(), specialty: data.get("specialty"), code: data.get("code").trim() };
  state.professionals.push(professional);
  await createAccess(professional);
  saveState(); render(); window.scrollTo({ top: 0, behavior: "smooth" });
  toast("Profissional cadastrado e acesso gerado.");
}

function deleteProfessional(id) {
  if (ui.role !== "admin") return toast("Somente a administração pode remover profissionais.", true);
  const professional = getProfessional(id);
  if (!professional) return;
  const used = state.patients.some((patient) => patient.assignedIds.includes(id));
  if (used) return toast("Este profissional possui casos encaminhados e não pode ser removido nesta etapa.", true);
  state.professionals = state.professionals.filter((item) => item.id !== id);
  state.accounts = state.accounts.filter((account) => account.professionalId !== id);
  if (ui.professionalId === id) ui.professionalId = state.professionals[0]?.id;
  if (ui.editProfessionalId === id) ui.editProfessionalId = null;
  saveState(); render(); toast("Profissional removido da equipe.");
}

function submitAnamnese(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const guardians = [...document.querySelectorAll(".guardian-row")].map((row) => ({ relation: row.querySelector('[name="guardian-relation"]').value, name: row.querySelector('[name="guardian-name"]').value.trim(), cpf: row.querySelector('[name="guardian-cpf"]').value.trim(), phone: row.querySelector('[name="guardian-phone"]').value.trim(), email: row.querySelector('[name="guardian-email"]').value.trim() })).filter((guardian) => guardian.name || guardian.cpf || guardian.phone || guardian.email);
  const hasHypothesis = data.get("hypothesis") === "yes";
  const hasDiagnosis = data.get("diagnosis") === "yes";
  const patient = {
    id: uid("case"), name: data.get("patientName").trim(), gender: data.get("gender"), birthDate: data.get("birthDate"), cpf: data.get("patientCpf").trim(), guardians,
    hypothesis: { has: hasHypothesis, narrative: hasHypothesis ? data.get("hypothesisText").trim() : "" },
    diagnosis: { has: hasDiagnosis, fileName: hasDiagnosis ? (document.querySelector("#diagnosis-file").files?.[0]?.name || "Documento indicado pela família") : "" },
    familyComplaint: data.get("familyComplaint").trim(), assignedIds: [], status: "Aguardando encaminhamento", createdAt: new Date().toISOString().slice(0, 10),
  };
  state.patients.unshift(patient); ui.activeCaseId = patient.id; saveState(); ui.filterSpecialty = "Todas"; setView("assignments"); toast("Ficha de anamnese salva. Agora selecione os profissionais.");
}

function saveAssignment() {
  const patient = getPatient();
  if (!patient) return;
  const selected = ui.draftAssigned || patient.assignedIds;
  if (!selected.length) return toast("Selecione ao menos um profissional para encaminhar o caso.", true);
  const pending = ui.draftSessions;
  ui.draftSessions = [];
  const conflict = pending.map((draft) => ({ draft, problem: conflictMessage(draft.professionalId, draft.date, draft.time) })).find((item) => item.problem);
  if (conflict) { ui.draftSessions = pending; return toast(`${getProfessional(conflict.draft.professionalId)?.name}: ${conflict.problem}`, true); }
  pending.forEach((draft) => {
    state.sessions[patient.id] ||= {}; state.sessions[patient.id][draft.professionalId] ||= [];
    state.sessions[patient.id][draft.professionalId].push({ id: uid("session"), date: draft.date, time: draft.time, objective: "Atendimento agendado pela administração", status: "Agendada" });
    state.sessions[patient.id][draft.professionalId].sort((x, y) => `${x.date} ${x.time || ""}`.localeCompare(`${y.date} ${y.time || ""}`));
  });
  patient.assignedIds = selected; patient.status = "Em acompanhamento"; ui.draftAssigned = null;
  saveState(); render(); toast(pending.length ? `Encaminhamento salvo e ${pending.length} atendimento${pending.length === 1 ? "" : "s"} agendado${pending.length === 1 ? "" : "s"}.` : "Encaminhamento salvo. Os profissionais selecionados foram notificados.");
}

async function saveUnavailability(event) {
  event.preventDefault();
  const professional = getProfessional(ui.professionalId), date = ui.agenda.date;
  if (ui.role !== "professional" || !professional || !date) return;
  if (date < todayKey()) return toast("Escolha uma data a partir de hoje.", true);
  const data = new FormData(event.currentTarget), allDay = data.get("mode") === "day";
  const start = String(data.get("start") || ""), end = String(data.get("end") || "");
  if (!allDay && (!start || !end || timeToMin(start) >= timeToMin(end))) return toast("Informe um horário inicial anterior ao horário final.", true);
  const weeks = Math.max(1, Number(data.get("weeks")) || 1), note = data.get("note").trim();
  let added = 0, warned = false;
  for (let i = 0; i < weeks; i++) {
    const day = addDays(date, i * 7);
    const duplicate = state.unavailability.some((item) => item.professionalId === professional.id && item.date === day && item.allDay === allDay && item.start === (allDay ? "" : start) && item.end === (allDay ? "" : end));
    if (duplicate) continue;
    state.unavailability.push({ id: uid("una"), professionalId: professional.id, date: day, allDay, start: allDay ? "" : start, end: allDay ? "" : end, note });
    added++;
    if (professionalSessions(professional.id).some(({ session }) => session.date === day && session.status === "Agendada" && session.time && (allDay || (timeToMin(session.time) < timeToMin(end) && timeToMin(start) < timeToMin(session.time) + SESSION_MINUTES)))) warned = true;
  }
  saveState(); render();
  toast(warned ? "Indisponibilidade salva, mas há atendimento já agendado nesse período. Avise a administração." : added ? `Indisponibilidade marcada em ${added} dia${added === 1 ? "" : "s"}.` : "Esse período já estava marcado.", warned);
}

function saveProfessionalRecord(event) {
  event.preventDefault();
  const patient = getPatient();
  const professional = getProfessional(ui.professionalId);
  if (!patient || !professional) return;
  const data = new FormData(event.currentTarget);
  state.reports[patient.id] ||= {};
  state.reports[patient.id][professional.id] = { complaint: data.get("complaint").trim(), plan: data.get("plan").trim(), result: data.get("result").trim(), updatedAt: new Date().toISOString().slice(0, 10) };
  saveState(); render(); toast("Evolução profissional salva no relatório integrado.");
}

function saveSession(event) {
  event.preventDefault();
  const patient = getPatient(); const professional = getProfessional(ui.professionalId); if (!patient || !professional) return;
  const data = new FormData(event.currentTarget);
  const problem = data.get("status") === "Agendada" ? conflictMessage(professional.id, data.get("date"), data.get("time")) : "";
  if (problem) return toast(problem, true);
  state.sessions[patient.id] ||= {}; state.sessions[patient.id][professional.id] ||= [];
  state.sessions[patient.id][professional.id].push({ id: uid("session"), date: data.get("date"), time: data.get("time"), objective: data.get("objective").trim(), status: data.get("status") });
  state.sessions[patient.id][professional.id].sort((a, b) => `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`));
  saveState(); render(); toast("Sessão adicionada à agenda.");
}

function printReport() {
  const patient = getPatient();
  if (!patient) return;
  const root = document.createElement("div");
  root.className = "print-root";
  root.innerHTML = reportPaper(patient, true);
  document.body.append(root);
  window.print();
  root.remove();
}

render();
