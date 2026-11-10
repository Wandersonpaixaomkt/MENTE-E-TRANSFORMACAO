/* Gráficos em SVG/HTML, sem dependências. */

function radarChart(axes, size = 340) {
  // axes: [{label, value 0-100, color}]
  const n = axes.length, c = size / 2, R = size / 2 - 62;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [c + Math.cos(a) * R * (v / 100), c + Math.sin(a) * R * (v / 100)];
  };
  const ring = v => axes.map((_, i) => pt(i, v).join(',')).join(' ');
  const poly = axes.map((a, i) => pt(i, a.value).join(',')).join(' ');
  const labels = axes.map((a, i) => {
    const [x, y] = pt(i, 122);
    const anchor = Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end';
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" class="rd-label"><tspan class="full">${esc(a.label)}</tspan><tspan class="short">${esc(a.short || a.label)}</tspan></text>
            <text x="${x.toFixed(1)}" y="${(y + 18).toFixed(1)}" text-anchor="${anchor}" class="rd-val">${Math.round(a.value)}%</text>`;
  }).join('');
  return `<svg class="radar" viewBox="-80 0 ${size + 160} ${size}" role="img" aria-label="Mapa de progresso por área: ${axes.map(a => `${a.label} ${Math.round(a.value)}%`).join(', ')}">
    ${[25, 50, 75, 100].map(v => `<polygon points="${ring(v)}" class="rd-ring"/>`).join('')}
    ${axes.map((_, i) => { const [x, y] = pt(i, 100); return `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rd-axis"/>`; }).join('')}
    <polygon points="${poly}" class="rd-shape"/>
    ${axes.map((a, i) => { const [x, y] = pt(i, a.value); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${a.color}" stroke="#fff" stroke-width="2"/>`; }).join('')}
    ${labels}
  </svg>`;
}

function ringChart(value, size = 84, color = 'var(--brand-deep)') {
  const r = size / 2 - 7, C = 2 * Math.PI * r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${Math.round(value)}%">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke="${color}" stroke-dasharray="${(C * value / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="50%" dy=".35em" text-anchor="middle" class="ring-txt" style="font-size:${Math.round(size * 0.21)}px">${Math.round(value)}%</text>
  </svg>`;
}

/* Linha do tempo (Gantt) das metas: início → prazo de reavaliação, com preenchimento por progresso */
function ganttChart(goals) {
  if (!goals.length) return '';
  const days = s => Math.round(parseISO(s) / 86400000);
  const today = days(isoOf(todayDate()));
  let min = Math.min(...goals.map(g => days(g.inicio)), today) - 3;
  let max = Math.max(...goals.map(g => days(g.prazo)), today) + 3;
  const span = max - min;
  const pos = d => ((d - min) / span) * 100;

  const months = [];
  const dMin = new Date(min * 86400000 + 43200000), dMax = new Date(max * 86400000 + 43200000);
  for (let d = new Date(dMin.getFullYear(), dMin.getMonth() + 1, 1); d <= dMax; d.setMonth(d.getMonth() + 1)) {
    const t = Math.round(new Date(d.getFullYear(), d.getMonth(), 1, 12).getTime() / 86400000);
    months.push({ p: pos(t), label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') });
  }
  const rows = [...goals].sort((a, b) => a.area.localeCompare(b.area) || a.prazo.localeCompare(b.prazo)).map(g => {
    const l = pos(days(g.inicio)), w = Math.max(2, pos(days(g.prazo)) - l);
    const color = AREAS[g.area].color, d = daysUntil(g.prazo);
    const late = g.status !== 'Concluído' && d < 0;
    return `<div class="gt-row">
      <div class="gt-label"><i style="background:${color}"></i><span>${esc(g.titulo)}</span></div>
      <div class="gt-track" style="--today:${pos(today).toFixed(2)}%">
        ${months.map(m => `<s style="left:${m.p.toFixed(2)}%"></s>`).join('')}
        <div class="gt-bar${late ? ' late' : ''}" style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%;--c:${color}" title="${esc(AREAS[g.area].label)} · ${g.progresso}% · reavaliação ${fmt(g.prazo)}">
          <div class="gt-fill" style="width:${g.progresso}%"></div>
          <span class="gt-pct">${g.progresso}%</span>
        </div>
        <div class="gt-flag" style="left:${pos(days(g.prazo)).toFixed(2)}%" title="Reavaliação ${fmt(g.prazo)}"></div>
      </div>
    </div>`;
  }).join('');
  return `<div class="gantt" aria-label="Linha do tempo das metas">
    <div class="gt-head"><div></div><div class="gt-months">${months.map(m => `<span style="left:${m.p.toFixed(2)}%">${m.label}</span>`).join('')}</div></div>
    ${rows}
    <div class="gt-legend"><span><i class="lg-today"></i>Hoje</span><span><i class="lg-flag"></i>Reavaliação</span><span><i class="lg-late"></i>Prazo vencido</span></div>
  </div>`;
}
