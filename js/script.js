// ===== Estado (por enquanto local, depois vem da API Java) =====

const STORAGE_KEY = 'controle-estudos:v1';

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  // dados fake iniciais, só pra visualizar o produto funcionando
  return {
    materias: [
      { id: 'm1', materia: 'Direito Constitucional', assunto: 'Controle de Constitucionalidade' },
      { id: 'm2', materia: 'Direito Constitucional', assunto: 'Direitos Fundamentais' },
      { id: 'm3', materia: 'Português', assunto: 'Concordância Verbal' },
      { id: 'm4', materia: 'Português', assunto: 'Interpretação de Texto' },
      { id: 'm5', materia: 'Raciocínio Lógico', assunto: 'Proposições e Tabela Verdade' },
      { id: 'm6', materia: 'Informática', assunto: 'Redes e Segurança' },
    ],
    sessoes: [
      { materiaId: 'm1', total: 10, acertos: 4, data: '2026-08-10' },
      { materiaId: 'm2', total: 8, acertos: 7, data: '2026-08-11' },
      { materiaId: 'm3', total: 12, acertos: 10, data: '2026-08-12' },
      { materiaId: 'm4', total: 10, acertos: 5, data: '2026-08-13' },
      { materiaId: 'm5', total: 6, acertos: 3, data: '2026-08-14' },
      { materiaId: 'm6', total: 10, acertos: 9, data: '2026-08-15' },
    ]
  };
}

let state = loadState();

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ===== Tabs =====

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(tab.dataset.tab).classList.add('active');

    if (tab.dataset.tab === 'dashboard') renderDashboard();
  });
});

// ===== Cadastro de matéria/assunto =====

const formMateria = document.getElementById('form-materia');
const listaMaterias = document.getElementById('lista-materias');

formMateria.addEventListener('submit', (e) => {
  e.preventDefault();
  const materia = document.getElementById('input-materia').value.trim();
  const assunto = document.getElementById('input-assunto').value.trim();
  if (!materia || !assunto) return;

  state.materias.push({ id: 'm' + Date.now(), materia, assunto });
  saveState();
  formMateria.reset();
  renderMaterias();
  renderSelectMateria();
});

function renderMaterias(){
  listaMaterias.innerHTML = '';
  if (state.materias.length === 0){
    listaMaterias.innerHTML = '<li class="empty">nenhuma matéria cadastrada ainda</li>';
    return;
  }
  state.materias.forEach(m => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${m.materia} — ${m.assunto}</span>
      <button type="button" class="btn-delete" data-id="${m.id}" aria-label="Remover ${m.materia} — ${m.assunto}">×</button>
    `;
    listaMaterias.appendChild(li);
  });
}

listaMaterias.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-delete');
  if (!btn) return;

  const id = btn.dataset.id;
  const materia = state.materias.find(m => m.id === id);
  const temSessoes = state.sessoes.some(s => s.materiaId === id);

  if (temSessoes && !confirm(`"${materia.materia} — ${materia.assunto}" tem sessões registradas. Remover mesmo assim? As sessões dessa matéria também serão apagadas.`)) {
    return;
  }

  state.materias = state.materias.filter(m => m.id !== id);
  state.sessoes = state.sessoes.filter(s => s.materiaId !== id);
  saveState();

  renderMaterias();
  renderSelectMateria();
  renderSessoes();
});

// ===== Registrar sessão =====

const formSessao = document.getElementById('form-sessao');
const selectMateria = document.getElementById('select-materia');
const listaSessoes = document.getElementById('lista-sessoes');

function renderSelectMateria(){
  selectMateria.innerHTML = '';
  state.materias.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.materia} — ${m.assunto}`;
    selectMateria.appendChild(opt);
  });
}

document.getElementById('input-data').valueAsDate = new Date();

formSessao.addEventListener('submit', (e) => {
  e.preventDefault();
  const materiaId = selectMateria.value;
  const total = parseInt(document.getElementById('input-total').value, 10);
  const acertos = parseInt(document.getElementById('input-acertos').value, 10);
  const data = document.getElementById('input-data').value;

  if (!materiaId || !total || acertos > total) return;

  state.sessoes.push({ materiaId, total, acertos, data });
  saveState();
  formSessao.reset();
  document.getElementById('input-data').valueAsDate = new Date();
  renderSessoes();
});

function renderSessoes(){
  listaSessoes.innerHTML = '';
  const ultimas = [...state.sessoes].reverse().slice(0, 6);
  if (ultimas.length === 0){
    listaSessoes.innerHTML = '<li class="empty">nenhuma sessão registrada ainda</li>';
    return;
  }
  ultimas.forEach(s => {
    const m = state.materias.find(m => m.id === s.materiaId);
    const pct = Math.round((s.acertos / s.total) * 100);
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${m ? m.materia + ' — ' + m.assunto : 'matéria removida'}</span>
      <span class="ficha-meta">${s.acertos}/${s.total} · ${pct}% · ${s.data}</span>
    `;
    listaSessoes.appendChild(li);
  });
}

// ===== Dashboard / mapa de calor =====

function calcularDesempenho(){
  // agrupa sessões por assunto (materiaId) e calcula % médio de acerto
  const porAssunto = {};
  state.sessoes.forEach(s => {
    if (!porAssunto[s.materiaId]) porAssunto[s.materiaId] = { totalQuestoes: 0, totalAcertos: 0 };
    porAssunto[s.materiaId].totalQuestoes += s.total;
    porAssunto[s.materiaId].totalAcertos += s.acertos;
  });

  return state.materias.map(m => {
    const dados = porAssunto[m.id];
    const pct = dados ? Math.round((dados.totalAcertos / dados.totalQuestoes) * 100) : null;
    return { ...m, pct };
  });
}

function corPorPercentual(pct){
  // interpola entre vermelho (fraco) -> âmbar -> branco-giz (forte)
  if (pct === null) return 'rgba(242,239,230,0.08)';
  const stops = [
    { p: 0, c: [196, 84, 74] },
    { p: 50, c: [217, 164, 65] },
    { p: 100, c: [247, 243, 227] }
  ];
  let a = stops[0], b = stops[1];
  if (pct > 50) { a = stops[1]; b = stops[2]; }
  const range = b.p - a.p || 1;
  const t = (pct - a.p) / range;
  const rgb = a.c.map((v, i) => Math.round(v + (b.c[i] - v) * t));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function renderDashboard(){
  const desempenho = calcularDesempenho();
  const heatmapEl = document.getElementById('heatmap');
  heatmapEl.innerHTML = '';

  const porMateria = {};
  desempenho.forEach(d => {
    if (!porMateria[d.materia]) porMateria[d.materia] = [];
    porMateria[d.materia].push(d);
  });

  Object.entries(porMateria).forEach(([materia, assuntos]) => {
    const row = document.createElement('div');
    row.className = 'heatmap-row';

    const label = document.createElement('div');
    label.className = 'heatmap-materia';
    label.textContent = materia;

    const cellsWrap = document.createElement('div');
    cellsWrap.className = 'heatmap-cells';

    assuntos.forEach(a => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.background = corPorPercentual(a.pct);
      cell.title = `${a.assunto}: ${a.pct === null ? 'sem dados' : a.pct + '%'}`;
      cell.innerHTML = `
        <span class="cell-pct">${a.pct === null ? '—' : a.pct + '%'}</span>
        <span class="cell-label">${a.assunto}</span>
      `;
      cellsWrap.appendChild(cell);
    });

    row.appendChild(label);
    row.appendChild(cellsWrap);
    heatmapEl.appendChild(row);
  });

  // stats
  const comDados = desempenho.filter(d => d.pct !== null);
  document.getElementById('stat-sessoes').textContent = state.sessoes.length;

  const mediaGeral = state.sessoes.length
    ? Math.round(
        (state.sessoes.reduce((acc, s) => acc + s.acertos, 0) /
         state.sessoes.reduce((acc, s) => acc + s.total, 0)) * 100
      )
    : 0;
  document.getElementById('stat-media').textContent = mediaGeral + '%';

  const maisFraco = comDados.sort((a, b) => a.pct - b.pct)[0];
  document.getElementById('stat-fraco').textContent = maisFraco ? maisFraco.assunto : '—';
}

// ===== Init =====

renderMaterias();
renderSelectMateria();
renderSessoes();
renderDashboard();