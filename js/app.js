/* Portal Clínico · Mente e Transformação (protótipo de demonstração) */

/* ---------- utilidades ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = iso => parseISO(iso).toLocaleDateString('pt-BR');
const fmtShort = iso => parseISO(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const fmtTs = ts => new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const initials = n => n.replace(/[^\p{L} ]/gu, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const avgOf = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const $ = (s, r = document) => r.querySelector(s);

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.3c2 .7 3.5 2.6 3.5 5.7"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  logout: '<path d="M10 4H5v16h5"/><path d="M15 8l4 4-4 4M19 12H9"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  edit: '<path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.5"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- estado e sessão ---------- */
const ui = { q: '', area: '', tab: 'resumo', gArea: '', gStatus: '', auditUser: '' };
const S = () => Store.state;
const getSession = () => { try { return sessionStorage.getItem('mt-user'); } catch (e) { return window.__mtUser || null; } };
const setSession = id => { try { id ? sessionStorage.setItem('mt-user', id) : sessionStorage.removeItem('mt-user'); } catch (e) { window.__mtUser = id; } };
const me = () => S().profs.find(p => p.id === getSession());
const prof = id => S().profs.find(p => p.id === id);
const patient = id => S().patients.find(p => p.id === id);
const goalById = id => S().goals.find(g => g.id === id);

/* ---------- regras de permissão ---------- */
const isAdmin = u => !!u?.perms.admin;
const canSeePatient = (u, p) => u.perms.admin || u.perms.verTodos || p.equipe.includes(u.id);
const visiblePatients = u => S().patients.filter(p => canSeePatient(u, p));
const canSeeGoal = (u, g) => u.perms.admin || u.perms.verOutras || g.area === u.area;
const visibleGoals = (u, pid) => S().goals.filter(g => (!pid || g.pacienteId === pid) && canSeePatient(u, patient(g.pacienteId)) && canSeeGoal(u, g));
const canEditGoal = (u, g) => u.perms.admin || (u.perms.editar && g.area === u.area);

function log(acao, texto, detalhe = '') {
  S().audit.unshift({ ts: Date.now(), por: getSession(), acao, texto, detalhe });
  S().audit = S().audit.slice(0, 300);
}

/* ---------- prazos e alertas ---------- */
const dueInfo = g => {
  const d = daysUntil(g.prazo);
  if (g.status === 'Concluído') return { cls: 'done', txt: 'Concluída', d };
  if (d < 0) return { cls: 'late', txt: `Atrasada há ${plural(-d, 'dia', 'dias')}`, d };
  if (d === 0) return { cls: 'soon', txt: 'Reavaliar hoje', d };
  if (d === 1) return { cls: 'soon', txt: 'Reavaliar amanhã', d };
  if (d <= ALERT_DAYS) return { cls: 'soon', txt: `Reavaliar em ${d} dias`, d };
  return { cls: 'ok', txt: `Em ${d} dias`, d };
};
const alertsFor = u => visibleGoals(u).filter(g => g.status !== 'Concluído' && daysUntil(g.prazo) <= ALERT_DAYS && (u.perms.admin || g.area === u.area || g.profId === u.id)).sort((a, b) => a.prazo.localeCompare(b.prazo));
const areaScore = (goals, area) => avgOf(goals.filter(g => g.area === area).map(g => g.progresso));
const radarAxes = gs => {
  let ks = Object.keys(AREAS).filter(a => gs.some(g => g.area === a));
  for (const a of Object.keys(AREAS)) if (ks.length < 3 && !ks.includes(a)) ks.push(a);
  return ks.map(a => ({ label: AREAS[a].label, short: AREAS[a].short, value: areaScore(gs, a), color: AREAS[a].color }));
};
const quarterOf = iso => { const d = parseISO(iso); return `T${Math.floor(d.getMonth() / 3) + 1}/${d.getFullYear()}`; };

/* ---------- toast e modal ---------- */
let toastTimer;
function toast(msg, kind = '') {
  const el = $('#toast-root');
  el.innerHTML = `<div class="toast ${kind}" role="status">${esc(msg)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.innerHTML = ''), 3600);
}
function openModal(html, wide = false) {
  $('#modal-root').innerHTML = `<div class="backdrop" data-act="close-modal"><div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  const f = $('#modal-root input:not([disabled]), #modal-root textarea:not([disabled])');
  document.body.classList.add('modal-open');
  if (!matchMedia('(max-width: 640px)').matches) f && f.focus();
}
const closeModal = () => { $('#modal-root').innerHTML = ''; document.body.classList.remove('modal-open'); };

/* ---------- componentes ---------- */
const avatar = (name, cls = '') => {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `<span class="avatar ${cls}" style="--h:${h}">${esc(initials(name))}</span>`;
};
const areaChip = a => `<span class="chip" style="--c:${AREAS[a].color}"><i></i>${AREAS[a].label}</span>`;
const statusPill = s => `<span class="pill st-${STATUS.indexOf(s)}">${s}</span>`;
const dueBadge = g => { const i = dueInfo(g); return `<span class="due ${i.cls}">${icon(i.cls === 'done' ? 'check' : 'clock')}${i.txt}</span>`; };
const bar = (v, color = 'var(--brand-deep)') => `<div class="bar" role="img" aria-label="${Math.round(v)}%"><div style="width:${v}%;background:${color}"></div></div>`;
const empty = (t, s = '') => `<div class="empty"><b>${t}</b>${s ? `<p>${s}</p>` : ''}</div>`;

/* ---------- casca do app ---------- */
const NAV = [
  { r: 'painel', ico: 'home', label: 'Painel' },
  { r: 'pacientes', ico: 'users', label: 'Pacientes' },
  { r: 'prazos', ico: 'calendar', label: 'Prazos' },
  { r: 'equipe', ico: 'shield', label: 'Equipe e permissões', admin: true },
  { r: 'auditoria', ico: 'file', label: 'Auditoria', admin: true },
  { r: 'proposta', ico: 'info', label: 'Sobre o portal' },
];

function shell(u, active, content) {
  const al = alertsFor(u);
  return `<div class="shell">
    <aside class="side" id="side">
      <a class="brand" href="#/painel"><img src="assets/icone-branco.png" alt=""><div><b>Mente e Transformação</b><span>PORTAL CLÍNICO</span></div></a>
      <nav aria-label="Principal">
        ${NAV.filter(n => !n.admin || isAdmin(u)).map(n => `<a href="#/${n.r}" class="${active === n.r ? 'on' : ''}" data-act="nav">${icon(n.ico)}<span>${n.label}</span>${n.r === 'prazos' && al.length ? `<em>${al.length}</em>` : ''}</a>`).join('')}
      </nav>
      <div class="side-foot">
        <div class="me">${avatar(u.nome, 'on-dark')}<div><b>${esc(u.nome.split(' ')[0])}</b><span>${esc(AREAS[u.area].label)}${isAdmin(u) ? ' · Admin' : ''}</span></div></div>
        <button class="ghost-btn" data-act="logout">${icon('logout')}Sair</button>
      </div>
    </aside>
    <div class="scrim" data-act="toggle-side"></div>
    <div class="main">
      <header class="top no-print">
        <span class="top-brand only-m"><img src="assets/icone-azul.png" alt=""><b>Mente e Transformação</b></span>
        <span class="demo-tag">${icon('info')}Demonstração<span class="hide-s"> · dados fictícios</span></span>
        <div class="bell-wrap">
          <button class="icon-btn" data-act="bell" aria-label="Notificações de prazos">${icon('bell')}${al.length ? `<em>${al.length}</em>` : ''}</button>
          <div class="bell-pop" id="bell-pop" hidden>
            <div class="bp-head"><b>Reavaliações próximas</b><span>${al.length ? plural(al.length, 'alerta', 'alertas') : 'tudo em dia'}</span></div>
            ${al.slice(0, 6).map(g => `<a href="#/paciente/${g.pacienteId}" data-act="bell"><span class="dot ${dueInfo(g).cls}"></span><div><b>${esc(patient(g.pacienteId).nome)}</b><span>${esc(truncate(g.titulo, 58))}</span><small>${dueInfo(g).txt} · ${fmt(g.prazo)}</small></div></a>`).join('') || '<p class="muted pad">Nenhum prazo nos próximos 15 dias.</p>'}
            <a class="bp-all" href="#/prazos" data-act="bell">Ver todos os prazos ${icon('arrow')}</a>
          </div>
        </div>
        <nav class="tabbar no-print" aria-label="Navegação rápida">
        ${[['painel', 'home', 'Painel'], ['pacientes', 'users', 'Pacientes'], ['prazos', 'calendar', 'Prazos']].map(([r, i, l]) => `<a href="#/${r}" class="${active === r ? 'on' : ''}">${icon(i)}<span>${l}</span>${r === 'prazos' && al.length ? `<em>${al.length}</em>` : ''}</a>`).join('')}
        <button data-act="toggle-side" class="${['painel', 'pacientes', 'prazos'].includes(active) ? '' : 'on'}" aria-label="Mais opções">${icon('menu')}<span>Mais</span></button>
    </nav>
      </header>
      <main class="content" id="content">${content}</main>
    </div>
  </div>`;
}
const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/* ---------- login ---------- */
function viewLogin() {
  return `<div class="login">
    <section class="login-hero">
      <div class="lh-in"><img src="assets/logo-horizontal-branco.png" alt="Mente e Transformação · Clínica" class="lh-logo">
      <p>Portal clínico multidisciplinar: um só lugar para acompanhar cada paciente, as metas da equipe e a evolução ao longo do trimestre.</p></div>
    </section>
    <section class="login-card">
      <div class="lc-in">
        <span class="demo-tag">${icon('info')}Demonstração · dados fictícios</span>
        <h1>Entrar no portal</h1>
        <p class="muted">Acesso restrito à equipe da clínica.</p>
        <form class="login-form" data-form="login" autocomplete="on" novalidate>
          <label>Usuário
            <input name="usuario" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="@usuario" required autofocus>
          </label>
          <label>Senha
            <span class="pw"><input name="senha" type="password" autocomplete="current-password" placeholder="Sua senha" required>
            <button type="button" class="pw-toggle" data-act="toggle-pw" aria-label="Mostrar senha">${icon('eye')}</button></span>
          </label>
          <p class="form-err" id="login-err" role="alert" hidden></p>
          <button class="btn block" type="submit">Entrar</button>
        </form>
      </div>
    </section>
  </div>`;
}

async function doLogin(form) {
  const err = $('#login-err'), btn = $('button[type=submit]', form);
  const fail = msg => { err.textContent = msg; err.hidden = false; };
  const wait = lockedFor();
  if (wait > 0) return fail(`Muitas tentativas. Tente de novo em ${wait}s.`);
  const fd = new FormData(form), usuario = normUser(fd.get('usuario')), senha = String(fd.get('senha') || '');
  if (!usuario || !senha) return fail('Informe usuário e senha.');
  btn.disabled = true;
  const hash = await sha256(`mt-portal:${usuario}:${senha}`);
  const acc = USERS.find(x => x.usuario === usuario && x.hash === hash);
  btn.disabled = false;
  if (!acc) { registerFailure(); const w = lockedFor(); return fail(w > 0 ? `Muitas tentativas. Tente de novo em ${w}s.` : 'Usuário ou senha incorretos.'); }
  clearFailures();
  setSession(acc.profId); log('Entrou no portal', 'Sessão iniciada'); Store.save();
  location.hash = '#/painel'; render();
  const n = alertsFor(me()).length; if (n) toast(`${plural(n, 'reavaliação próxima', 'reavaliações próximas')}. Veja em Prazos.`);
}

/* ---------- painel ---------- */
function viewPainel(u) {
  const goals = visibleGoals(u), pts = visiblePatients(u);
  const open = goals.filter(g => g.status !== 'Concluído');
  const al = alertsFor(u), late = open.filter(g => daysUntil(g.prazo) < 0), alLate = al.filter(g => daysUntil(g.prazo) < 0).length;
  const hr = new Date().getHours(), saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  const kpi = (n, l, c = '', href = '') => `<${href ? `a href="${href}"` : 'div'} class="kpi ${c}"><b>${n}</b><span>${l}</span></${href ? 'a' : 'div'}>`;
  return `
    <div class="page-head"><div><p class="eyebrow">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1>${saud}, ${esc(u.nome.split(' ')[0])}.</h1>
      <p class="muted">${al.length ? `${plural(al.length, 'reavaliação pede', 'reavaliações pedem')} atenção (${plural(alLate, 'vencida', 'vencidas')} e ${al.length - alLate} nos próximos ${ALERT_DAYS} dias).` : 'Nenhuma reavaliação pendente nos próximos dias.'}</p></div></div>
    <div class="kpis">
      ${kpi(pts.length, isAdmin(u) || u.perms.verTodos ? 'pacientes na clínica' : 'meus pacientes', '', '#/pacientes')}
      ${kpi(open.length, 'metas em andamento')}
      ${kpi(goals.filter(g => g.status === 'Concluído').length, 'metas concluídas', 'good')}
      ${kpi(al.filter(g => daysUntil(g.prazo) >= 0).length, `reavaliações em ${ALERT_DAYS} dias`, 'warn', '#/prazos')}
      ${kpi(late.length, 'prazos vencidos', late.length ? 'bad' : '', '#/prazos')}
    </div>
    <div class="grid-2">
      <section class="card"><div class="card-h"><h2>Próximas reavaliações</h2><a href="#/prazos" class="link">Ver todos ${icon('arrow')}</a></div>
        ${al.length ? `<ul class="rows">${al.slice(0, 5).map(g => `<li><a href="#/paciente/${g.pacienteId}">
            ${avatar(patient(g.pacienteId).nome)}<div class="grow"><b>${esc(patient(g.pacienteId).nome)}</b><span>${esc(truncate(g.titulo, 70))}</span></div>
            <div class="right">${dueBadge(g)}${areaChip(g.area)}</div></a></li>`).join('')}</ul>` : empty('Tudo em dia', 'Nenhum objetivo vence nos próximos dias.')}
      </section>
      <section class="card"><div class="card-h"><h2>Progresso por área</h2></div>
        <div class="area-bars">${Object.keys(AREAS).map(a => { const gs = goals.filter(g => g.area === a); return gs.length ? `<div><div class="ab-h"><span>${areaChip(a)}</span><b>${Math.round(areaScore(gs, a))}%</b></div>${bar(areaScore(gs, a), AREAS[a].color)}<small>${plural(gs.length, 'meta', 'metas')}</small></div>` : ''; }).join('') || empty('Sem metas visíveis')}</div>
      </section>
    </div>
    <div class="grid-2">
      <section class="card"><div class="card-h"><h2>Pacientes</h2><a href="#/pacientes" class="link">Abrir lista ${icon('arrow')}</a></div>
        <ul class="rows">${pts.slice(0, 4).map(p => { const gs = visibleGoals(u, p.id); return `<li><a href="#/paciente/${p.id}">${avatar(p.nome)}<div class="grow"><b>${esc(p.nome)}</b><span>${p.idade} anos · ${esc(p.condicoes.join(', '))}</span></div><div class="right w120">${bar(avgOf(gs.map(g => g.progresso)))}<small>${Math.round(avgOf(gs.map(g => g.progresso)))}% geral</small></div></a></li>`; }).join('') || ''}</ul>
      </section>
      <section class="card photo-card"><div class="pc-imgs"><img src="assets/foto-fachada.jpg" alt="Fachada da clínica"><img src="assets/foto-recepcao.jpg" alt="Recepção da clínica"></div>
        <div class="pc-txt"><b>Mente e Transformação</b><p class="muted">Psicologia, neuropsicologia, psicopedagogia, psicomotricidade e nutrição, trabalhando com um mesmo plano para cada criança.</p></div></section>
    </div>`;
}

/* ---------- pacientes ---------- */
function patientListHTML(u) {
  const q = ui.q.trim().toLowerCase();
  const list = visiblePatients(u).filter(p => (!q || (p.nome + ' ' + p.condicoes.join(' ')).toLowerCase().includes(q)) && (!ui.area || visibleGoals(u, p.id).some(g => g.area === ui.area)));
  if (!list.length) return empty('Nenhum paciente encontrado', 'Ajuste a busca ou o filtro de área.');
  return `<div class="p-grid">${list.map(p => {
    const gs = visibleGoals(u, p.id), over = gs.filter(g => dueInfo(g).cls === 'late').length, soon = gs.filter(g => dueInfo(g).cls === 'soon').length;
    return `<a class="p-card" href="#/paciente/${p.id}">
      <div class="pc-top">${avatar(p.nome, 'lg')}<div class="grow"><b>${esc(p.nome)}</b><span>${p.idade} anos</span></div>${ringChart(avgOf(gs.map(g => g.progresso)), 62)}</div>
      <div class="tags">${p.condicoes.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div>
      <div class="team">${p.equipe.map(id => `<span title="${esc(prof(id)?.nome || '')}" class="dotc" style="background:${AREAS[prof(id)?.area]?.color || '#999'}"></span>`).join('')}<small>${plural(p.equipe.length, 'profissional', 'profissionais')}</small></div>
      <div class="pc-foot">${over ? `<span class="due late">${icon('clock')}${plural(over, 'atrasada', 'atrasadas')}</span>` : ''}${soon ? `<span class="due soon">${icon('clock')}${plural(soon, 'reavaliação', 'reavaliações')} em breve</span>` : ''}${!over && !soon ? `<span class="due ok">${icon('check')}Em dia</span>` : ''}</div>
    </a>`;
  }).join('')}</div>`;
}
function viewPacientes(u) {
  return `<div class="page-head"><div><h1>Pacientes</h1><p class="muted">${u.perms.admin || u.perms.verTodos ? 'Todos os pacientes da clínica.' : 'Pacientes em que você faz parte da equipe.'}</p></div>
    ${isAdmin(u) ? `<button class="btn" data-act="new-patient">${icon('plus')}Novo paciente</button>` : ''}</div>
    <div class="filters"><label class="search">${icon('search')}<input type="search" id="q" placeholder="Buscar por nome ou condição" value="${esc(ui.q)}" autocomplete="off"></label>
      <div class="seg" id="area-filter"><button class="${!ui.area ? 'on' : ''}" data-act="area" data-v="">Todas as áreas</button>${Object.keys(AREAS).map(a => `<button class="${ui.area === a ? 'on' : ''}" data-act="area" data-v="${a}">${AREAS[a].label}</button>`).join('')}</div></div>
    <div id="plist">${patientListHTML(u)}</div>`;
}

/* ---------- paciente ---------- */
function viewPaciente(u, id, tab) {
  const p = patient(id);
  if (!p || !canSeePatient(u, p)) return `<div class="page-head"><h1>Paciente não encontrado</h1></div>${empty('Sem acesso', 'Este paciente não existe ou você não tem permissão para vê-lo.')}<a class="btn ghost" href="#/pacientes">${icon('back')}Voltar</a>`;
  const gs = visibleGoals(u, id), hidden = S().goals.filter(g => g.pacienteId === id).length - gs.length;
  const tabs = [['resumo', 'Resumo'], ['metas', 'Metas'], ['mapa', 'Mapa visual'], ['historico', 'Histórico']];
  const body = { resumo: tabResumo, metas: tabMetas, mapa: tabMapa, historico: tabHistorico }[tab] || tabResumo;
  return `<a class="crumb" href="#/pacientes">${icon('back')}Pacientes</a>
    <div class="p-head">
      ${avatar(p.nome, 'xl')}
      <div class="grow"><h1>${esc(p.nome)}</h1>
        <p class="muted">${p.idade} anos · acompanhamento desde ${fmt(p.desde)}</p>
        <div class="tags">${p.condicoes.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div></div>
      <div class="team-stack">${p.equipe.map(pid => `<div class="ts-row" title="${esc(prof(pid)?.nome)}">${avatar(prof(pid).nome)}<span>${esc(prof(pid).nome.split(' ')[0])}</span></div>`).join('')}</div>
      <div class="p-actions no-print">
        ${u.perms.exportar ? `<a class="btn ghost" href="#/paciente/${p.id}/relatorio">${icon('print')}Relatório para os pais</a>` : `<span class="locked">${icon('lock')}Exportação restrita</span>`}
      </div>
    </div>
    ${hidden ? `<div class="notice">${icon('lock')}${plural(hidden, 'meta de outra área está oculta', 'metas de outras áreas estão ocultas')} para o seu perfil.</div>` : ''}
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<a role="tab" class="${tab === k ? 'on' : ''}" href="#/paciente/${id}/${k}">${l}</a>`).join('')}</div>
    ${body(u, p, gs)}`;
}

function tabResumo(u, p, gs) {
  if (!gs.length) return empty('Sem metas visíveis');
  const areas = Object.keys(AREAS).filter(a => gs.some(g => g.area === a));
  const next = gs.filter(g => g.status !== 'Concluído').sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 4);
  const counts = STATUS.map(s => gs.filter(g => g.status === s).length);
  return `<div class="grid-2 wide-l">
    <section class="card"><div class="card-h"><h2>Evolução multidisciplinar</h2><a class="link" href="#/paciente/${p.id}/mapa">Mapa completo ${icon('arrow')}</a></div>
      <div class="radar-wrap">${radarChart(radarAxes(gs))}</div></section>
    <div class="stack">
      <section class="card"><div class="card-h"><h2>Situação das metas</h2></div>
        <div class="st-row">${STATUS.map((s, i) => `<div><b>${counts[i]}</b>${statusPill(s)}</div>`).join('')}</div></section>
      <section class="card"><div class="card-h"><h2>Por área</h2></div>
        <div class="area-bars">${areas.map(a => `<div><div class="ab-h">${areaChip(a)}<b>${Math.round(areaScore(gs, a))}%</b></div>${bar(areaScore(gs, a), AREAS[a].color)}</div>`).join('')}</div></section>
    </div></div>
  <section class="card"><div class="card-h"><h2>Próximas reavaliações</h2></div>
    ${next.length ? `<ul class="rows">${next.map(g => `<li><button class="rowbtn" data-act="open-goal" data-id="${g.id}"><div class="grow"><b>${esc(truncate(g.titulo, 90))}</b><span>${esc(AREAS[g.area].label)} · ${esc(prof(g.profId)?.nome || '')}</span></div><div class="right">${dueBadge(g)}<small>${fmt(g.prazo)}</small></div></button></li>`).join('')}</ul>` : empty('Todas as metas concluídas')}</section>`;
}

function tabMetas(u, p, gs) {
  const list = gs.filter(g => (!ui.gArea || g.area === ui.gArea) && (!ui.gStatus || g.status === ui.gStatus)).sort((a, b) => a.area.localeCompare(b.area) || a.prazo.localeCompare(b.prazo));
  const mayAdd = u.perms.admin || u.perms.editar;
  return `<div class="filters"><div class="seg"><button class="${!ui.gArea ? 'on' : ''}" data-act="g-area" data-v="">Todas</button>${Object.keys(AREAS).filter(a => gs.some(g => g.area === a)).map(a => `<button class="${ui.gArea === a ? 'on' : ''}" data-act="g-area" data-v="${a}">${AREAS[a].label}</button>`).join('')}</div>
    <select class="select" data-change="g-status" aria-label="Filtrar por status"><option value="">Todos os status</option>${STATUS.map(s => `<option ${ui.gStatus === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    ${mayAdd ? `<button class="btn" data-act="new-goal" data-p="${p.id}">${icon('plus')}Nova meta</button>` : ''}</div>
  ${list.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Objetivo</th><th>Área</th><th>Status</th><th>Progresso</th><th>Reavaliação</th><th></th></tr></thead><tbody>
    ${list.map(g => `<tr data-act="open-goal" data-id="${g.id}" tabindex="0">
      <td data-l="Objetivo"><b>${esc(g.titulo)}</b><small>${esc(g.metodologia)}</small></td>
      <td data-l="Área">${areaChip(g.area)}<small>${esc(prof(g.profId)?.nome || '')}</small></td>
      <td data-l="Status">${statusPill(g.status)}</td>
      <td data-l="Progresso" class="w140">${bar(g.progresso, AREAS[g.area].color)}<small>${g.progresso}%</small></td>
      <td data-l="Reavaliação">${dueBadge(g)}<small>${fmt(g.prazo)} · ${quarterOf(g.prazo)}</small></td>
      <td class="act">${canEditGoal(u, g) ? icon('edit') : icon('lock', 'muted')}</td></tr>`).join('')}
  </tbody></table></div>` : empty('Nenhuma meta com esse filtro')}`;
}

function tabMapa(u, p, gs) {
  if (!gs.length) return empty('Sem metas visíveis');
  const areas = Object.keys(AREAS).filter(a => gs.some(g => g.area === a));
  return `<div class="grid-2 wide-l">
    <section class="card"><div class="card-h"><h2>Mapa por área</h2></div><div class="radar-wrap">${radarChart(radarAxes(gs))}</div></section>
    <section class="card"><div class="card-h"><h2>Quem acompanha</h2></div>
      <ul class="rows">${areas.map(a => { const pr = [...new Set(gs.filter(g => g.area === a).map(g => g.profId))]; return `<li><div class="row-s">${ringChart(areaScore(gs, a), 56, AREAS[a].color)}<div class="grow"><b>${AREAS[a].label}</b><span>${pr.map(id => esc(prof(id)?.nome || '')).join(', ')}</span></div></div></li>`; }).join('')}</ul></section></div>
  <section class="card"><div class="card-h"><h2>Linha do tempo do trimestre</h2><span class="muted sm">Barra = início até a reavaliação · preenchimento = progresso</span></div>${ganttChart(gs)}</section>`;
}

function tabHistorico(u, p, gs) {
  const ev = [];
  gs.forEach(g => g.historico.forEach(h => ev.push({ ...h, g })));
  ev.sort((a, b) => b.data.localeCompare(a.data));
  if (!ev.length) return empty('Sem registros ainda');
  return `<section class="card"><div class="card-h"><h2>Registro de evolução</h2></div><ol class="timeline">
    ${ev.slice(0, 40).map(e => `<li><span class="tl-dot" style="background:${AREAS[e.g.area].color}"></span><div><b>${esc(truncate(e.g.titulo, 80))}</b>
      <span>${AREAS[e.g.area].label} · ${esc(prof(e.por)?.nome || '')}</span><small>${fmt(e.data)} · ${e.status} · ${e.progresso}%</small></div></li>`).join('')}</ol></section>`;
}

/* ---------- relatório para os pais (impressão) ---------- */
function viewRelatorio(u, id) {
  const p = patient(id);
  if (!p || !canSeePatient(u, p)) return viewPaciente(u, id, 'resumo');
  if (!u.perms.exportar) return `<div class="page-head"><h1>Exportação restrita</h1></div>${empty('Sem permissão', 'Peça ao administrador para liberar a exportação de relatórios.')}`;
  const gs = visibleGoals(u, id), areas = Object.keys(AREAS).filter(a => gs.some(g => g.area === a));
  const simple = { 'Pendente': 'A iniciar', 'Em progresso': 'Em andamento', 'Concluído': 'Alcançado' };
  return `<div class="report-bar no-print"><a class="btn ghost" href="#/paciente/${id}/resumo">${icon('back')}Voltar</a>
      <button class="btn" data-act="print-report" data-id="${id}">${icon('print')}Imprimir / salvar PDF</button></div>
    <article class="report">
      <header><img src="assets/icone-azul.png" alt=""><div><b>Mente e Transformação</b><span>CLÍNICA</span></div><div class="r-date">Emitido em ${new Date().toLocaleDateString('pt-BR')}</div></header>
      <h1>Relatório de acompanhamento</h1>
      <p class="r-sub"><b>${esc(p.nome)}</b> · ${p.idade} anos · acompanhamento desde ${fmt(p.desde)}</p>
      <div class="r-radar">${radarChart(radarAxes(gs), 360)}
        <p>O gráfico mostra o quanto cada área avançou nas metas combinadas para este trimestre. Cada área é cuidada por um profissional da equipe, e todas trabalham juntas.</p></div>
      ${areas.map(a => `<section class="r-area"><h2><i style="background:${AREAS[a].color}"></i>${AREAS[a].label}<span>${Math.round(areaScore(gs, a))}%</span></h2>
        ${gs.filter(g => g.area === a).map(g => `<div class="r-goal"><div><b>${esc(g.titulo)}</b><small>${simple[g.status]} · próxima reavaliação em ${fmt(g.prazo)}</small></div>${bar(g.progresso, AREAS[a].color)}<span>${g.progresso}%</span></div>`).join('')}
        <p class="r-resp">Responsável: ${[...new Set(gs.filter(g => g.area === a).map(g => prof(g.profId)))].map(x => esc(x.nome) + (x.registro ? ' (' + esc(x.registro) + ')' : '')).join(', ')}</p></section>`).join('')}
      <footer>Documento confidencial, de uso exclusivo da família. As metas são revistas a cada trimestre e podem mudar conforme a evolução da criança.</footer>
    </article>`;
}

/* ---------- prazos ---------- */
function viewPrazos(u) {
  const open = visibleGoals(u).filter(g => g.status !== 'Concluído').sort((a, b) => a.prazo.localeCompare(b.prazo));
  const groups = [['Vencidos', g => daysUntil(g.prazo) < 0, 'late'], [`Próximos ${ALERT_DAYS} dias`, g => daysUntil(g.prazo) >= 0 && daysUntil(g.prazo) <= ALERT_DAYS, 'soon'], ['Em até 30 dias', g => daysUntil(g.prazo) > ALERT_DAYS && daysUntil(g.prazo) <= 30, 'ok'], ['Depois', g => daysUntil(g.prazo) > 30, 'ok']];
  return `<div class="page-head"><div><h1>Prazos de reavaliação</h1><p class="muted">As metas têm ciclo de três meses. O portal avisa ${ALERT_DAYS} dias antes de cada reavaliação.</p></div></div>
    ${groups.map(([t, f, c]) => { const l = open.filter(f); return `<section class="card"><div class="card-h"><h2><span class="dot ${c}"></span>${t}</h2><span class="muted sm">${l.length}</span></div>
      ${l.length ? `<ul class="rows">${l.map(g => `<li><a href="#/paciente/${g.pacienteId}/metas">${avatar(patient(g.pacienteId).nome)}<div class="grow"><b>${esc(patient(g.pacienteId).nome)}</b><span>${esc(truncate(g.titulo, 80))}</span></div><div class="right">${dueBadge(g)}<small>${fmt(g.prazo)} · ${esc(AREAS[g.area].label)}</small></div></a></li>`).join('')}</ul>` : `<p class="muted pad">Nada por aqui.</p>`}</section>`; }).join('')}`;
}

/* ---------- equipe e permissões ---------- */
const PERM_COLS = [['verTodos', 'Ver todos os pacientes'], ['verOutras', 'Ver metas de outras áreas'], ['editar', 'Editar a própria área'], ['exportar', 'Exportar relatórios'], ['admin', 'Administrador']];
function viewEquipe(u) {
  if (!isAdmin(u)) return viewPainel(u);
  const n = S().profs.length;
  return `<div class="page-head"><div><h1>Equipe e permissões</h1><p class="muted">Defina o que cada profissional pode ver e editar. Cada alteração fica registrada na auditoria.</p></div>
      <button class="btn" data-act="new-prof" ${n >= MAX_PROFISSIONAIS ? 'disabled' : ''}>${icon('plus')}Adicionar profissional</button></div>
    <section class="card"><div class="cap"><b>${n} de ${MAX_PROFISSIONAIS} profissionais</b>${bar((n / MAX_PROFISSIONAIS) * 100)}</div>
      <div class="team-grid">${S().profs.map(p => `<div class="t-card">${avatar(p.nome, 'lg')}<div><b>${esc(p.nome)}</b><span>${esc(p.role)}</span><small>${p.registro ? esc(p.registro) + ' · ' : ''}${plural(S().patients.filter(x => x.equipe.includes(p.id)).length, 'paciente', 'pacientes')}</small></div>${areaChip(p.area)}</div>`).join('')}</div></section>
    <section class="card"><div class="card-h"><h2>Matriz de permissões</h2></div>
      <div class="table-wrap"><table class="tbl perm"><thead><tr><th>Profissional</th>${PERM_COLS.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>
      ${S().profs.map(p => `<tr><td><b>${esc(p.nome)}</b><small>${esc(AREAS[p.area].label)}</small></td>${PERM_COLS.map(([k, l]) => {
        const lock = p.id === u.id && k === 'admin';
        return `<td data-l="${l}"><label class="switch"><input type="checkbox" data-change="perm" data-id="${p.id}" data-k="${k}" ${p.perms[k] ? 'checked' : ''} ${lock ? 'disabled title="Você não pode remover o próprio acesso de administrador"' : ''}><span></span></label></td>`; }).join('')}</tr>`).join('')}
      </tbody></table></div>
      <p class="muted sm pad">Administradores têm acesso total. Os demais só editam metas da própria área, e nunca apagam o registro de outros colegas.</p></section>
    <section class="card"><div class="card-h"><h2>Dados da demonstração</h2></div><p class="muted">As alterações feitas aqui ficam salvas só neste navegador.</p>
      <button class="btn ghost" data-act="reset">Restaurar dados originais</button></section>`;
}

/* ---------- auditoria ---------- */
function viewAuditoria(u) {
  if (!isAdmin(u)) return viewPainel(u);
  const list = S().audit.filter(a => !ui.auditUser || a.por === ui.auditUser);
  return `<div class="page-head"><div><h1>Auditoria</h1><p class="muted">Quem fez o quê, e quando. O registro não pode ser editado.</p></div></div>
    <div class="filters"><select class="select" data-change="audit-user" aria-label="Filtrar por profissional"><option value="">Todos os profissionais</option>${S().profs.map(p => `<option value="${p.id}" ${ui.auditUser === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></div>
    <section class="card">${list.length ? `<ul class="audit">${list.map(a => `<li><span class="a-dot"></span><div class="grow"><b>${esc(prof(a.por)?.nome || 'Sistema')}</b> <em>${esc(a.acao)}</em><span>${esc(a.texto)}</span>${a.detalhe ? `<small>${esc(a.detalhe)}</small>` : ''}</div><time>${fmtTs(a.ts)}</time></li>`).join('')}</ul>` : empty('Sem registros')}</section>`;
}

/* ---------- sobre o portal / proposta ---------- */
function viewProposta() {
  const f = [
    ['users', 'Painel centralizado de pacientes', 'Em vez de pastas soltas, a equipe entra no perfil da criança e vê o resumo do progresso de todas as áreas.', '#/pacientes'],
    ['edit', 'Formulários clínicos estruturados', 'Cada terapeuta preenche objetivo, metodologia, prazo e status em campos fixos. Ninguém apaga sem querer o texto de um colega.', '#/paciente/p1/metas'],
    ['map', 'Mapa visual automático', 'As evoluções viram um gráfico por área e uma linha do tempo, prontos para decisão da equipe e para o relatório entregue aos pais.', '#/paciente/p1/mapa'],
    ['shield', 'Permissões e auditoria', 'A administradora define o que cada profissional vê e edita. Todo ajuste fica registrado, com autor e horário.', '#/equipe'],
    ['bell', 'Alertas de reavaliação', 'Como as metas têm ciclo de 3 meses, o portal avisa quando a reavaliação está chegando ou venceu.', '#/prazos'],
  ];
  return `<div class="page-head"><div><p class="eyebrow">Sobre este portal</p><h1>Do Google Drive a um portal clínico próprio</h1>
    <p class="muted lead">Esta é uma demonstração navegável. Todo o conteúdo usa pacientes fictícios e a equipe real mapeada da clínica.</p></div></div>
    <div class="feat-grid">${f.map(([i, t, d, h], n) => `<a class="feat" href="${h}"><span class="fi">${icon(i)}</span><small>0${n + 1}</small><b>${t}</b><p>${d}</p><span class="link">Ver na demo ${icon('arrow')}</span></a>`).join('')}</div>
    <section class="card"><div class="card-h"><h2>Drive compartilhado × portal</h2></div>
      <div class="table-wrap"><table class="tbl cmp"><thead><tr><th></th><th>Pasta no Drive</th><th>Portal da clínica</th></tr></thead><tbody>
        <tr><td>Quem edita o quê</td><td>Todos editam tudo</td><td>Cada área edita só o que é seu</td></tr>
        <tr><td>Visão da criança</td><td>Vários documentos separados</td><td>Um painel com todas as áreas</td></tr>
        <tr><td>Registro de mudanças</td><td>Histórico de versões do arquivo</td><td>Auditoria por campo, com autor e data</td></tr>
        <tr><td>Relatório para os pais</td><td>Montado à mão</td><td>Gerado a partir dos dados, em um clique</td></tr>
        <tr><td>Prazos de reavaliação</td><td>Depende de lembrar</td><td>Alerta automático</td></tr>
      </tbody></table></div></section>
    <section class="card"><div class="card-h"><h2>O que falta para a versão de produção</h2></div>
      <ul class="check">
        <li>Login real por e-mail e senha (com verificação em duas etapas) para cada profissional</li>
        <li>Banco de dados em servidor seguro, com backup diário</li>
        <li>Adequação à LGPD: dados de saúde de crianças são dados sensíveis, exigem consentimento dos responsáveis e criptografia</li>
        <li>Perfis e permissões validados no servidor, não só na tela</li>
        <li>Hospedagem com domínio da clínica e certificado de segurança</li>
      </ul></section>
    <div class="photo-strip"><img src="assets/foto-recepcao.jpg" alt="Recepção"><img src="assets/foto-sala.jpg" alt="Sala de apoio"><img src="assets/foto-fachada.jpg" alt="Fachada"></div>`;
}

/* ---------- modais: metas ---------- */
function profOptions(area, sel) {
  return S().profs.filter(p => p.area === area).map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.nome)}</option>`).join('');
}
function goalModal(u, gid, pid) {
  const g = gid ? goalById(gid) : null;
  const p = patient(g ? g.pacienteId : pid);
  const editable = g ? canEditGoal(u, g) : true;
  const area = g ? g.area : (isAdmin(u) ? (p.equipe.length ? prof(p.equipe[0]).area : 'psicologia') : u.area);
  const v = g || { titulo: '', metodologia: '', status: 'Pendente', progresso: 0, inicio: offDay(0), prazo: offDay(90), notas: '', profId: u.id, historico: [] };
  const dis = editable ? '' : 'disabled';
  const lockArea = !isAdmin(u);
  return `<form data-form="goal" data-id="${g ? g.id : ''}" data-p="${p.id}">
    <div class="m-head"><div><p class="eyebrow">${esc(p.nome)}</p><h2>${g ? (editable ? 'Editar meta' : 'Meta de outra área') : 'Nova meta trimestral'}</h2></div><button type="button" class="icon-btn" data-act="close-modal" aria-label="Fechar">${icon('x')}</button></div>
    ${editable ? '' : `<div class="notice">${icon('lock')}Somente leitura. Esta meta pertence a ${esc(AREAS[g.area].label)} e só ${esc(prof(g.profId)?.nome || 'o profissional responsável')} ou a administração podem alterá-la.</div>`}
    <div class="f-grid">
      <label>Área ${lockArea ? `<span class="lk">${icon('lock')}bloqueada</span>` : ''}<select name="area" data-change="goal-area" ${lockArea || !editable ? 'disabled' : ''}>${Object.keys(AREAS).map(a => `<option value="${a}" ${a === area ? 'selected' : ''}>${AREAS[a].label}</option>`).join('')}</select></label>
      <label>Responsável<select name="profId" ${!isAdmin(u) || !editable ? 'disabled' : ''}>${profOptions(area, v.profId)}</select></label>
      <label class="full">Objetivo trimestral<textarea name="titulo" rows="2" required minlength="8" maxlength="220" ${dis} placeholder="O que a criança deve conseguir fazer até a reavaliação?">${esc(v.titulo)}</textarea></label>
      <label class="full">Metodologia<input name="metodologia" required maxlength="140" ${dis} value="${esc(v.metodologia)}" placeholder="Ex.: circuitos psicomotores lúdicos"></label>
      <label>Status<select name="status" ${dis}>${STATUS.map(s => `<option ${s === v.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label>Progresso <output id="pg-out">${v.progresso}%</output><input type="range" name="progresso" min="0" max="100" step="5" value="${v.progresso}" data-range ${dis}></label>
      <label>Início<input type="date" name="inicio" required value="${v.inicio}" ${dis}></label>
      <label>Reavaliação em<input type="date" name="prazo" required value="${v.prazo}" ${dis}></label>
      <label class="full">Observações da equipe<textarea name="notas" rows="2" maxlength="400" ${dis} placeholder="Opcional">${esc(v.notas)}</textarea></label>
    </div>
    ${g && g.historico.length ? `<details class="hist"><summary>Evolução registrada (${g.historico.length})</summary><ul>${[...g.historico].reverse().map(h => `<li><b>${fmt(h.data)}</b> ${h.status} · ${h.progresso}% <span>${esc(prof(h.por)?.nome || '')}</span></li>`).join('')}</ul></details>` : ''}
    <div class="m-foot"><button type="button" class="btn ghost" data-act="close-modal">${editable ? 'Cancelar' : 'Fechar'}</button>${editable ? `<button class="btn" type="submit">${g ? 'Salvar alterações' : 'Criar meta'}</button>` : ''}</div>
  </form>`;
}

function saveGoal(form) {
  const u = me(), fd = new FormData(form), id = form.dataset.id, p = patient(form.dataset.p);
  const val = k => (fd.get(k) ?? '').toString().trim();
  const g = id ? goalById(id) : null;
  if (g && !canEditGoal(u, g)) return toast('Você não tem permissão para editar esta meta.', 'err');
  const area = isAdmin(u) ? val('area') : (g ? g.area : u.area);
  const data = {
    area, profId: isAdmin(u) ? val('profId') : (g ? g.profId : u.id),
    titulo: val('titulo'), metodologia: val('metodologia'), status: val('status'),
    progresso: Math.max(0, Math.min(100, parseInt(val('progresso'), 10) || 0)), inicio: val('inicio'), prazo: val('prazo'), notas: val('notas'),
  };
  if (data.titulo.length < 8) return toast('Descreva o objetivo com um pouco mais de detalhe.', 'err');
  if (data.prazo < data.inicio) return toast('A reavaliação precisa ser depois do início.', 'err');
  if (data.status === 'Concluído') data.progresso = 100;
  if (data.status === 'Pendente' && data.progresso > 0) data.status = 'Em progresso';
  if (data.status === 'Em progresso' && data.progresso === 100) data.status = 'Concluído';

  if (g) {
    const labels = { titulo: 'objetivo', metodologia: 'metodologia', status: 'status', progresso: 'progresso', prazo: 'reavaliação', notas: 'observações' };
    const diff = Object.keys(labels).filter(k => g[k] !== data[k]).map(k => k === 'progresso' ? `progresso: ${g.progresso}% → ${data.progresso}%` : k === 'status' ? `status: ${g.status} → ${data.status}` : k === 'prazo' ? `reavaliação: ${fmt(g.prazo)} → ${fmt(data.prazo)}` : `${labels[k]} alterado`);
    if (g.progresso !== data.progresso || g.status !== data.status) g.historico.push({ data: isoOf(todayDate()), progresso: data.progresso, status: data.status, por: u.id });
    Object.assign(g, data);
    if (diff.length) log('Atualizou meta', `${p.nome} · ${truncate(g.titulo, 60)}`, diff.join(' · '));
    toast(diff.length ? 'Meta atualizada.' : 'Nenhuma alteração.');
  } else {
    const ng = { id: 'g' + Date.now(), pacienteId: p.id, ...data, historico: [{ data: isoOf(todayDate()), progresso: data.progresso, status: data.status, por: data.profId }] };
    S().goals.push(ng);
    if (!p.equipe.includes(data.profId)) p.equipe.push(data.profId);
    log('Criou meta', `${p.nome} · ${truncate(data.titulo, 60)}`);
    toast('Meta criada.');
  }
  Store.save(); closeModal(); render();
}

function newPatientModal() {
  return `<form data-form="patient"><div class="m-head"><h2>Novo paciente</h2><button type="button" class="icon-btn" data-act="close-modal" aria-label="Fechar">${icon('x')}</button></div>
    <div class="f-grid"><label class="full">Nome (use apenas nome e inicial)<input name="nome" required maxlength="40" placeholder="Ex.: Ana B."></label>
    <label>Idade<input type="number" name="idade" min="0" max="99" required></label>
    <label>Condições (separe por vírgula)<input name="condicoes" maxlength="80" placeholder="TEA, TDAH"></label></div>
    <p class="muted sm">Dica de privacidade: na versão de produção, dados completos ficam protegidos e visíveis só à equipe do caso.</p>
    <div class="m-foot"><button type="button" class="btn ghost" data-act="close-modal">Cancelar</button><button class="btn" type="submit">Cadastrar</button></div></form>`;
}
function newProfModal() {
  return `<form data-form="prof"><div class="m-head"><h2>Adicionar profissional</h2><button type="button" class="icon-btn" data-act="close-modal" aria-label="Fechar">${icon('x')}</button></div>
    <div class="f-grid"><label class="full">Nome completo<input name="nome" required maxlength="60"></label>
    <label>Área<select name="area">${Object.keys(AREAS).map(a => `<option value="${a}">${AREAS[a].label}</option>`).join('')}</select></label>
    <label>Registro (CRP, CRN…)<input name="registro" maxlength="30"></label>
    <label class="full">Função<input name="role" maxlength="60" placeholder="Ex.: Psicóloga clínica"></label></div>
    <p class="muted sm">Fica cadastrado com acesso básico (só pacientes da própria equipe e só a própria área), mas ainda sem login próprio: por enquanto só a Dra. Vânia entra no portal.</p>
    <div class="m-foot"><button type="button" class="btn ghost" data-act="close-modal">Cancelar</button><button class="btn" type="submit">Adicionar</button></div></form>`;
}

/* ---------- roteamento ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'painel';
  const [name, a, b] = h.split('/');
  return { name, a, b };
}
function render() {
  const root = $('#app'), u = me();
  if (!u) { root.innerHTML = viewLogin(); document.title = 'Entrar · Mente e Transformação'; return; }
  const { name, a, b } = route();
  let active = name, html;
  if (name === 'paciente' && b === 'relatorio') { root.innerHTML = `<div class="print-shell">${viewRelatorio(u, a)}</div>`; document.title = `Relatório · ${patient(a)?.nome || ''}`; window.scrollTo(0, 0); return; }
  switch (name) {
    case 'pacientes': html = viewPacientes(u); break;
    case 'paciente': ui.tab = ['resumo', 'metas', 'mapa', 'historico'].includes(b) ? b : 'resumo'; html = viewPaciente(u, a, ui.tab); active = 'pacientes'; break;
    case 'prazos': html = viewPrazos(u); break;
    case 'equipe': html = viewEquipe(u); break;
    case 'auditoria': html = viewAuditoria(u); break;
    case 'proposta': html = viewProposta(); break;
    default: html = viewPainel(u); active = 'painel';
  }
  root.innerHTML = shell(u, active, html);
  document.title = 'Portal · Mente e Transformação';
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!t) { const pop = $('#bell-pop'); if (pop && !e.target.closest('.bell-wrap')) pop.hidden = true; return; }
  const act = t.dataset.act, u = me();
  switch (act) {
    case 'toggle-pw': { const i = $('input[name=senha]'); i.type = i.type === 'password' ? 'text' : 'password'; t.setAttribute('aria-label', i.type === 'password' ? 'Mostrar senha' : 'Ocultar senha'); break; }
    case 'logout': setSession(null); location.hash = ''; render(); break;
    case 'nav': document.body.classList.remove('side-open'); break;
    case 'toggle-side': document.body.classList.toggle('side-open'); break;
    case 'bell': { const pop = $('#bell-pop'); if (t.classList.contains('icon-btn')) pop.hidden = !pop.hidden; else pop.hidden = true; break; }
    case 'close-modal': if (e.target === t || t.tagName === 'BUTTON') closeModal(); break;
    case 'area': ui.area = t.dataset.v; render(); break;
    case 'g-area': ui.gArea = t.dataset.v; render(); break;
    case 'open-goal': openModal(goalModal(u, t.dataset.id), true); break;
    case 'new-goal': openModal(goalModal(u, null, t.dataset.p), true); break;
    case 'new-patient': openModal(newPatientModal()); break;
    case 'new-prof': openModal(newProfModal()); break;
    case 'reset': Store.reset(); setSession(null); location.hash = ''; render(); toast('Dados da demonstração restaurados.'); break;
    case 'print-report': { const p = patient(t.dataset.id); log('Exportou relatório', `${p.nome} · Relatório para os pais`); Store.save(); window.print(); break; }
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-act]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { ui.q = e.target.value; $('#plist').innerHTML = patientListHTML(me()); }
  if (e.target.matches('[data-range]')) $('#pg-out').textContent = e.target.value + '%';
});
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset.change, u = me();
  if (k === 'g-status') { ui.gStatus = t.value; render(); }
  if (k === 'audit-user') { ui.auditUser = t.value; render(); }
  if (k === 'goal-area') { const sel = $('select[name=profId]', t.form); sel.innerHTML = profOptions(t.value); }
  if (k === 'perm') {
    const p = prof(t.dataset.id), key = t.dataset.k;
    p.perms[key] = t.checked;
    if (key === 'admin' && t.checked) Object.keys(p.perms).forEach(x => (p.perms[x] = true));
    log('Alterou permissão', p.nome, `${PERM_COLS.find(c => c[0] === key)[1].toLowerCase()}: ${t.checked ? 'sim' : 'não'}`);
    Store.save(); toast('Permissão atualizada.'); render();
  }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form, fd = new FormData(f);
  if (kind === 'login') return doLogin(f);
  if (kind === 'goal') return saveGoal(f);
  if (kind === 'patient') {
    const p = { id: 'p' + Date.now(), nome: fd.get('nome').trim(), idade: parseInt(fd.get('idade'), 10), condicoes: fd.get('condicoes').split(',').map(s => s.trim()).filter(Boolean), desde: isoOf(todayDate()), equipe: [] };
    S().patients.push(p); log('Cadastrou paciente', p.nome); Store.save(); closeModal(); location.hash = `#/paciente/${p.id}/metas`; toast('Paciente cadastrado. Adicione a primeira meta.');
  }
  if (kind === 'prof') {
    if (S().profs.length >= MAX_PROFISSIONAIS) return toast('Limite de profissionais atingido.', 'err');
    const n = { id: 'u' + Date.now(), nome: fd.get('nome').trim(), area: fd.get('area'), role: fd.get('role').trim() || AREAS[fd.get('area')].label, registro: fd.get('registro').trim(), perfil: 'terapeuta', perms: { verTodos: false, verOutras: true, editar: true, exportar: true, admin: false } };
    S().profs.push(n); log('Adicionou profissional', n.nome); Store.save(); closeModal(); render(); toast('Profissional adicionado.');
  }
});
window.addEventListener('hashchange', () => { closeModal(); document.body.classList.remove('side-open'); render(); window.scrollTo(0, 0); });

Store.load();
render();
