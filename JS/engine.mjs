/**
 * Bradesco Mind — motor determinístico de demonstração.
 * Não consulta APIs bancárias nem executa ações em infraestrutura.
 */
export const BASELINE = Object.freeze({
  latencyMs: 14,
  errorRate: 0.1,
  dbConnections: 42,
  cpuPercent: 28,
  memoryGb: 3.4,
});

export const METRICS = Object.freeze([
  { key: 'latencyMs', label: 'Tempo de resposta do PIX', unit: 'ms', source: 'api', warn: 150, critical: 300, max: 600, decimals: 0 },
  { key: 'errorRate', label: 'Taxa de erros do PIX', unit: '%', source: 'api', warn: 2, critical: 5, max: 10, decimals: 1 },
  { key: 'dbConnections', label: 'Conexões no banco', unit: '/100', source: 'database', warn: 75, critical: 90, max: 100, decimals: 0 },
  { key: 'cpuPercent', label: 'CPU do serviço', unit: '%', source: 'infrastructure', warn: 75, critical: 90, max: 100, decimals: 0 },
  { key: 'memoryGb', label: 'Memória utilizada', unit: 'GB / 8 GB', source: 'infrastructure', warn: 6, critical: 7.3, max: 8, decimals: 1 },
]);

// Três testes reproduzíveis: uma falha na API, no banco ou nos dois componentes.
export const SCENARIOS = Object.freeze({
  api: {
    title: 'PIX lento',
    subtitle: 'O PIX fica lento e alguns pedidos falham.',
    frames: [
      { latencyMs: 186, errorRate: 1.1, dbConnections: 45, cpuPercent: 44, memoryGb: 4.1 },
      { latencyMs: 329, errorRate: 3.8, dbConnections: 47, cpuPercent: 57, memoryGb: 4.5 },
      { latencyMs: 487, errorRate: 7.6, dbConnections: 51, cpuPercent: 71, memoryGb: 5.1 },
    ],
  },
  database: {
    title: 'Banco de dados sobrecarregado',
    subtitle: 'O banco de dados recebe muitas conexões ao mesmo tempo.',
    frames: [
      { latencyMs: 92, errorRate: 0.5, dbConnections: 78, cpuPercent: 57, memoryGb: 5.8 },
      { latencyMs: 188, errorRate: 1.8, dbConnections: 89, cpuPercent: 80, memoryGb: 6.5 },
      { latencyMs: 267, errorRate: 4.2, dbConnections: 98, cpuPercent: 94, memoryGb: 7.7 },
    ],
  },
  cascade: {
    title: 'Vários problemas ao mesmo tempo',
    subtitle: 'O PIX e o banco de dados apresentam problemas juntos.',
    frames: [
      { latencyMs: 181, errorRate: 2.2, dbConnections: 80, cpuPercent: 65, memoryGb: 5.9 },
      { latencyMs: 288, errorRate: 4.6, dbConnections: 88, cpuPercent: 84, memoryGb: 6.9 },
      { latencyMs: 522, errorRate: 9.3, dbConnections: 99, cpuPercent: 97, memoryGb: 7.9 },
    ],
  },
});

export const REMEDIATIONS = Object.freeze({
  api: {
    label: 'Diminuir o número de pedidos ao PIX',
    description: 'Simular menos pedidos ao PIX e conferir se o tempo de resposta melhora.',
    safeguard: 'Somente demonstração local; não existe endpoint de execução real.',
  },
  database: {
    label: 'Liberar conexões não utilizadas',
    description: 'Simular liberação de conexões sem uso e conferir se a quantidade volta ao normal.',
    safeguard: 'Exige aprovação humana; não altera um banco de dados real.',
  },
  cascade: {
    label: 'Reduzir a carga do PIX e do banco',
    description: 'Simular menos pedidos ao PIX e liberar conexões sem uso no banco.',
    safeguard: 'Ação conjunta exige aprovação humana; nenhum serviço externo é acessado.',
  },
});

export function metricStatus(value, metric) {
  if (!Number.isFinite(value)) return 'unknown';
  if (value >= metric.critical) return 'critical';
  if (value >= metric.warn) return 'warning';
  return 'healthy';
}

export function evaluateTelemetry(snapshot) {
  const observations = METRICS.map(metric => {
    const value = snapshot[metric.key];
    return {
      key: metric.key,
      label: metric.label,
      source: metric.source,
      value,
      warn: metric.warn,
      critical: metric.critical,
      unit: metric.unit,
      status: metricStatus(value, metric),
    };
  });

  const critical = observations.filter(item => item.status === 'critical');
  const warnings = observations.filter(item => item.status === 'warning');
  const unknown = observations.filter(item => item.status === 'unknown');
  const severity = unknown.length
    ? 'unknown'
    : critical.length >= 2 || (critical.length >= 1 && warnings.length >= 2)
      ? 'critical'
      : critical.length || warnings.length ? 'warning' : 'healthy';

  const apiAffected = observations.some(item => item.source === 'api' && item.status !== 'healthy');
  const dbAffected = observations.some(item => item.source === 'database' && item.status !== 'healthy');
  const apiCritical = critical.some(item => item.source === 'api');
  const dbCritical = critical.some(item => item.source === 'database');
  const scenario = apiCritical && dbCritical ? 'cascade' : dbCritical ? 'database' : 'api';
  const affectedSources = [...new Set(
    [...critical, ...warnings].map(item => item.source)
  )];
  const riskScore = Math.min(100, Math.round(
    3 + critical.length * 23 + warnings.length * 9 + (apiAffected && dbAffected ? 12 : 0)
  ));

  const explanation = severity === 'critical'
    ? `${critical.length} sinal(is) crítico(s) e ${warnings.length} sinal(is) de atenção. ${apiAffected && dbAffected ? 'API e banco apresentam degradação correlacionada; isso não comprova causalidade.' : 'Alguns indicadores passaram dos limites definidos.'}`
    : severity === 'warning'
      ? 'Alguns números ficaram acima do normal. É melhor acompanhar antes de agir.'
      : severity === 'unknown'
        ? 'Faltam números para saber se está tudo bem.'
        : 'Todos os indicadores estão dentro dos limites esperados.';

  return {
    severity,
    riskScore: unknown.length ? null : riskScore,
    observations,
    critical,
    warnings,
    unknown,
    affectedSources,
    scenario,
    remediation: severity === 'critical' ? REMEDIATIONS[scenario] : null,
    explanation,
  };
}

export function createIncident({ id, scenarioId, snapshot, timestamp }) {
  const analysis = evaluateTelemetry(snapshot);
  if (analysis.severity !== 'critical') throw new Error('Uma ocorrência requer telemetria crítica.');
  return {
    id,
    scenarioId,
    title: SCENARIOS[scenarioId]?.title ?? 'Anomalia monitorada',
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'awaiting',
    severity: analysis.severity,
    riskScore: analysis.riskScore,
    affectedSources: analysis.affectedSources,
    explanation: analysis.explanation,
    observations: analysis.observations.filter(x => x.status !== 'healthy'),
    snapshot: { ...snapshot },
    recommendation: { ...analysis.remediation },
    actions: [],
    resolvedAt: null,
    resolutionMs: null,
  };
}

export function formatMetric(value, metric) {
  if (!Number.isFinite(value)) return '—';
  const number = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: metric.decimals,
    maximumFractionDigits: metric.decimals,
  }).format(value);
  if (metric.key === 'dbConnections') return `${number} / 100`;
  if (metric.key === 'memoryGb') return `${number} GB`;
  return `${number} ${metric.unit}`;
}
