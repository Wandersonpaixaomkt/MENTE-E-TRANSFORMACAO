/* Dados de demonstração + camada de persistência (localStorage).
   Todos os pacientes são FICTÍCIOS. Datas são relativas a hoje, para que
   os alertas de prazo sempre apareçam na demonstração. */

const AREAS = {
  psicologia:        { label: 'Psicologia',        short: 'Psicologia', color: '#5E6A96' },
  neuropsicologia:   { label: 'Neuropsicologia',   short: 'Neuropsic.', color: '#8A6BB1' },
  psicopedagogia:    { label: 'Psicopedagogia',    short: 'Psicoped.', color: '#C4863F' },
  psicomotricidade:  { label: 'Psicomotricidade',  short: 'Psicomotr.', color: '#3F9484' },
  nutricao:          { label: 'Nutrição',          short: 'Nutrição', color: '#B25B4B' },
  fonoaudiologia:    { label: 'Fonoaudiologia',    short: 'Fono', color: '#3E86B0' },
};
const STATUS = ['Pendente', 'Em progresso', 'Concluído'];
const MAX_PROFISSIONAIS = 20;
const ALERT_DAYS = 15;
const STORE_KEY = 'mt-portal-demo-v2';
// agenda: atendimentos de 1 hora, das 08:00 às 18:00
const SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const DURACAO_MIN = 60;

const pad = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayDate = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
const offDay = n => { const d = todayDate(); d.setDate(d.getDate() + n); return isoOf(d); };
const parseISO = s => new Date(s + 'T12:00:00');
const daysUntil = s => Math.round((parseISO(s) - todayDate()) / 86400000);

function seedState() {
  const P = (id, nome, area, role, registro, perfil, atuacao = '') => ({
    id, nome, area, role, registro, perfil, atuacao,
    perms: perfil === 'admin'
      ? { verTodos: true, verOutras: true, editar: true, exportar: true, admin: true }
      : { verTodos: false, verOutras: true, editar: true, exportar: true, admin: false },
  });
  const profs = [
    P('vania',    'Vânia Ferreira Garcia', 'psicologia',       'Psicóloga · Psicopedagoga especialista em Autismo', 'CRP 10/10102', 'admin'),
    P('audrey',   'Audrey Andrade',        'neuropsicologia',  'Neuropsicologia',                'CRP 10/06517',   'terapeuta'),
    P('moniele',  'Moniele Matos',         'psicopedagogia',   'Psicopedagoga clínica · esp. em neuropsicologia', '', 'terapeuta'),
    P('nessia',   'Néssia Arruda',         'psicomotricidade', 'Psicomotricista',                '',               'terapeuta'),
    P('laiane',   'Laiane de Paula',       'nutricao',         'Nutricionista',                  'CRN 7/17265',    'terapeuta'),
    P('gabrielly','Gabrielly Lima',        'nutricao',         'Nutricionista · clínica e hospitalar', 'CRN-7 17462/P', 'terapeuta',
      'Avaliação nutricional, planejamento alimentar individualizado e estratégias para equilíbrio do sistema nervoso. Especialização em andamento em Nutrição em Neuropsiquiatria.'),
    P('lorrayne', 'Lorrayne Kendaly Luna Costa', 'neuropsicologia', 'Neuropsicóloga',          'CRP 10/11303',   'terapeuta',
      'Avaliação neuropsicológica (TEA, TDAH, deficiência intelectual, dislexia, discalculia e transtornos do humor), psicoterapia infantil a partir dos 2 anos e orientação parental. Pós-graduanda em Intervenção ABA para Autismo e Deficiência Intelectual.'),
    P('eduardo',  'Eduardo Vilhena',       'psicologia',       'Psicólogo · TCC',                'CRP 10/11278',   'terapeuta',
      'Terapia Cognitivo-Comportamental, avaliação psicológica e acompanhamento em saúde mental, do diagnóstico ao tratamento.'),
    P('psicanalista', 'Psicóloga e psicanalista (nome a informar)', 'psicologia', 'Psicóloga · Psicanalista', '', 'terapeuta',
      'Escuta psicanalítica para adolescentes, adultos, idosos e casais: ansiedade, depressão e conflitos emocionais. Especialista em Saúde Mental.'),
    P('costa',    'Dr. Costa',             'fonoaudiologia',   'Fonoaudiólogo · Terapeuta ABA',  '',               'terapeuta',
      'Comunicação e linguagem, motricidade orofacial e dificuldades alimentares em crianças e adultos neurodivergentes, com princípios da ABA e abordagem sensório-motora.'),
  ];

  const patientsRaw = [
    ['p1', 'Davi M.',   5,  ['TEA', 'Ecolalia'],                 -120],
    ['p2', 'Helena S.', 8,  ['TDAH'],                            -90],
    ['p3', 'Miguel A.', 6,  ['Síndrome de Down'],                -150],
    ['p4', 'Alice R.',  4,  ['Paralisia cerebral'],              -100],
    ['p5', 'Lucas P.',  11, ['TDAH', 'Ansiedade'],               -70],
    ['p6', 'Sofia C.',  7,  ['Seletividade alimentar', 'Ecolalia'], -60],
  ];

  // [paciente, área, profissional, objetivo, metodologia, status, progresso, início, prazo]
  const G = [
    ['p1','psicologia','vania','Ampliar o contato visual e a atenção compartilhada em 3 contextos (casa, clínica e escola)','Intervenção naturalista com brincadeira estruturada','Em progresso',55,-60,9],
    ['p1','psicologia','vania','Reduzir episódios de desorganização nas transições de rotina','Rotina visual e antecipação com pranchas','Em progresso',35,-60,40],
    ['p1','neuropsicologia','audrey','Concluir a avaliação de linguagem, atenção e funções executivas','Bateria neuropsicológica adaptada à idade','Em progresso',70,-45,5],
    ['p1','psicomotricidade','nessia','Executar sequência de 3 movimentos (pular, correr, equilibrar) com autonomia','Circuitos psicomotores lúdicos','Pendente',10,-10,55],
    ['p1','nutricao','gabrielly','Introduzir 4 novos alimentos no prato (seletividade alimentar)','Exposição gradual e refeição em família','Em progresso',50,-75,-3],
    ['p1','psicopedagogia','moniele','Reconhecer e nomear as letras do próprio nome','Jogos de alfabetização multissensorial','Concluído',100,-90,-10],

    ['p2','psicologia','vania','Aplicar estratégias de autorregulação em 4 de 5 situações escolares','TCC infantil com treino de autorregulação','Em progresso',60,-50,14],
    ['p2','psicopedagogia','moniele','Manter o foco em tarefa escrita por 15 minutos','Atividades com pausas estruturadas e reforço positivo','Em progresso',45,-50,20],
    ['p2','neuropsicologia','audrey','Reavaliar atenção sustentada e memória operacional','Testes de atenção e memória operacional','Pendente',0,-5,30],
    ['p2','nutricao','gabrielly','Organizar 5 refeições ao dia com lanches escolares equilibrados','Educação nutricional com a família','Concluído',100,-80,-5],

    ['p3','psicomotricidade','nessia','Subir e descer escadas alternando os pés, sem apoio','Estimulação motora com circuitos','Em progresso',65,-55,7],
    ['p3','psicologia','vania','Participar de brincadeira simbólica com outra criança por 5 minutos','Ludoterapia e mediação de interação','Em progresso',40,-55,35],
    ['p3','psicopedagogia','moniele','Associar numerais de 1 a 5 a quantidades','Material concreto e jogos de contagem','Em progresso',50,-40,22],
    ['p3','nutricao','gabrielly','Garantir ingestão adequada de fibras e hidratação diária','Plano alimentar com apoio da família','Pendente',5,-7,50],

    ['p4','psicomotricidade','nessia','Manter o controle de tronco sentada por 10 minutos durante atividade','Estimulação sensório-motora','Em progresso',45,-70,-1],
    ['p4','psicomotricidade','nessia','Alcançar e segurar objetos com a mão dominante','Treino de preensão com brinquedos adaptados','Em progresso',30,-70,25],
    ['p4','psicologia','vania','Orientação familiar: estabelecer rotina de estimulação em casa','Psicoeducação e acompanhamento da família','Em progresso',70,-60,12],
    ['p4','neuropsicologia','audrey','Mapear o perfil cognitivo inicial','Avaliação adaptada (observação e escalas de desenvolvimento)','Em progresso',80,-30,3],
    ['p4','nutricao','gabrielly','Adequar a consistência dos alimentos e prevenir engasgos','Plano alimentar com texturas graduais','Concluído',100,-85,-20],

    ['p5','psicopedagogia','moniele','Resolver problemas de raciocínio lógico com 70% de acertos','Reforço de matemática com foco em raciocínio lógico','Em progresso',55,-45,16],
    ['p5','psicologia','vania','Identificar gatilhos de ansiedade e usar 2 técnicas de manejo','TCC e treino de respiração','Em progresso',65,-45,28],
    ['p5','neuropsicologia','audrey','Realizar a devolutiva da avaliação neuropsicológica com a família','Entrevista de devolutiva e relatório','Pendente',20,-3,12],
    ['p5','nutricao','laiane','Reduzir sintomas de gastrite com ajustes alimentares','Reeducação alimentar e saúde digestiva','Em progresso',40,-40,-6],

    ['p6','nutricao','gabrielly','Aceitar 6 alimentos de novas texturas nas refeições','Dessensibilização alimentar gradual','Em progresso',35,-40,4],
    ['p6','psicologia','vania','Substituir 50% das falas ecolálicas por frases funcionais','Mediação de linguagem funcional em brincadeira','Em progresso',30,-50,18],
    ['p6','psicomotricidade','nessia','Participar 10 minutos de brincadeira de correr e pular com outras crianças','Brincadeiras motoras em grupo','Pendente',15,-20,45],
  ];

  const goals = G.map((g, i) => {
    const [pid, area, prof, titulo, metodologia, status, progresso, s, e] = g;
    const inicio = offDay(s), prazo = offDay(e);
    const hist = [{ data: inicio, progresso: 0, status: 'Pendente', por: prof }];
    if (progresso > 0) {
      hist.push({ data: offDay(Math.round(s / 2)), progresso: Math.round(progresso * 0.5), status: 'Em progresso', por: prof });
      hist.push({ data: offDay(Math.min(-1, Math.round(s / 5))), progresso, status, por: prof });
    }
    return { id: 'g' + (i + 1), pacienteId: pid, area, profId: prof, titulo, metodologia, status, progresso, inicio, prazo, notas: '', historico: hist };
  });

  const patients = patientsRaw.map(([id, nome, idade, condicoes, desde]) => ({
    id, nome, idade, condicoes, desde: offDay(desde),
    equipe: [...new Set(goals.filter(g => g.pacienteId === id).map(g => g.profId))],
  }));

  const now = Date.now(), H = 3600000;
  const audit = [
    { ts: now - 2 * H,   por: 'gabrielly', acao: 'Atualizou meta',  texto: 'Davi M. · Introduzir 4 novos alimentos', detalhe: 'progresso: 40% → 50%' },
    { ts: now - 5 * H,   por: 'audrey',    acao: 'Atualizou meta',  texto: 'Alice R. · Mapear o perfil cognitivo inicial', detalhe: 'progresso: 65% → 80%' },
    { ts: now - 26 * H,  por: 'vania',     acao: 'Exportou relatório', texto: 'Helena S. · Relatório para os pais', detalhe: '' },
    { ts: now - 30 * H,  por: 'nessia',    acao: 'Atualizou meta',  texto: 'Miguel A. · Subir e descer escadas', detalhe: 'progresso: 50% → 65%' },
    { ts: now - 52 * H,  por: 'moniele',   acao: 'Criou meta',      texto: 'Lucas P. · Resolver problemas de raciocínio lógico', detalhe: '' },
    { ts: now - 75 * H,  por: 'vania',     acao: 'Alterou permissão', texto: 'Laiane de Paula', detalhe: 'ver todos os pacientes: não' },
  ];

  // exemplos de agenda (datas relativas a hoje)
  const indisp = [
    { id: 'i1', profId: 'lorrayne', data: offDay(2), diaTodo: true, inicio: '', fim: '', motivo: 'Exemplo: curso' },
    { id: 'i2', profId: 'nessia', data: offDay(1), diaTodo: false, inicio: '13:00', fim: '18:00', motivo: 'Exemplo: compromisso à tarde' },
  ];
  const atend = [
    { id: 'a1', pacienteId: 'p1', profId: 'vania', data: offDay(3), hora: '09:00', status: 'Agendado', por: 'vania' },
    { id: 'a2', pacienteId: 'p6', profId: 'gabrielly', data: offDay(4), hora: '14:00', status: 'Agendado', por: 'vania' },
  ];
  const contas = USERS.map(c => ({ ...c }));

  return { v: 2, profs, patients, goals, audit, indisp, atend, contas };
}

const Store = {
  state: null,
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) { this.state = JSON.parse(raw); return; }
    } catch (e) { /* storage indisponível: segue em memória */ }
    this.state = seedState();
  },
  save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); } catch (e) { /* ignora */ } },
  reset() { this.state = seedState(); this.save(); },
};

/* ---------- acesso ----------
   Contas iniciais. A senha da administradora não fica no código, só o hash (SHA-256).
   As contas dos profissionais são geradas pela administradora e ficam em Store.state.contas;
   para que ela possa consultar a senha, essa senha fica guardada no navegador junto do hash.
   ATENÇÃO: sem servidor, isto é apenas uma barreira de tela. Qualquer pessoa com acesso aos
   arquivos ou ao navegador consegue contorná-la. Autenticação segura exige back-end. */
const USERS = [
  { usuario: 'dravania', profId: 'vania', hash: 'c117add62f69b58a461d8e4550203b6e314d282d579291a933fbf813f12af3c4' },
];
const normUser = v => String(v || '').trim().replace(/^@+/, '').toLowerCase();

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

/* bloqueio temporário após 5 senhas erradas */
const LOCK_KEY = 'mt-login-lock';
const readLock = () => { try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { n: 0, until: 0 }; } catch (e) { return window.__mtLock || { n: 0, until: 0 }; } };
const writeLock = v => { try { localStorage.setItem(LOCK_KEY, JSON.stringify(v)); } catch (e) { window.__mtLock = v; } };
const lockedFor = () => Math.max(0, Math.ceil((readLock().until - Date.now()) / 1000));
function registerFailure() { const l = readLock(); l.n += 1; if (l.n >= 5) { l.until = Date.now() + 30000; l.n = 0; } writeLock(l); }
const clearFailures = () => writeLock({ n: 0, until: 0 });
