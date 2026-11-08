import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE, METRICS, SCENARIOS, evaluateTelemetry, metricStatus, createIncident, formatMetric } from '../JS/engine.mjs';

test('baseline é saudável, com dados de duas fontes monitoradas', () => {
  const r = evaluateTelemetry(BASELINE);
  assert.equal(r.severity, 'healthy');
  assert.equal(r.critical.length, 0);
  assert.ok(new Set(METRICS.map(m => m.source)).has('api'));
  assert.ok(new Set(METRICS.map(m => m.source)).has('database'));
});

test('limiares de atenção e críticos são inclusivos', () => {
  const m = METRICS[0];
  assert.equal(metricStatus(m.warn - 1, m), 'healthy');
  assert.equal(metricStatus(m.warn, m), 'warning');
  assert.equal(metricStatus(m.critical, m), 'critical');
  assert.equal(metricStatus(NaN, m), 'unknown');
});

test('todos os cenários produzem incidente crítico reproduzível', () => {
  for (const scenario of Object.values(SCENARIOS)) {
    assert.equal(evaluateTelemetry(scenario.frames[0]).severity, 'warning');
    const result = evaluateTelemetry(scenario.frames.at(-1));
    assert.equal(result.severity, 'critical');
    assert.ok(result.riskScore >= 40);
    assert.ok(result.remediation.label);
  }
});

test('falha correlacionada identifica API e banco, sem afirmar causalidade', () => {
  const result = evaluateTelemetry(SCENARIOS.cascade.frames.at(-1));
  assert.equal(result.scenario, 'cascade');
  assert.ok(result.affectedSources.includes('api'));
  assert.ok(result.affectedSources.includes('database'));
  assert.match(result.explanation, /não comprova causalidade/);
});

test('ocorrência guarda snapshot, evidências e recomendação', () => {
  const created = createIncident({
    id: 'INC-TESTE', scenarioId: 'api',
    snapshot: SCENARIOS.api.frames.at(-1), timestamp: '2026-11-07T18:00:00.000Z',
  });
  assert.equal(created.status, 'awaiting');
  assert.ok(created.observations.length >= 2);
  assert.ok(created.recommendation.safeguard);
  assert.equal(created.snapshot.latencyMs, 487);
});

test('não abre incidente com telemetria saudável', () => {
  assert.throws(() => createIncident({id:'INC-0', scenarioId:'api', snapshot: BASELINE, timestamp: new Date().toISOString()}));
});

test('valor ausente nunca vira estado saudável', () => {
  const result = evaluateTelemetry({...BASELINE, latencyMs: undefined});
  assert.equal(result.severity, 'unknown');
  assert.equal(result.riskScore, null);
});

test('formatação numérica tem padrão pt-BR', () => {
  assert.equal(formatMetric(3.4, METRICS[4]), '3,4 GB');
  assert.equal(formatMetric(42, METRICS[2]), '42 / 100');
});

test('as recomendações refletem os três tipos de falha', () => {
  const api = evaluateTelemetry(SCENARIOS.api.frames.at(-1));
  const db = evaluateTelemetry(SCENARIOS.database.frames.at(-1));
  const cascade = evaluateTelemetry(SCENARIOS.cascade.frames.at(-1));
  assert.equal(api.scenario, 'api');
  assert.equal(db.scenario, 'database');
  assert.equal(cascade.scenario, 'cascade');
  assert.notEqual(api.remediation.label, db.remediation.label);
  assert.notEqual(cascade.remediation.label, db.remediation.label);
});

test('a política tem risco limitado a 100 mesmo em uma cascata', () => {
  const a = evaluateTelemetry(SCENARIOS.cascade.frames.at(-1));
  assert.ok(a.riskScore <= 100);
  assert.equal(a.riskScore, 100);
});

test('a análise de atenção não sugere intervenção', () => {
  const a = evaluateTelemetry(SCENARIOS.api.frames[0]);
  assert.equal(a.severity, 'warning');
  assert.equal(a.remediation, null);
});
