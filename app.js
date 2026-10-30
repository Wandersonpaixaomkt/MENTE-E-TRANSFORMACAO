/* Mente & Transformação — protótipo funcional com persistência local */

const STORAGE_KEY = "mente-transformacao-clinic-v1";
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

const demoState = {
  clinic: {
    name: "Clínica Mente & Transformação",
    address: "Av. Exemplo, 1200 — Centro",
    phone: "(00) 0000-0000",
    email: "contato@menteetransformacao.com",
    director: "Dra. Helena Martins",
    directorRole: "Diretora Clínica",
  },
  professionals: [
    { id: "prof-ana", name: "Dra. Ana Luísa Mendes", specialty: "Psicologia", code: "CRP 00/12345" },
    { id: "prof-bruno", name: "Bruno Farias", specialty: "Psicopedagogia", code: "ABPp 00/6789" },
    { id: "prof-clara", name: "Dra. Clara Paes", specialty: "Fonoaudiologia", code: "CRFa 0-00000" },
    { id: "prof-daniel", name: "Daniela Rocha", specialty: "Terapia Ocupacional", code: "CREFITO 0/00000" },
  ],
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
      assignedIds: ["prof-ana", "prof-bruno", "prof-clara"],
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
      assignedIds: ["prof-bruno", "prof-daniel"],
      status: "Em acompanhamento",
      createdAt: "2026-10-24",
    },
  ],
  reports: {
    "case-miguel": {
      "prof-ana": {
        complaint: "Observa-se dificuldade de comunicação de necessidades e regulação emocional diante de mudanças de rotina.",
        plan: "Realizar acolhimento lúdico, observação clínica e orientação parental com foco em previsibilidade e comunicação.",
        result: "Vínculo terapêutico iniciado. Miguel passou a aceitar melhor a transição entre atividades em sessão.",
        updatedAt: "2026-10-28",
      },
      "prof-bruno": {
        complaint: "Há desafios na manutenção da atenção em tarefas estruturadas e no reconhecimento de sons iniciais.",
        plan: "Aplicar sondagem psicopedagógica e propor atividades graduadas de consciência fonológica.",
        result: "",
        updatedAt: "2026-10-28",
      },
    },
  },
  sessions: {
    "case-miguel": {
      "prof-ana": [
        { id: "s1", date: "2026-10-27", objective: "Entrevista inicial e observação clínica", status: "Realizada" },
        { id: "s2", date: "2026-11-03", objective: "Atividade de vínculo e comunicação", status: "Agendada" },
      ],
    },
  },
};

let state = loadState();
let ui = { role: null, view: "dashboard", activeCaseId: "case-miguel", professionalId: "prof-ana", filterSpecialty: "Todas", caseTab: "registro" };

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : structuredClone(demoState);
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
function setView(view) { ui.view = view; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

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
        <div class="brand"><span class="brand-mark">M</span><span class="brand-name">Mente & Transformação</span></div>
        <div class="login-message">
          <p class="eyebrow">Gestão clínica integrada</p>
          <h1>O cuidado começa com escuta e conexão.</h1>
          <p>Organize cada etapa do acompanhamento multidisciplinar em um espaço seguro, claro e humano.</p>
        </div>
        <div class="login-footer">Painel clínico · versão inicial</div>
      </section>
      <section class="login-panel">
        <div class="login-card">
          <p class="eyebrow" style="color:#4d8b69">Acesso ao sistema</p>
          <h2>Como deseja entrar?</h2>
          <p>Selecione seu perfil para acessar o painel correspondente.</p>
          <div class="profile-choice">
            <button class="role-button" data-login="admin" type="button">
              <span class="role-icon">⌘</span><span class="role-copy"><strong>Administrativo</strong><span>Cadastros, anamnese, encaminhamentos e relatórios.</span></span><span class="role-arrow">›</span>
            </button>
            <button class="role-button" data-login="professional" type="button">
              <span class="role-icon">✦</span><span class="role-copy"><strong>Profissional</strong><span>Casos atribuídos, evolução e agenda de atendimentos.</span></span><span class="role-arrow">›</span>
            </button>
          </div>
          <p class="login-note">Nesta primeira etapa, o acesso é demonstrativo e não exige senha.</p>
        </div>
      </section>
    </main>`;
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
    ["reports", "▧", "Relatório integrado"],
  ];
}

function shellTemplate(content) {
  const isAdmin = ui.role === "admin";
  const currentProfessional = getProfessional(ui.professionalId);
  const userName = isAdmin ? state.clinic.director : (currentProfessional?.name || "Profissional");
  const userSub = isAdmin ? "Administrativo" : (currentProfessional?.specialty || "Profissional");
  const activeNav = ui.view === "case-detail" ? "my-cases" : ui.view;
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">M</span><span class="brand-name">Mente & Transformação</span></div>
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
  const labels = { dashboard: "Visão geral", professionals: "Profissionais", anamnese: "Nova anamnese", assignments: "Encaminhamentos", "my-cases": "Meus atendimentos", "case-detail": "Acompanhamento do caso", reports: "Relatório integrado" };
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

function professionalDashboard() {
  const professional = getProfessional(ui.professionalId) || state.professionals[0];
  const cases = state.patients.filter((patient) => patient.assignedIds.includes(professional?.id));
  const complete = cases.filter((patient) => patientReports(patient.id)[professional?.id]?.result).length;
  return `
    ${sectionHeading(`Olá, ${escapeHTML(professional?.name?.split(" ").slice(0, 2).join(" ") || "profissional")}`, "Aqui estão os pacientes que aguardam seu acompanhamento.")}
    ${professionalSelector()}
    <section class="stats-grid">
      <article class="stat-card"><span class="stat-icon">◎</span><div class="stat-label">Casos atribuídos</div><div class="stat-value">${cases.length}</div><div class="stat-foot">Notificações recebidas</div></article>
      <article class="stat-card"><span class="stat-icon">◷</span><div class="stat-label">Sessões agendadas</div><div class="stat-value">${cases.reduce((total, patient) => total + patientSessions(patient.id, professional?.id).filter((session) => session.status === "Agendada").length, 0)}</div><div class="stat-foot">Próximos atendimentos</div></article>
      <article class="stat-card"><span class="stat-icon">✓</span><div class="stat-label">Evoluções registradas</div><div class="stat-value">${complete}</div><div class="stat-foot">Com resultado parcial</div></article>
      <article class="stat-card"><span class="stat-icon">▧</span><div class="stat-label">Perfil profissional</div><div class="stat-value">1</div><div class="stat-foot">${escapeHTML(professional?.specialty || "")}</div></article>
    </section>
    <section class="panel"><div class="panel-header"><h2>Notificações de encaminhamento</h2><button class="text-action" type="button" data-nav="my-cases">Ver atendimentos</button></div><div class="case-list">${cases.map((patient) => professionalCaseRow(patient, professional)).join("") || emptyInline("Nenhum caso foi encaminhado para este profissional.")}</div></section>`;
}

function professionalSelector() {
  return `<div class="professional-bar"><div><strong>Visualizando como profissional</strong><p>Troque o perfil demonstrativo para conferir os encaminhamentos de cada área.</p></div><select id="professional-switch" aria-label="Selecionar profissional">${state.professionals.map((professional) => `<option value="${professional.id}" ${professional.id === ui.professionalId ? "selected" : ""}>${escapeHTML(professional.name)} · ${escapeHTML(professional.specialty)}</option>`).join("")}</select></div>`;
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
    ${sectionHeading("Profissionais", "Cadastre e mantenha atualizada a equipe multidisciplinar.", `<button class="button" type="button" data-scroll-add>+ Cadastrar profissional</button>`)}
    <div class="split-layout">
      <article class="panel content-panel"><div class="panel-header" style="padding:0 0 17px"><h2>Equipe cadastrada</h2><span class="cell-muted">${state.professionals.length} profissionais</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Profissional</th><th>Especialidade</th><th>Código/registro</th><th></th></tr></thead><tbody>${state.professionals.map((professional) => `<tr><td><div class="person-cell"><span class="mini-avatar">${initials(professional.name)}</span><strong>${escapeHTML(professional.name)}</strong></div></td><td>${escapeHTML(professional.specialty)}</td><td class="cell-muted">${escapeHTML(professional.code)}</td><td><div class="table-actions"><button class="button danger small" type="button" data-delete-professional="${professional.id}">Remover</button></div></td></tr>`).join("") || `<tr><td colspan="4">${emptyInline("Nenhum profissional cadastrado.")}</td></tr>`}</tbody></table></div></article>
      <aside class="panel form-card" id="add-professional"><h2>Novo profissional</h2><p>Os profissionais cadastrados ficarão disponíveis para encaminhamento de novos casos.</p><form id="professional-form"><div class="form-grid"><div class="field full"><label for="professional-name">Nome completo</label><input id="professional-name" name="name" required placeholder="Nome do profissional" /></div><div class="field"><label for="professional-specialty">Especialidade</label><select id="professional-specialty" name="specialty" required><option value="" selected disabled>Selecione</option>${SPECIALTIES.map((item) => `<option>${item}</option>`).join("")}</select></div><div class="field"><label for="professional-code">Código ou registro</label><input id="professional-code" name="code" required placeholder="Ex.: CRP 00/00000" /></div></div><div class="form-actions"><button class="button" type="submit">Salvar profissional</button></div></form></aside>
    </div>`;
}

function guardianFields(guardian = {}) {
  return `<div class="guardian-row"><div class="field"><label>Categoria</label><select name="guardian-relation" required><option value="" ${!guardian.relation ? "selected" : ""} disabled>Ex.: Mãe</option>${["Mãe", "Pai", "Avó", "Avô", "Tio", "Tia", "Responsável legal", "Outro"].map((item) => `<option ${guardian.relation === item ? "selected" : ""}>${item}</option>`).join("")}</select></div><div class="field"><label>Nome completo</label><input name="guardian-name" required value="${escapeHTML(guardian.name || "")}" placeholder="Nome" /></div><div class="field"><label>CPF</label><input name="guardian-cpf" value="${escapeHTML(guardian.cpf || "")}" placeholder="000.000.000-00" /></div><div class="field"><label>Telefone</label><input name="guardian-phone" required value="${escapeHTML(guardian.phone || "")}" placeholder="(00) 00000-0000" /></div><div class="field"><label>E-mail</label><input name="guardian-email" type="email" value="${escapeHTML(guardian.email || "")}" placeholder="email@exemplo.com" /></div><button class="icon-button remove-guardian" type="button" title="Remover responsável" aria-label="Remover responsável">×</button></div>`;
}

function anamneseView() {
  return `
    ${sectionHeading("Nova ficha de anamnese", "Colete as informações iniciais do paciente e da família para começar a investigação.")}
    <div class="split-layout">
      <form class="panel form-card" id="anamnese-form">
        <h2>Dados de entrada</h2><p>Os campos marcados serão organizados no prontuário do paciente.</p>
        <section class="form-section"><div class="form-section-title"><div><h3>Responsáveis para contato</h3><p>Inclua um ou mais responsáveis presentes no atendimento.</p></div><button class="button secondary small" id="add-guardian" type="button">+ Adicionar</button></div><div id="guardians-container">${guardianFields()}</div></section>
        <section class="form-section"><div class="form-section-title"><div><h3>Cadastro do paciente</h3><p>Dados de identificação da criança, adolescente ou adulto.</p></div></div><div class="form-grid three"><div class="field full"><label for="patient-name">Nome completo</label><input id="patient-name" name="patientName" required placeholder="Nome do paciente" /></div><div class="field"><label for="patient-gender">Sexo</label><select id="patient-gender" name="gender" required><option value="" selected disabled>Selecione</option><option>Feminino</option><option>Masculino</option><option>Outro</option><option>Prefere não informar</option></select></div><div class="field"><label for="patient-birth">Data de nascimento</label><input id="patient-birth" type="date" name="birthDate" required /></div><div class="field"><label for="patient-cpf">CPF</label><input id="patient-cpf" name="patientCpf" placeholder="000.000.000-00" /></div></div></section>
        <section class="form-section"><div class="form-section-title"><div><h3>Hipótese diagnóstica</h3><p>Há uma hipótese relatada pela família ou por outro profissional?</p></div></div><div class="radio-line"><label class="radio-pill"><input type="radio" name="hypothesis" value="yes" /> Sim</label><label class="radio-pill"><input type="radio" name="hypothesis" value="no" checked /> Não</label></div><div class="conditional hidden" id="hypothesis-details"><div class="field"><label for="hypothesis-text">Relato da família ou do responsável</label><textarea id="hypothesis-text" name="hypothesisText" placeholder="Descreva a hipótese apresentada durante a entrevista."></textarea></div></div></section>
        <section class="form-section"><div class="form-section-title"><div><h3>Diagnóstico ou documento anterior</h3><p>Existe laudo, avaliação escolar ou documento de outro profissional?</p></div></div><div class="radio-line"><label class="radio-pill"><input type="radio" name="diagnosis" value="yes" /> Sim</label><label class="radio-pill"><input type="radio" name="diagnosis" value="no" checked /> Não</label></div><div class="conditional hidden" id="diagnosis-details"><div class="upload-box"><label class="upload-label" for="diagnosis-file">Anexar arquivo</label><input id="diagnosis-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" /><span class="file-name" id="file-name">Nenhum arquivo selecionado</span></div></div></section>
        <section class="form-section"><div class="form-section-title"><div><h3>Queixa descrita pela família</h3><p>Registre o relato livre, necessidades e dificuldades apresentadas.</p></div></div><div class="field"><textarea name="familyComplaint" required placeholder="Descreva o motivo da busca, contexto e principais dificuldades relatadas."></textarea></div></section>
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
  const assignedIds = new Set(patient?.assignedIds || []);
  const listed = ui.filterSpecialty === "Todas" ? state.professionals : state.professionals.filter((professional) => professional.specialty === ui.filterSpecialty);
  return `
    ${sectionHeading("Encaminhar profissionais", "Selecione a equipe que acompanhará este caso individualmente.")}
    <div class="split-layout">
      <article class="panel form-card">
        ${patient ? `<div class="assignment-patient"><span class="case-avatar">${initials(patient.name)}</span><div><h3>${escapeHTML(patient.name)}</h3><span>${ageFromDate(patient.birthDate)} · Anamnese criada em ${dateLabel(patient.createdAt)}</span></div>${statusTag(patient.status)}</div>` : `<div class="empty-state"><div class="empty-icon">◎</div><h2>Nenhuma ficha selecionada</h2><p>Crie uma anamnese antes de fazer um encaminhamento.</p><button class="button" type="button" data-nav="anamnese">Iniciar anamnese</button></div>`}
        ${patient ? `<section class="form-section"><div class="form-section-title"><div><h3>Equipe multidisciplinar</h3><p>Clique nos profissionais que participarão da investigação e do plano de cuidado.</p></div></div><div class="specialty-filter">${["Todas", ...SPECIALTIES.filter((specialty) => state.professionals.some((item) => item.specialty === specialty))].map((specialty) => `<button type="button" class="filter-chip ${ui.filterSpecialty === specialty ? "active" : ""}" data-filter-specialty="${escapeHTML(specialty)}">${escapeHTML(specialty)}</button>`).join("")}</div><div class="professional-options">${listed.map((professional) => `<label class="professional-option ${assignedIds.has(professional.id) ? "selected" : ""}"><input type="checkbox" name="assigned-professional" value="${professional.id}" ${assignedIds.has(professional.id) ? "checked" : ""}/><span class="mini-avatar">${initials(professional.name)}</span><span><strong>${escapeHTML(professional.name)}</strong><span>${escapeHTML(professional.specialty)} · ${escapeHTML(professional.code)}</span></span><span class="choice-check">${assignedIds.has(professional.id) ? "✓" : ""}</span></label>`).join("") || emptyInline("Não há profissionais nesta especialidade.")}</div></section><div class="form-actions"><button class="button secondary" type="button" data-nav="anamnese">← Voltar</button><button class="button" id="save-assignment" type="button">Salvar encaminhamento</button></div>` : ""}
      </article>
      <aside class="panel assignment-summary"><h2>Profissionais selecionados</h2><p>Os selecionados receberão uma notificação em seu painel.</p><div class="selection-list" id="selection-list">${assignedSummary(patient)}</div><button class="button secondary wide-action" type="button" data-nav="reports">Visualizar relatório integrado</button></aside>
    </div>`;
}

function assignedSummary(patient) {
  const assigned = getAssigned(patient);
  return assigned.length ? assigned.map((professional) => `<span><strong>${escapeHTML(professional.specialty)}</strong><br>${escapeHTML(professional.name)}</span>`).join("") : `<div class="empty-selection">Selecione pelo menos um profissional.</div>`;
}

function myCasesView() {
  const professional = getProfessional(ui.professionalId) || state.professionals[0];
  const cases = state.patients.filter((patient) => patient.assignedIds.includes(professional?.id));
  return `
    ${sectionHeading("Meus atendimentos", "Casos em que você foi selecionado pela administração.")}
    ${professionalSelector()}
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
  return `<section class="panel content-panel"><div class="panel-header" style="padding:0 0 15px"><h2>Ficha de anamnese</h2><span class="cell-muted">Preenchida pela administração</span></div><div class="report-section" style="margin-top:0"><table class="patient-table"><tbody><tr><td>Paciente</td><td>${escapeHTML(patient.name)}</td><td>Data de nascimento</td><td>${dateLabel(patient.birthDate)} (${ageFromDate(patient.birthDate)})</td></tr><tr><td>Responsáveis</td><td colspan="3">${patient.guardians.map((guardian) => `${escapeHTML(guardian.relation)}: ${escapeHTML(guardian.name)} · ${escapeHTML(guardian.phone)}`).join("<br>")}</td></tr><tr><td>Hipótese</td><td colspan="3">${patient.hypothesis.has ? escapeHTML(patient.hypothesis.narrative) : "Não relatada"}</td></tr><tr><td>Diagnóstico</td><td colspan="3">${patient.diagnosis.has ? `Documento anexado: ${escapeHTML(patient.diagnosis.fileName || "arquivo")}` : "Não informado"}</td></tr><tr><td>Queixa familiar</td><td colspan="3">${escapeHTML(patient.familyComplaint)}</td></tr></tbody></table></div></section>`;
}

function scheduleView(patient, professional, sessions) {
  return `<div class="split-layout"><article class="panel form-card"><h2>Agenda de atendimentos</h2><p>Registre as sessões previstas e acompanhe o que já foi realizado.</p><div class="session-list">${sessions.map((session) => `<div class="session-item"><span class="session-calendar"><b>${new Date(`${session.date}T12:00:00`).getDate().toString().padStart(2, "0")}</b>${new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${session.date}T12:00:00`)).replace(".", "")}</span><div><strong>${escapeHTML(session.objective)}</strong><span>${dateLabel(session.date)}</span></div><span class="session-status">${statusTag(session.status)}</span></div>`).join("") || emptyInline("Nenhuma sessão registrada ainda.")}</div></article><form class="panel form-card" id="session-form"><h2>Adicionar sessão</h2><p>Crie um lembrete para o próximo atendimento.</p><div class="form-grid"><div class="field"><label for="session-date">Data</label><input id="session-date" name="date" type="date" required /></div><div class="field"><label for="session-status">Status</label><select id="session-status" name="status"><option>Agendada</option><option>Realizada</option></select></div><div class="field full"><label for="session-objective">Objetivo ou observação</label><input id="session-objective" name="objective" required placeholder="Ex.: Entrevista inicial com responsáveis" /></div></div><div class="form-actions"><button class="button" type="submit">Adicionar à agenda</button></div></form></div>`;
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
  return `<article class="report-paper ${print ? "print-paper" : ""}"><header class="letterhead"><h2>${escapeHTML(state.clinic.name)}</h2><p>${escapeHTML(state.clinic.address)} · ${escapeHTML(state.clinic.phone)} · ${escapeHTML(state.clinic.email)}</p><div class="report-title">Relatório profissional integrado</div></header><section class="report-section"><h3>Dados de cadastro</h3><table class="patient-table"><tbody><tr><td>Paciente</td><td>${escapeHTML(patient.name)}</td><td>Sexo</td><td>${escapeHTML(patient.gender)}</td></tr><tr><td>Nascimento</td><td>${dateLabel(patient.birthDate)} · ${ageFromDate(patient.birthDate)}</td><td>CPF</td><td>${escapeHTML(patient.cpf || "Não informado")}</td></tr><tr><td>Responsáveis</td><td colspan="3">${guardians.map((guardian) => `${escapeHTML(guardian.relation)}: ${escapeHTML(guardian.name)} · CPF ${escapeHTML(guardian.cpf || "não informado")}`).join("<br>")}</td></tr><tr><td>Queixa familiar</td><td colspan="3">${escapeHTML(patient.familyComplaint)}</td></tr></tbody></table></section>${reportSection("complaint", "Queixa principal por área")}${reportSection("plan", "Plano de ação")}${reportSection("result", "Resultados e evolução")}<section class="signatures">${guardians.map((guardian) => `<div class="signature">${escapeHTML(guardian.name)}<span>${escapeHTML(guardian.relation)} · CPF ${escapeHTML(guardian.cpf || "")}</span></div>`).join("")}<div class="signature">${escapeHTML(state.clinic.director)}<span>${escapeHTML(state.clinic.directorRole)}</span></div></section><footer class="report-footer">${escapeHTML(state.clinic.name)} · Documento gerado em ${dateLabel(new Date().toISOString().slice(0, 10))}</footer></article>`;
}

function emptyInline(text) { return `<div class="empty-inline">${escapeHTML(text)}</div>`; }
function emptyState(title, text, buttonLabel = "", target = "") { return `<div class="empty-state"><div class="empty-icon">◌</div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(text)}</p>${buttonLabel ? `<button class="button" type="button" data-nav="${target}">${escapeHTML(buttonLabel)}</button>` : ""}</div>`; }

function viewTemplate() {
  if (!ui.role) return loginTemplate();
  let content;
  if (ui.view === "professionals") content = professionalsView();
  else if (ui.view === "anamnese") content = anamneseView();
  else if (ui.view === "assignments") content = assignmentsView();
  else if (ui.view === "my-cases") content = myCasesView();
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
  document.querySelectorAll("[data-login]").forEach((button) => button.addEventListener("click", () => { ui.role = button.dataset.login; ui.view = "dashboard"; if (ui.role === "professional" && !getProfessional(ui.professionalId)) ui.professionalId = state.professionals[0]?.id; render(); }));
  document.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.nav)));
  document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", () => { ui.role = null; ui.view = "dashboard"; render(); }));
  document.querySelectorAll("[data-open-notices]").forEach((button) => button.addEventListener("click", () => { toast(ui.role === "admin" ? "Você possui encaminhamentos e atualizações para revisar." : "Estes são os casos encaminhados para seu perfil."); setView(ui.role === "admin" ? "assignments" : "my-cases"); }));
  document.querySelectorAll("[data-open-assignment]").forEach((button) => button.addEventListener("click", () => { ui.activeCaseId = button.dataset.openAssignment; setView("assignments"); }));
  document.querySelectorAll("[data-open-case]").forEach((button) => button.addEventListener("click", () => { ui.activeCaseId = button.dataset.openCase; ui.caseTab = "registro"; setView("case-detail"); }));
  document.querySelectorAll("[data-delete-professional]").forEach((button) => button.addEventListener("click", () => deleteProfessional(button.dataset.deleteProfessional)));
  document.querySelectorAll("[data-scroll-add]").forEach((button) => button.addEventListener("click", () => document.querySelector("#add-professional")?.scrollIntoView({ behavior: "smooth" })));
  document.querySelectorAll("[data-filter-specialty]").forEach((button) => button.addEventListener("click", () => { ui.filterSpecialty = button.dataset.filterSpecialty; render(); }));
  document.querySelectorAll("[data-case-tab]").forEach((button) => button.addEventListener("click", () => { ui.caseTab = button.dataset.caseTab; render(); }));
  document.querySelectorAll("[data-print-report]").forEach((button) => button.addEventListener("click", printReport));

  document.querySelector("#professional-switch")?.addEventListener("change", (event) => { ui.professionalId = event.target.value; render(); });
  document.querySelector("#professional-form")?.addEventListener("submit", submitProfessional);
  document.querySelector("#anamnese-form")?.addEventListener("submit", submitAnamnese);
  document.querySelector("#add-guardian")?.addEventListener("click", () => { document.querySelector("#guardians-container").insertAdjacentHTML("beforeend", guardianFields()); bindGuardianButtons(); });
  bindGuardianButtons();
  document.querySelectorAll('input[name="hypothesis"]').forEach((input) => input.addEventListener("change", toggleConditionalFields));
  document.querySelectorAll('input[name="diagnosis"]').forEach((input) => input.addEventListener("change", toggleConditionalFields));
  document.querySelector("#diagnosis-file")?.addEventListener("change", (event) => { document.querySelector("#file-name").textContent = event.target.files?.[0]?.name || "Nenhum arquivo selecionado"; });
  document.querySelectorAll('input[name="assigned-professional"]').forEach((input) => input.addEventListener("change", updateAssignmentUI));
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

function submitProfessional(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.professionals.push({ id: uid("prof"), name: data.get("name").trim(), specialty: data.get("specialty"), code: data.get("code").trim() });
  saveState(); render(); toast("Profissional cadastrado e disponível para encaminhamentos.");
}

function deleteProfessional(id) {
  const professional = getProfessional(id);
  if (!professional) return;
  const used = state.patients.some((patient) => patient.assignedIds.includes(id));
  if (used) return toast("Este profissional possui casos encaminhados e não pode ser removido nesta etapa.", true);
  state.professionals = state.professionals.filter((item) => item.id !== id);
  if (ui.professionalId === id) ui.professionalId = state.professionals[0]?.id;
  saveState(); render(); toast("Profissional removido da equipe.");
}

function submitAnamnese(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const guardians = [...document.querySelectorAll(".guardian-row")].map((row) => ({ relation: row.querySelector('[name="guardian-relation"]').value, name: row.querySelector('[name="guardian-name"]').value.trim(), cpf: row.querySelector('[name="guardian-cpf"]').value.trim(), phone: row.querySelector('[name="guardian-phone"]').value.trim(), email: row.querySelector('[name="guardian-email"]').value.trim() }));
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

function updateAssignmentUI() {
  document.querySelectorAll(".professional-option").forEach((option) => { const checked = option.querySelector("input").checked; option.classList.toggle("selected", checked); option.querySelector(".choice-check").textContent = checked ? "✓" : ""; });
  const labels = [...document.querySelectorAll('input[name="assigned-professional"]:checked')].map((input) => getProfessional(input.value)).filter(Boolean);
  const list = document.querySelector("#selection-list");
  if (list) list.innerHTML = labels.length ? labels.map((professional) => `<span><strong>${escapeHTML(professional.specialty)}</strong><br>${escapeHTML(professional.name)}</span>`).join("") : `<div class="empty-selection">Selecione pelo menos um profissional.</div>`;
}

function saveAssignment() {
  const patient = getPatient();
  if (!patient) return;
  const selected = [...document.querySelectorAll('input[name="assigned-professional"]:checked')].map((input) => input.value);
  if (!selected.length) return toast("Selecione ao menos um profissional para encaminhar o caso.", true);
  patient.assignedIds = selected; patient.status = "Em acompanhamento"; saveState(); render(); toast("Encaminhamento salvo. Os profissionais selecionados foram notificados.");
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
  state.sessions[patient.id] ||= {}; state.sessions[patient.id][professional.id] ||= [];
  state.sessions[patient.id][professional.id].push({ id: uid("session"), date: data.get("date"), objective: data.get("objective").trim(), status: data.get("status") });
  state.sessions[patient.id][professional.id].sort((a, b) => a.date.localeCompare(b.date));
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
