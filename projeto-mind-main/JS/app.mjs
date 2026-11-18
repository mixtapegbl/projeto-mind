import {
  BASELINE, METRICS, SCENARIOS, evaluateTelemetry, createIncident, formatMetric,
} from './engine.mjs';

const STORAGE_KEY = 'bradesco-mind:lab:v2';
const MAX_HISTORY = 50;
const MAX_EVENTS = 100;
const STEP_MS = 850;
const $ = id => document.getElementById(id);
const datetime = () => new Date().toISOString();
const localDateTime = iso => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
const localTime = iso => new Date(iso).toLocaleTimeString('pt-BR', { hour12: false });

function readStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!data || data.version !== 2 || !Array.isArray(data.incidents) || !Array.isArray(data.events)) return { incidents: [], events: [] };
    return { incidents: data.incidents.slice(0, MAX_HISTORY), events: data.events.slice(0, MAX_EVENTS) };
  } catch { return { incidents: [], events: [] }; }
}

const previous = readStorage();
const state = {
  telemetry: { ...BASELINE },
  samples: Object.fromEntries(METRICS.map(metric => [metric.key, Array(10).fill(BASELINE[metric.key])])),
  incidents: previous.incidents,
  events: previous.events,
  activeId: null,
  phase: 'idle',
  timers: [],
  viewedIncidentId: null,
};

// Um reload interrompe uma simulação em andamento: o histórico explicita essa interrupção.
let hadInterrupted = false;
for (const incident of state.incidents) {
  if (incident.status === 'awaiting' || incident.status === 'mitigating' || incident.status === 'rejected') {
    incident.status = 'interrupted';
    incident.updatedAt = datetime();
    incident.actions = Array.isArray(incident.actions) ? incident.actions : [];
    incident.actions.push({ type: 'interrupted', timestamp: incident.updatedAt, detail: 'Demonstração encerrada/recarregada sem validação final.' });
    hadInterrupted = true;
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, incidents: state.incidents, events: state.events }));
  } catch {
    // Persistência é opcional: a simulação continua funcional em navegação privada.
  }
}

function addEvent(kind, title, detail, incidentId = null) {
  const event = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: datetime(), kind, title, detail, incidentId };
  state.events.unshift(event);
  state.events = state.events.slice(0, MAX_EVENTS);
  persist();
  renderEvents();
}

function setFeedback(message, active = false) {
  $('simulationFeedback').textContent = message;
  $('simulationFeedback').classList.toggle('active', active);
}

function currentIncident() {
  return state.incidents.find(incident => incident.id === state.activeId) ?? null;
}

function appendSample(snapshot) {
  state.telemetry = { ...snapshot };
  for (const metric of METRICS) {
    const samples = state.samples[metric.key];
    samples.push(snapshot[metric.key]);
    if (samples.length > 22) samples.shift();
  }
  renderTelemetry();
}

function renderSparkline(metric) {
  const values = state.samples[metric.key];
  const points = values.map((value, index) => {
    const x = values.length > 1 ? (index / (values.length - 1)) * 106 + 1 : 1;
    const y = 33 - Math.min(1, Math.max(0, value / metric.max)) * 30;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  $(`spark-${metric.key}`).querySelector('path').setAttribute('d', points);
}

function renderTelemetry() {
  const analysis = evaluateTelemetry(state.telemetry);
  const healthText = { healthy: 'Operacional', warning: 'Atenção', critical: 'Incidente crítico', unknown: 'Indeterminado' };
  $('healthLabel').textContent = healthText[analysis.severity];
  $('healthDot').className = `big-status-dot ${analysis.severity === 'healthy' ? '' : analysis.severity}`;
  $('riskValue').replaceChildren(document.createTextNode(String(analysis.riskScore ?? '—')));
  const riskScale = document.createElement('span');
  riskScale.textContent = '/100';
  $('riskValue').append(riskScale);
  $('statusHelper').textContent = analysis.severity === 'healthy' ? 'Nenhuma anomalia ativa' : analysis.explanation;
  $('latestCollection').textContent = `Coleta: ${localTime(datetime())}`;

  for (const metric of METRICS) {
    const observed = analysis.observations.find(item => item.key === metric.key);
    const status = observed.status;
    const card = document.querySelector(`[data-metric="${metric.key}"]`);
    card.classList.toggle('warning', status === 'warning');
    card.classList.toggle('critical', status === 'critical');
    $(`value-${metric.key}`).textContent = formatMetric(state.telemetry[metric.key], metric);
    $(`status-${metric.key}`).textContent = { healthy: 'NORMAL', warning: 'ATENÇÃO', critical: 'CRÍTICO', unknown: 'SEM DADOS' }[status];
    renderSparkline(metric);
  }
  renderDecision();
}

function renderDecision() {
  const incident = currentIncident();
  const analysis = evaluateTelemetry(state.telemetry);
  const chip = $('decisionChip');
  const marker = $('decisionMarker');
  const heading = $('analysisTitle');
  const description = $('analysisDescription');
  const signals = $('signalsList');
  const recommendation = $('recommendationBox');
  const decisionButtons = $('decisionButtons');
  chip.className = 'chip chip-neutral';
  marker.className = 'decision-marker';
  marker.textContent = '✓';
  signals.replaceChildren();

  if (!incident && analysis.severity === 'healthy') {
    chip.textContent = 'ACOMPANHANDO';
    heading.textContent = 'Nenhum problema em aberto';
    description.textContent = analysis.explanation;
    appendListText(signals, 'API PIX e banco de dados estão abaixo dos limites de atenção.');
    recommendation.hidden = true;
    return;
  }

  if (!incident) {
    chip.textContent = analysis.severity === 'critical' ? 'CRÍTICO' : 'ANALISANDO';
    chip.className = `chip chip-${analysis.severity === 'critical' ? 'critical' : 'warning'}`;
    marker.classList.add(analysis.severity === 'critical' ? 'critical' : 'warning');
    marker.textContent = '!';
    heading.textContent = 'Desvio de telemetria identificado';
    description.textContent = 'Os números estão mudando. Aguarde o sistema comparar os indicadores.';
    for (const signal of [...analysis.critical, ...analysis.warnings]) {
      appendListText(signals, describeSignal(signal));
    }
    recommendation.hidden = true;
    return;
  }

  chip.className = `chip chip-${incident.status === 'resolved' ? 'success' : 'critical'}`;
  chip.textContent = {
    awaiting: 'AGUARDANDO APROVAÇÃO', mitigating: 'RESPONDENDO', rejected: 'AÇÃO REJEITADA',
    resolved: 'VALIDADO', interrupted: 'INTERROMPIDO', normalized: 'ENCERRADO MANUALMENTE',
  }[incident.status] ?? 'EM ANÁLISE';
  marker.classList.add(incident.status === 'resolved' ? '' : 'critical');
  marker.textContent = incident.status === 'resolved' ? '✓' : '!';
  heading.textContent = incident.title;
  description.textContent = incident.status === 'resolved'
    ? 'A solução simulada terminou e os números voltaram ao normal.'
    : incident.status === 'rejected'
      ? 'Você não aprovou a solução. O problema continua até você decidir novamente ou voltar ao normal.'
      : incident.explanation;

  for (const signal of incident.observations) appendListText(signals, describeSignal(signal));
  if (!incident.observations.length) appendListText(signals, 'Nenhum sinal disponível.');
  recommendation.hidden = incident.status === 'resolved';
  if (!recommendation.hidden) {
    $('recommendationTitle').textContent = incident.recommendation.label;
    $('recommendationDescription').textContent = incident.recommendation.description;
    $('recommendationSafeguard').textContent = incident.recommendation.safeguard;
    decisionButtons.hidden = incident.status !== 'awaiting' && incident.status !== 'rejected';
    $('approveButton').textContent = incident.status === 'rejected' ? 'Aprovar agora' : 'Aprovar solução simulada';
  }
}

function describeSignal(signal) {
  const label = signal.status === 'critical' ? 'CRÍTICO' : 'ATENÇÃO';
  const value = formatMetric(signal.value, METRICS.find(metric => metric.key === signal.key));
  return `${label} · ${signal.label}: ${value} (atenção ≥ ${signal.warn}, crítico ≥ ${signal.critical})`;
}

function appendListText(list, text) {
  const item = document.createElement('li');
  item.textContent = text;
  list.append(item);
}

function renderEvents() {
  const list = $('activityList');
  list.replaceChildren();
  const events = state.events.length ? state.events.slice(0, 9) : [{timestamp: datetime(), kind:'normal',title:'Monitoramento iniciado',detail:'Cenários de API e banco preparados para demonstração.'}];
  for (const event of events) {
    const li = document.createElement('li');
    const icon = document.createElement('span');
    icon.className = `event-icon ${event.kind}`;
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = {normal:'·',warning:'!',critical:'!',success:'✓'}[event.kind] ?? '·';
    const content = document.createElement('div');
    content.className = 'event-content';
    const top = document.createElement('div');
    top.className = 'event-topline';
    const title = document.createElement('strong');
    title.textContent = event.title;
    const time = document.createElement('time');
    time.dateTime = event.timestamp;
    time.textContent = localTime(event.timestamp);
    top.append(title,time);
    const p = document.createElement('p');
    p.textContent = event.detail;
    content.append(top,p);
    li.append(icon,content);
    list.append(li);
  }
}

const STATUS_LABELS = { awaiting:'Aguardando aprovação', mitigating:'Em resposta', rejected:'Rejeitado', resolved:'Resolvido', interrupted:'Interrompido', normalized:'Normalizado manualmente' };

function renderHistory() {
  $('incidentCount').textContent = String(state.incidents.length).padStart(2,'0');
  $('sideIncidentCount').textContent = String(state.incidents.length);
  const rows = $('incidentRows');
  rows.replaceChildren();
  if (!state.incidents.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'empty-state';
    td.textContent = 'Nenhum incidente registrado. Execute uma simulação para gerar evidências.';
    tr.append(td);
    rows.append(tr);
    $('incidentDetail').hidden = true;
    return;
  }
  for (const incident of state.incidents) {
    const row = document.createElement('tr');
    const columns = [incident.id, localDateTime(incident.createdAt), incident.title, `${incident.riskScore}/100`];
    for (const [index,value] of columns.entries()) {
      const td = document.createElement('td');
      td.textContent = value;
      if (index === 0) td.className = 'code';
      row.append(td);
    }
    const statusCell = document.createElement('td');
    const status = document.createElement('span');
    status.className = `chip chip-${incident.status === 'resolved' ? 'success' : incident.status === 'awaiting' || incident.status === 'mitigating' ? 'critical' : 'warning'}`;
    status.textContent = STATUS_LABELS[incident.status] ?? incident.status;
    statusCell.append(status);
    row.append(statusCell);
    const actionCell = document.createElement('td');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'table-action';
    button.textContent = 'Evidências';
    button.setAttribute('aria-label', `Ver evidências do incidente ${incident.id}`);
    button.addEventListener('click', () => showIncidentDetail(incident.id));
    actionCell.append(button);
    row.append(actionCell);
    rows.append(row);
  }
  if (state.viewedIncidentId) showIncidentDetail(state.viewedIncidentId, false);
}

function addDetailGrid(container, label, value) {
  const block = document.createElement('div');
  block.className = 'detail-data';
  const small = document.createElement('span');
  small.className = 'tiny-title';
  small.textContent = label;
  const strong = document.createElement('strong');
  strong.textContent = String(value);
  block.append(small,strong);
  container.append(block);
}
function detailHeading(container, title) {
  const h4 = document.createElement('h4');
  h4.className = 'detail-section-title';
  h4.textContent = title;
  container.append(h4);
}
function showIncidentDetail(id, scroll = true) {
  const incident = state.incidents.find(item => item.id === id);
  if (!incident) { $('incidentDetail').hidden = true; state.viewedIncidentId = null; return; }
  state.viewedIncidentId = id;
  $('incidentDetailTitle').textContent = `${incident.id} · ${incident.title}`;
  const content = $('detailContent');
  content.replaceChildren();
  const grid = document.createElement('div');
  grid.className = 'detail-grid';
  addDetailGrid(grid, 'CRIADO EM', localDateTime(incident.createdAt));
  addDetailGrid(grid, 'SITUAÇÃO', STATUS_LABELS[incident.status] ?? incident.status);
  addDetailGrid(grid, 'TEMPO NO LABORATÓRIO', incident.resolutionMs == null ? 'Não verificado' : `${(incident.resolutionMs / 1000).toFixed(1).replace('.', ',')} s`);
  content.append(grid);
  detailHeading(content, 'Interpretação da ocorrência');
  const explanation = document.createElement('p');
  explanation.className = 'detail-copy';
  explanation.textContent = incident.explanation;
  content.append(explanation);
  detailHeading(content, 'Evidências observadas');
  const evidence = document.createElement('ul');
  evidence.className = 'detail-list';
  for (const signal of incident.observations) appendListText(evidence, describeSignal(signal));
  content.append(evidence);
  detailHeading(content, 'Recomendação e decisões');
  const decision = document.createElement('p');
  decision.className = 'detail-copy';
  decision.textContent = `${incident.recommendation.label}. ${incident.recommendation.description}`;
  content.append(decision);
  const actions = document.createElement('ul');
  actions.className = 'detail-list';
  if (!incident.actions.length) appendListText(actions, 'Aguardando decisão do operador.');
  for (const action of incident.actions) appendListText(actions, `${localDateTime(action.timestamp)} — ${action.detail}`);
  content.append(actions);
  $('incidentDetail').hidden = false;
  if (scroll) $('incidentDetail').scrollIntoView({behavior:'smooth',block:'nearest'});
}

function renderThresholds() {
  const tbody = $('thresholdRows');
  tbody.replaceChildren();
  const sourceLabels = { api:'API PIX', database:'Banco de dados', infrastructure:'Infraestrutura' };
  for (const metric of METRICS) {
    const tr = document.createElement('tr');
    for (const value of [metric.label, `${metric.warn} ${metric.unit}`, `${metric.critical} ${metric.unit}`, sourceLabels[metric.source]]) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    tbody.append(tr);
  }
}

function updateControls() {
  const locked = state.phase === 'injecting' || state.phase === 'mitigating';
  $('startScenario').disabled = locked || Boolean(currentIncident());
  $('scenarioSelect').disabled = locked;
  $('restoreBaseline').disabled = state.phase === 'mitigating';
  $('clearHistory').disabled = locked || Boolean(currentIncident());
  $('startScenario').textContent = state.phase === 'injecting' ? 'Analisando...' : 'Executar cenário';
}

function clearTimers() {
  for (const timer of state.timers) clearTimeout(timer);
  state.timers = [];
}
function queue(task, delay) { state.timers.push(setTimeout(task,delay)); }
function recordAction(incident, type, detail) {
  incident.actions.push({ type, detail, timestamp: datetime() });
  incident.updatedAt = datetime();
  persist();
}

function startScenario() {
  if (state.phase !== 'idle' || currentIncident()) {
    setFeedback('Finalize ou normalize o incidente aberto antes de iniciar outro cenário.', true);
    return;
  }
  const scenarioId = $('scenarioSelect').value;
  const scenario = SCENARIOS[scenarioId];
  if (!scenario) return;
  state.phase = 'injecting';
  updateControls();
  setFeedback(`Cenário iniciado: ${scenario.title}. Coletando três amostras sequenciais…`, true);
  addEvent('normal', 'Cenário iniciado', `${scenario.title}. Telemetria exclusivamente sintética.`);

  scenario.frames.forEach((frame,index) => queue(() => {
    appendSample(frame);
    const result = evaluateTelemetry(frame);
    if (index < scenario.frames.length - 1) {
      addEvent('warning', `Amostra ${index + 1} / 3`, `${result.warnings.length} sinais de atenção; ${result.critical.length} críticos. Política reavaliada.`);
      return;
    }
    const id = `MIND-${new Date().toISOString().replace(/\D/g,'').slice(0,14)}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
    const incident = createIncident({ id, scenarioId, snapshot: frame, timestamp: datetime() });
    state.incidents.unshift(incident);
    state.incidents = state.incidents.slice(0, MAX_HISTORY);
    state.activeId = id;
    state.phase = 'idle';
    persist();
    addEvent('critical', 'Incidente crítico detectado', `${id}: ${incident.explanation}`, id);
    addEvent('warning', 'Aprovação necessária', `${incident.recommendation.label}. Nenhuma resposta será realizada sem aprovação.`, id);
    renderTelemetry();
    renderHistory();
    updateControls();
    setFeedback(`Incidente ${id} aberto. Revise as evidências e decida aprovar ou rejeitar a ação.`, true);
  }, STEP_MS * (index + 1)));
}

function approveResponse() {
  const incident = currentIncident();
  if (!incident || !['awaiting','rejected'].includes(incident.status)) return;
  incident.status = 'mitigating';
  state.phase = 'mitigating';
  recordAction(incident, 'approved', 'Operador da demonstração aprovou a resposta simulada.');
  addEvent('warning', 'Intervenção aprovada', `Resposta iniciada: ${incident.recommendation.label}.`, incident.id);
  renderTelemetry();
  renderHistory();
  updateControls();
  setFeedback('Executando apenas a simulação de recuperação e verificando os limites...', true);

  const intermediate = Object.fromEntries(METRICS.map(metric => [metric.key,
    Number(((state.telemetry[metric.key] + BASELINE[metric.key]) / 2).toFixed(metric.decimals))
  ]));
  queue(() => {
    appendSample(intermediate);
    addEvent('normal', 'Recuperação em andamento', 'Os valores sintéticos estão retornando à faixa esperada.', incident.id);
  }, 700);
  queue(() => {
    appendSample(BASELINE);
    const finalCheck = evaluateTelemetry(state.telemetry);
    if (finalCheck.severity === 'healthy') {
      incident.status = 'resolved';
      incident.resolvedAt = datetime();
      incident.resolutionMs = Math.max(0, Date.parse(incident.resolvedAt) - Date.parse(incident.createdAt));
      recordAction(incident, 'verified', 'Validação aprovada: todas as métricas simuladas voltaram à faixa saudável.');
      addEvent('success', 'Recuperação validada', `${incident.id}: métricas dentro dos limites. Tempo medido apenas no laboratório.`, incident.id);
      setFeedback(`Resposta validada. O tempo indicado no histórico refere-se exclusivamente à demonstração.`);
    } else {
      incident.status = 'interrupted';
      recordAction(incident, 'verification_failed', 'Validação não confirmou normalidade; o incidente não foi marcado como resolvido.');
      addEvent('critical', 'Verificação falhou', 'O ambiente não retornou aos limites seguros.', incident.id);
      setFeedback('Verificação falhou. O incidente permanece registrado.', true);
    }
    state.activeId = null;
    state.phase = 'idle';
    renderTelemetry();
    renderHistory();
    updateControls();
  }, 1700);
}

function rejectResponse() {
  const incident = currentIncident();
  if (!incident || incident.status !== 'awaiting') return;
  incident.status = 'rejected';
  recordAction(incident, 'rejected', 'Operador da demonstração rejeitou a recomendação; nenhuma intervenção foi executada.');
  addEvent('critical', 'Ação rejeitada', `${incident.id} permanece sem recuperação. O operador pode reconsiderar ou normalizar manualmente.`, incident.id);
  renderTelemetry();
  renderHistory();
  updateControls();
  setFeedback('Ação rejeitada e registrada. O incidente continua aberto.', true);
}

function restoreBaseline() {
  if (state.phase === 'mitigating') return;
  clearTimers();
  const incident = currentIncident();
  if (incident) {
    incident.status = 'normalized';
    recordAction(incident, 'manual_reset', 'Operador encerrou manualmente o cenário; não ocorreu resposta automática nem validação de remediação.');
    addEvent('warning', 'Normalização manual', `${incident.id}: o cenário foi encerrado sem atribuir sucesso à recomendação.`, incident.id);
  } else {
    addEvent('normal', 'Ambiente normalizado', 'Valores de referência da demonstração restaurados manualmente.');
  }
  state.phase = 'idle';
  state.activeId = null;
  appendSample(BASELINE);
  renderHistory();
  updateControls();
  setFeedback('Ambiente reiniciado para os valores de referência. Histórico preservado.');
}

function csvEscape(value) {
  let str = String(value ?? '');
  // Evita que planilhas executem fórmulas nos campos exportados.
  if (/^[=+@\-\t\r]/.test(str)) str = `'${str}`;
  return `"${str.replaceAll('"','""')}"`;
}
function downloadBlob(contents, type, name) {
  const blob = new Blob([contents], {type});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportJson() {
  const exportable = {
    project: 'Bradesco Mind', kind: 'academic-simulation',
    disclaimer: 'Dados e ações simulados; não há conexão com sistemas bancários.',
    exportedAt: datetime(),
    monitoringSources: ['API PIX simulada','Banco de dados simulado'],
    thresholdPolicy: METRICS.map(({ key,label,source,warn,critical,unit }) => ({key,label,source,warn,critical,unit})),
    criticalRule: 'Dois sinais críticos OU um crítico e dois sinais de atenção; aprovação humana obrigatória.',
    incidents: state.incidents,
    activity: state.events,
  };
  downloadBlob(JSON.stringify(exportable,null,2), 'application/json;charset=utf-8', 'bradesco-mind-evidencias.json');
  setFeedback('Evidências exportadas em JSON.');
}
function exportCsv() {
  const fields = ['id','createdAt','scenarioId','title','severity','riskScore','status','resolvedAt','resolutionMs','explanation'];
  const lines = [fields.map(csvEscape).join(';'),...state.incidents.map(incident => fields.map(field => csvEscape(incident[field])).join(';'))];
  downloadBlob('\uFEFF' + lines.join('\r\n'), 'text/csv;charset=utf-8', 'bradesco-mind-incidentes.csv');
  setFeedback('Histórico exportado em CSV.');
}
function clearHistory() {
  if (state.phase !== 'idle' || currentIncident()) return;
  if (!window.confirm('Apagar todos os incidentes e eventos salvos neste navegador? Esta ação não pode ser desfeita.')) return;
  state.incidents = [];
  state.events = [];
  state.viewedIncidentId = null;
  persist();
  renderHistory();
  renderEvents();
  setFeedback('Histórico local apagado. O ambiente permanece pronto para novas simulações.');
}
function initNavigation() {
  const nav = $('sideNav');
  const button = $('mobileNavToggle');
  button.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    button.setAttribute('aria-expanded', String(opened));
    button.setAttribute('aria-label', opened ? 'Fechar menu' : 'Abrir menu');
  });
  for (const anchor of document.querySelectorAll('.main-nav a')) {
    anchor.addEventListener('click', () => {
      document.querySelectorAll('.main-nav a').forEach(link => {link.classList.remove('active'); link.removeAttribute('aria-current');});
      anchor.classList.add('active');
      anchor.setAttribute('aria-current','page');
      nav.classList.remove('open');
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Abrir menu');
    });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      nav.classList.remove('open');
      button.setAttribute('aria-expanded','false');
    }
  });
}

function init() {
  initNavigation();
  renderThresholds();
  renderTelemetry();
  renderHistory();
  renderEvents();
  updateControls();
  $('scenarioSelect').addEventListener('change', () => {
    $('scenarioDescription').textContent = SCENARIOS[$('scenarioSelect').value].subtitle;
  });
  $('startScenario').addEventListener('click', startScenario);
  $('restoreBaseline').addEventListener('click', restoreBaseline);
  $('approveButton').addEventListener('click', approveResponse);
  $('rejectButton').addEventListener('click', rejectResponse);
  $('exportJsonTop').addEventListener('click', exportJson);
  $('exportCsv').addEventListener('click', exportCsv);
  $('clearHistory').addEventListener('click', clearHistory);
  $('closeDetail').addEventListener('click', () => { state.viewedIncidentId = null; $('incidentDetail').hidden = true; });
  $('localTime').textContent = localTime(datetime());
  setInterval(() => { $('localTime').textContent = localTime(datetime()); }, 1000);
  if (hadInterrupted) {
    persist();
    addEvent('warning','Demonstração interrompida','O navegador foi recarregado; incidentes sem verificação final foram marcados como interrompidos.');
  }
}
init();
